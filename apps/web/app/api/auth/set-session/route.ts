// File: apps/web/app/api/auth/set-session/route.ts
'use server';

import { NextResponse, type NextRequest } from 'next/server';

// Get cookie names from environment variable
// Note: projectRef check moved inside POST

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    if (!projectRef) {
      return NextResponse.json({ error: 'Project reference not found' }, { status: 500 });
    }

    const accessTokenCookie = `sb-${projectRef}-auth-token`;
    const refreshTokenCookie = `sb-${projectRef}-refresh-token`;

    const { access_token, refresh_token, user } = await request.json();

    // Debug token details
    console.log('[set-session] Token debug: access length', access_token?.length, 'refresh length', refresh_token?.length);
    console.log('[set-session] Access token parts:', access_token ? access_token.split('.').length : 0);
    console.log('[set-session] Refresh token parts:', refresh_token ? refresh_token.split('.').length : 0);

    // Handle logout - clear cookies when user is null
    if (user === null) {
      const response = NextResponse.json({ success: true });
      const isProduction = process.env.NODE_ENV === 'production';
      const clearCookieOptions = {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        maxAge: 0
      };

      response.cookies.set(accessTokenCookie, '', clearCookieOptions);
      response.cookies.set(refreshTokenCookie, '', clearCookieOptions);
      console.log('[set-session] ✅ Cleared auth cookies for logout');
      return response;
    }

    if (!access_token || !refresh_token) {
      console.log('[set-session] Missing access_token or refresh_token');
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
    }

    // Relaxed validation: access must be JWT, refresh just non-empty
    const isValidJWT = (token: string) => token.split('.').length === 3;
    if (!isValidJWT(access_token) || typeof refresh_token !== 'string' || refresh_token.length === 0) {
      console.log('[set-session] Invalid token format');
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const authCookieName = `sb-${projectRef}-auth-token`;
    // Use standard Supabase format per ADR-0031: [access_token, null, refresh_token, null, null]
    const cookieValue = JSON.stringify([access_token, null, refresh_token, null, null]);

    console.log('[set-session] Setting cookie:', authCookieName);
    console.log('[set-session] Cookie value length:', cookieValue.length);
    console.log('[set-session] User ID:', user?.id);
    console.log('[set-session] Using standard Supabase array format per ADR-0031');

        const response = NextResponse.json({ success: true });

        // Cookie configuration for development reliability
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: {
      path: string;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
      maxAge: number;
    } = {
      path: '/',
      httpOnly: true,
      secure: isProduction, // Only secure in production (requires HTTPS)
      sameSite: 'strict', // Use strict for development reliability
      maxAge: 60 * 60 // 1 hour
    };

    console.log('[set-session] Cookie configuration:', {
      name: authCookieName,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge
    });

    response.cookies.set(authCookieName, cookieValue, cookieOptions);

    // CRITICAL: Clear ALL potential Supabase interference cookies
    // Supabase client can set multiple variants that interfere with our auth flow
    const cookiesToClear = [
      'sb-session-disabled',
      `sb-${projectRef}-session-disabled`,
      `sb-${projectRef}-refresh-token`, // Clear any separate refresh token cookie
      'supabase-auth-token', // Legacy format
      'supabase.auth.token', // Another variant
    ];

    cookiesToClear.forEach(cookieName => {
      // Clear with multiple path variants to ensure complete removal
      ['/'].forEach(path => {
        response.cookies.set(cookieName, '', {
          path,
          httpOnly: false, // Some Supabase cookies might be client-side
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0
        });
        // Also clear with httpOnly true variant
        response.cookies.set(cookieName, '', {
          path,
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0
        });
      });
    });

    // Debug: Log what cookies we're actually setting/clearing
    console.log('[set-session] ✅ Successfully set auth cookies and cleared interference cookies:', cookiesToClear);
    console.log('[set-session] 🍪 Final cookie operations:', {
      set: authCookieName,
      cleared: cookiesToClear.length,
      cookieValueLength: cookieValue.length
    });

    return response;
  } catch (error) {
    console.error('[set-session] ❌ Error setting session:', error);
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
  }
}