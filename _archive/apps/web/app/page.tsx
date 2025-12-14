// File: app/page.tsx
// Purpose: SSR Root page that redirects based on session status

import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
