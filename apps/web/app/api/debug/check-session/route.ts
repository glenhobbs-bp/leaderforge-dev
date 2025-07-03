/**
 * File: apps/web/app/api/debug/check-session/route.ts
 * Purpose: Debug endpoint to check current session metadata
 * Owner: Engineering Team
 * Tags: #debug #auth #session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { session, error } = await restoreSession(cookieStore);

    if (error || !session) {
      return NextResponse.json({
        error: 'No session found',
        details: error
      }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        app_metadata: session.user.app_metadata,
        is_admin_in_metadata: session.user.user_metadata?.is_admin,
        is_admin_in_app_metadata: session.user.app_metadata?.is_admin,
      },
      session_expires_at: session.expires_at,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}