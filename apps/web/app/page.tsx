// File: app/page.tsx
// Purpose: SSR Root page that redirects based on session status

import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  let finalSession = null;

  // Use the same session restoration logic as dashboard
  if (accessToken && refreshToken) {
    try {
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
    } catch (error) {
      console.warn('[page] Session restoration failed:', error);
    }
  }

  // Only get session if we haven't already restored it
  if (!finalSession) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    finalSession = session;
  }

  if (finalSession?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
