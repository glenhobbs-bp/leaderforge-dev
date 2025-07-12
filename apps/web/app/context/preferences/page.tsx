/**
 * Purpose: Schema-driven Prompt Context Management Page - Server Protected
 * Owner: Prompt Management System
 * Tags: [prompt-contexts, schema-driven, agent-native, widget-based, server-auth]
 */

import React from 'react';
import { createSupabaseServerClient } from '../../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ContextPreferencesClient from './ContextPreferencesClient';

export default async function PromptContextsPage() {
  // Server-side authentication check with multiple fallbacks
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    session = data.session;

    if (error) {
      console.error('[context-preferences] Auth error:', error);
      redirect('/login');
    }
  } catch (error) {
    console.error('[context-preferences] Session check failed:', error);
    redirect('/login');
  }

  // STRICT CHECK: No session or user = immediate redirect
  if (!session || !session.user || !session.access_token) {
    console.log('[context-preferences] No valid session - redirecting to login');
    redirect('/login');
  }

  // Additional verification: Check if user ID exists
  if (!session.user.id) {
    console.log('[context-preferences] No user ID - redirecting to login');
    redirect('/login');
  }

  console.log('[context-preferences] ✅ Authentication successful for user:', session.user.id);

  return <ContextPreferencesClient />;
}