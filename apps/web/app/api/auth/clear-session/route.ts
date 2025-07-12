// File: apps/web/app/api/auth/clear-session/route.ts
// Purpose: Clear corrupted authentication cookies to prevent login loops
// Owner: Backend team
// Tags: authentication, session management, cookie cleanup

import { NextResponse } from 'next/server';
import { getProjectRef } from '../../../lib/supabaseServerClient';

export async function POST() {
  console.log('[clear-session] Clearing authentication cookies');

  const response = NextResponse.json({
    success: true,
    message: 'Authentication cookies cleared'
  });

  // Clear all authentication-related cookies
  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  const projectRef = getProjectRef(); // Assuming getProjectRef is imported or defined
  const authCookieName = `sb-${projectRef}-auth-token`;

  response.cookies.set(authCookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}