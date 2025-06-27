import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Returns a Supabase SSR client with cookie adapter
 * @param cookieStore - a ReadonlyRequestCookies instance (from await cookies())
 * @param setCookies - optional function to set cookies (for API routes)
 */
export function createSupabaseServerClient(cookieStore: any, setCookies?: (cookies: { name: string, value: string, options: any }[]) => void) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: setCookies
        ? (cookiesToSet) => setCookies(cookiesToSet)
        : () => {},
    },
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side shouldn't persist
      detectSessionInUrl: false,
    },
  });
}