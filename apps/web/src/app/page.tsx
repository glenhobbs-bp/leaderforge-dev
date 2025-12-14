/**
 * File: src/app/page.tsx
 * Purpose: Landing page / redirect to dashboard
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // If not logged in, redirect to login
  redirect('/login');
}

