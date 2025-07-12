// File: app/page.tsx
// Purpose: SSR Root page that redirects based on session status

import { restoreSession } from '@/lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();

  // Use the same session restoration logic as all working API routes
  const { session, error } = await restoreSession(cookieStore);

  console.log('[page] Session restoration result:', {
    hasSession: !!session,
    userId: session?.user?.id,
    hasError: !!error
  });

  // SECURITY FIX: Only redirect to dashboard with valid session
  // If no valid session exists, redirect to login immediately
  if (!session?.user) {
    console.log('[page] No valid session found - redirecting to login');
    redirect('/login');
  }

  console.log('[page] Valid session found - redirecting to dashboard');
  redirect('/dashboard');
}
