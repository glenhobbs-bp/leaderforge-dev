// File: apps/web/app/api/auth/clear-session/route.ts
// Purpose: Clear corrupted authentication cookies to prevent login loops
// Owner: Backend team
// Tags: authentication, session management, cookie cleanup

import { NextResponse } from 'next/server';

// Get cookie names from environment variable
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
if (!projectRef) {
  throw new Error('NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set');
}

const accessTokenCookie = `sb-${projectRef}-auth-token`;
const refreshTokenCookie = `sb-${projectRef}-refresh-token`;

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Session cookies cleared' });

    // Clear both auth cookies
    response.cookies.set(accessTokenCookie, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
    });

    response.cookies.set(refreshTokenCookie, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
    });

    console.log('[clear-session] ✅ Cleared corrupted auth cookies');
    return response;
  } catch (err) {
    console.error('[clear-session] ❌ Error clearing cookies:', err);
    return NextResponse.json({ success: false, error: 'Failed to clear cookies' }, { status: 500 });
  }
}