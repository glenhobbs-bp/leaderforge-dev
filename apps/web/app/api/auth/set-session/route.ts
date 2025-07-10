// File: apps/web/app/api/auth/set-session/route.ts
'use server';

import { NextResponse } from 'next/server';

// Get cookie names from environment variable
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
if (!projectRef) {
  throw new Error('NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set');
}

const accessTokenCookie = `sb-${projectRef}-auth-token`;
const refreshTokenCookie = `sb-${projectRef}-refresh-token`;

// CORS headers for Vercel production deployment
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const access_token = Array.isArray(body.access_token)
      ? body.access_token[0]
      : body.access_token;

    const refresh_token = Array.isArray(body.refresh_token)
      ? body.refresh_token[0]
      : body.refresh_token;

    const response = NextResponse.json({ success: true });

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Handle logout - clear cookies when session is null
    if (body.session === null) {
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

      console.log('[set-session] ✅ Cleared auth cookies for logout');
      return response;
    }

    // Validate tokens before setting cookies
    if (!access_token || !refresh_token) {
      console.error('[set-session] ❌ Missing required tokens');
      const errorResponse = NextResponse.json({ success: false, error: 'Missing tokens' }, { status: 400 });
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Basic token format validation (JWT should have 3 parts separated by dots)
    const accessTokenParts = access_token.split('.');
    const refreshTokenValid = refresh_token && refresh_token.length > 10; // Basic length check

    if (accessTokenParts.length !== 3 || !refreshTokenValid) {
      console.error('[set-session] ❌ Invalid token format');
      const errorResponse = NextResponse.json({ success: false, error: 'Invalid token format' }, { status: 400 });
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Handle login - set cookies with validated tokens
    response.cookies.set(accessTokenCookie, access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set(refreshTokenCookie, refresh_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log('[set-session] ✅ Successfully set auth cookies');
    return response;
  } catch (err) {
    console.error('[set-session] ❌ Error setting cookies:', err);
    const errorResponse = NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}