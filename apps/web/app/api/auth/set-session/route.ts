// File: apps/web/app/api/auth/set-session/route.ts
'use server';

import { NextResponse } from 'next/server';

const accessTokenCookie = 'sb-pcjaagjqydyqfsthsmac-auth-token';
const refreshTokenCookie = 'sb-pcjaagjqydyqfsthsmac-refresh-token';

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