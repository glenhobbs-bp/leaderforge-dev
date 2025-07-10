// apps/web/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get cookie names from environment variable
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
if (!projectRef) {
  throw new Error('NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set');
}

const accessTokenCookie = `sb-${projectRef}-auth-token`;
const refreshTokenCookie = `sb-${projectRef}-refresh-token`;

/**
 * Handles Supabase auth redirect and sets cookies for SSR session access.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const access_token = url.searchParams.get('access_token');
  const refresh_token = url.searchParams.get('refresh_token');
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  const response = NextResponse.redirect(redirectTo);

  if (access_token) {
    response.cookies.set(accessTokenCookie, access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (refresh_token) {
    response.cookies.set(refreshTokenCookie, refresh_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}