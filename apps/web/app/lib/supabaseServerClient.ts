import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Returns a Supabase SSR client with cookie adapter
 * @param cookieStore - a ReadonlyRequestCookies instance (from await cookies())
 */
export function createSupabaseServerClient(cookieStore: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // For API routes/middleware, you can add setAll here
      // setAll: (cookiesToSet) => { ... }
    },
  });
}