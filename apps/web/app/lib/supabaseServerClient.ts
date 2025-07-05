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

  // Use the hardcoded project ref that matches our auth setup
  const projectRef = 'pcjaagjqydyqfsthsmac';

  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  let session = null;
  let sessionError = null;

  // Quick check: if no tokens exist, skip expensive auth attempts
  if (!accessToken || !refreshToken) {
    const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
    return { session: currentSession, supabase, error: currentError };
  }

  // Attempt session restoration with timeout
  try {
    const authPromise = supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Add 3-second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    );

    const setSessionRes = await Promise.race([authPromise, timeoutPromise]) as any;

    if (setSessionRes.error) {
      // Only try refresh if it's a JWT error and we have time
      if (setSessionRes.error.message?.includes('JWT') ||
          setSessionRes.error.message?.includes('expired')) {

        const refreshPromise = supabase.auth.refreshSession();
        const refreshTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refresh timeout')), 2000)
        );

        try {
          const refreshRes = await Promise.race([refreshPromise, refreshTimeoutPromise]) as any;
          if (!refreshRes.error) {
            session = refreshRes.data.session;
          } else {
            sessionError = refreshRes.error;
          }
        } catch (error) {
          sessionError = error;
        }
      } else {
        sessionError = setSessionRes.error;
      }
    } else {
      session = setSessionRes.data.session;
    }
  } catch (error) {
    sessionError = error;
  }

  // Final fallback session check (quick)
  if (!session) {
    const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
    session = currentSession;
    if (currentError && !sessionError) {
      sessionError = currentError;
    }
  }

  return { session, supabase, error: sessionError };
}