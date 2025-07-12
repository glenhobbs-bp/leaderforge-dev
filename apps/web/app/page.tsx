// File: app/page.tsx
// Purpose: SSR Root page that redirects based on session status

import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Extract project reference from Supabase URL (same as middleware)
function getProjectRef(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const projectRef = getProjectRef();
  if (!projectRef) {
    console.error('[page] Failed to extract project reference from SUPABASE_URL');
    redirect('/login?error=config_error');
  }

  const authCookie = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  let finalSession = null;

  // SECURITY FIX: Only attempt session restoration with valid authentication cookies
  // This prevents automatic session creation without proper authentication
  if (authCookie) {
    try {
      // Parse the cookie value - it's in JSON array format: [access_token, null, refresh_token, null, null]
      const tokens = JSON.parse(authCookie);
      const accessToken = Array.isArray(tokens) ? tokens[0] : tokens.access_token;
      const refreshToken = Array.isArray(tokens) ? tokens[2] : tokens.refresh_token;

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.warn('[page] setSession error:', error);
        } else if (data.session) {
          console.log('[page] Session restored successfully');
          finalSession = data.session;
        }
      } else {
        console.warn('[page] Invalid tokens in auth cookie');
      }
    } catch (error) {
      console.warn('[page] Session restoration failed:', error);
    }
  }

  // SECURITY FIX: Never call getSession() without authentication cookies
  // This was automatically creating sessions and bypassing authentication
  // If no valid authentication cookie exists, redirect to login immediately
  if (!finalSession) {
    console.log('[page] No valid authentication session found - redirecting to login');
    redirect('/login');
  }

  if (finalSession?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
