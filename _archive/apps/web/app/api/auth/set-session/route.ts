// File: apps/web/app/api/auth/set-session/route.ts
'use server';

import { NextResponse } from 'next/server';

const accessTokenCookie = 'sb-pcjaagjqydyqfsthsmac-auth-token';
const refreshTokenCookie = 'sb-pcjaagjqydyqfsthsmac-refresh-token';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const access_token = Array.isArray(body.access_token)
      ? body.access_token[0]
      : body.access_token;

    const refresh_token = Array.isArray(body.refresh_token)
      ? body.refresh_token[0]
      : body.refresh_token;

    console.log('[set-session] ✅ Preparing to set cookies...');
    console.log('[set-session] typeof access_token:', typeof access_token, '| Value:', access_token);
    console.log('[set-session] typeof refresh_token:', typeof refresh_token, '| Value:', refresh_token);

    const response = NextResponse.json({ success: true });

    if (access_token) {
      response.cookies.set(accessTokenCookie, access_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log('[set-session] ✅ Access token cookie set');
    }

    if (refresh_token) {
      response.cookies.set(refreshTokenCookie, refresh_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });
      console.log('[set-session] ✅ Refresh token cookie set');
    }

    return response;
  } catch (err) {
    console.error('[set-session] ❌ Error setting cookies:', err);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}