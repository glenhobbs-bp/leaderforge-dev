import { createServerClient } from '@supabase/ssr';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

/**
 * Returns a Supabase SSR client with cookie adapter
 * @param cookieStore - a ReadonlyRequestCookies instance (from await cookies())
 * @param setCookies - optional function to set cookies (for API routes)
 */
export function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies, setCookies?: (cookies: { name: string, value: string, options: unknown }[]) => void) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: setCookies
        ? (cookiesToSet) => setCookies(cookiesToSet.map(({ name, value, options }) => ({ name, value, options })))
        : () => {},
    },
  });
}

/**
 * Service role client for elevated operations (storage, admin functions)
 * ⚠️ Use sparingly - only for operations that require elevated permissions
 */
export async function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Robust session restoration for API routes that handles both SSR and client-side requests
 * @param cookieStore - ReadonlyRequestCookies instance
 * @returns { session, supabase } - authenticated session and supabase client
 */
export async function restoreSession(cookieStore: ReadonlyRequestCookies) {
  const supabase = createSupabaseServerClient(cookieStore);

  // Get all cookies for manual session restoration
  const allCookies = cookieStore.getAll();

  // Get project ref from environment variable
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  if (!projectRef) {
    console.error('[restoreSession] NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set');
    const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
    return { session: currentSession, supabase, error: currentError };
  }

  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  let session = null;
  let sessionError = null;

  // Quick check: if no tokens exist, skip expensive auth attempts
  if (!accessToken || !refreshToken) {
    const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
    return { session: currentSession, supabase, error: currentError };
  }

  // Validate token format before attempting restoration
  const accessTokenParts = accessToken.split('.');
  const isValidTokenFormat = accessTokenParts.length === 3 && refreshToken.length > 10;

  if (!isValidTokenFormat) {
    console.warn('[restoreSession] Invalid token format detected, skipping restoration');
    return { session: null, supabase, error: new Error('Invalid token format') };
  }

  // Attempt session restoration with timeout and better error handling
  try {
    const authPromise = supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Add 3-second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    );

    const setSessionRes = await Promise.race([authPromise, timeoutPromise]) as Awaited<typeof authPromise>;

    if (setSessionRes.error) {
      const errorMessage = setSessionRes.error.message || '';

      // Only try refresh for specific JWT-related errors, not for all errors
      if ((errorMessage.includes('JWT') || errorMessage.includes('expired') || errorMessage.includes('invalid')) &&
          !errorMessage.includes('refresh_token_not_found')) {

        console.log('[restoreSession] JWT expired, attempting refresh...');

        const refreshPromise = supabase.auth.refreshSession({ refresh_token: refreshToken });
        const refreshTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refresh timeout')), 2000)
        );

        try {
          const refreshRes = await Promise.race([refreshPromise, refreshTimeoutPromise]) as Awaited<typeof refreshPromise>;
          if (!refreshRes.error && refreshRes.data?.session) {
            session = refreshRes.data.session;
            console.log('[restoreSession] Session refresh successful');
          } else {
            sessionError = refreshRes.error || new Error('Refresh failed');
            console.warn('[restoreSession] Session refresh failed:', refreshRes.error?.message);
          }
        } catch (error) {
          sessionError = error;
          console.warn('[restoreSession] Session refresh threw error:', (error as Error).message);
        }
      } else {
        sessionError = setSessionRes.error;
        console.warn('[restoreSession] Session restoration failed:', errorMessage);
      }
    } else {
      session = setSessionRes.data.session;
      console.log('[restoreSession] Session restored successfully');
    }
  } catch (error) {
    sessionError = error;
    console.warn('[restoreSession] Session restoration threw error:', (error as Error).message);
  }

  // Final fallback session check (quick) - only if no session and no critical error
  if (!session && !sessionError) {
    try {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      session = currentSession;
      if (currentError) {
        sessionError = currentError;
      }
    } catch (error) {
      console.warn('[restoreSession] Final session check failed:', (error as Error).message);
    }
  }

  return { session, supabase, error: sessionError };
}