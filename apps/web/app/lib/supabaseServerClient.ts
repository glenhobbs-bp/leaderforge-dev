import { createServerClient } from '@supabase/ssr';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Extract project reference from Supabase URL
export function getProjectRef(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Could not extract project reference from SUPABASE_URL');
  }
  return match[1];
}

/**
 * Returns a Supabase SSR client with cookie adapter
 * @param cookieStore - a ReadonlyRequestCookies instance (from await cookies())
 * @param setCookies - optional function to set cookies (for API routes)
 */
export function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies, setCookies?: (cookies: { name: string, value: string, options: unknown }[]) => void) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value
        }));
      },
      setAll(cookiesToSet) {
        if (setCookies) {
          setCookies(cookiesToSet.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            options: cookie.options
          })));
        }
      }
    }
  });
}

/**
 * Server-side session restoration with security fixes
 * SECURITY: Only restore sessions with valid authentication cookies
 */
export async function restoreSession(cookieStore: ReadonlyRequestCookies, setCookies?: (cookies: { name: string, value: string, options: unknown }[]) => void) {
  const supabase = createSupabaseServerClient(cookieStore, setCookies);

  // Get project reference and auth cookie name
  const projectRef = getProjectRef();
  const authCookieName = `sb-${projectRef}-auth-token`;

  // Debug: Log all available cookies
  const allCookies = cookieStore.getAll();
  console.log('[restoreSession] All available cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value.length })));

  // Get authentication cookie (single JSON cookie format)
  const authCookie = cookieStore.get(authCookieName)?.value;

  console.log('[restoreSession] Token check:', {
    projectRef,
    authCookieName,
    hasAuthCookie: !!authCookie,
    authCookieLength: authCookie?.length || 0,
    totalCookies: allCookies.length
  });

  // SECURITY FIX: Only attempt session restoration when auth cookie exists
  if (!authCookie) {
    console.log('[restoreSession] No authentication cookies - returning null session');
    return { session: null, supabase, error: null };
  }

  // Parse JSON cookie to extract tokens (same format as middleware)
  let tokens;
  try {
    tokens = JSON.parse(authCookie);
  } catch (error) {
    console.log('[restoreSession] Invalid auth cookie format:', error instanceof Error ? error.message : 'parse error');
    return { session: null, supabase, error: new Error('Invalid cookie format') };
  }

  // Parse ADR-0031 standard format: [access_token, null, refresh_token, null, null]
  const accessToken = Array.isArray(tokens) ? tokens[0] : tokens.access_token;
  const refreshToken = Array.isArray(tokens) ? tokens[2] : tokens.refresh_token;

  console.log('[restoreSession] Parsed tokens:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0
  });

  // SECURITY FIX: Only require access token - refresh tokens can be short strings or missing
  if (!accessToken) {
    console.log('[restoreSession] Missing access token in cookie - returning null session');
    return { session: null, supabase, error: null };
  }

  // Log token validation details
  console.log('[restoreSession] Token validation:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
    willAttemptRestore: !!accessToken
  });

  try {
    // Set the session with parsed tokens first, then get the session
    const { data: setData, error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (setError) {
      console.error('[restoreSession] Session restoration failed:', setError);

      // Clear invalid auth cookie if setCookies available
      if (setCookies && (setError.message.includes('invalid') || setError.message.includes('missing'))) {
        setCookies([{
          name: authCookieName,
          value: '',
          options: { maxAge: 0, path: '/' }
        }]);
      }

      return { session: null, supabase, error: setError };
    }

    console.log('[restoreSession] Session status:', {
      hasSession: !!setData.session,
      userId: setData.session?.user?.id
    });

    return {
      session: setData.session,
      supabase,
      error: null
    };
  } catch (err) {
    console.error('[restoreSession] Unexpected error during session restoration:', err);
    return { session: null, supabase, error: err };
  }
}