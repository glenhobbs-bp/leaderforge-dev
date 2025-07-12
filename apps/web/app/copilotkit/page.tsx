/**
 * Purpose: CopilotKit test page (Server-Side Protected)
 * Owner: CopilotKit Integration
 * Tags: [copilotkit, test, server-auth]
 */

import React from 'react';
import { createSupabaseServerClient } from '../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CopilotKitClient from './CopilotKitClient';

export default async function CopilotKitPage() {
  // Server-side authentication check with multiple fallbacks
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    session = data.session;

    if (error) {
      console.error('[copilotkit] Auth error:', error);
      redirect('/login');
    }
  } catch (error) {
    console.error('[copilotkit] Session check failed:', error);
    redirect('/login');
  }

  // STRICT CHECK: No session or user = immediate redirect
  if (!session || !session.user || !session.access_token) {
    console.log('[copilotkit] No valid session - redirecting to login');
    redirect('/login');
  }

  // Additional verification: Check if user ID exists
  if (!session.user.id) {
    console.log('[copilotkit] No user ID - redirecting to login');
    redirect('/login');
  }

  console.log('[copilotkit] ✅ Authentication successful for user:', session.user.id);

  return <CopilotKitClient />;
}
