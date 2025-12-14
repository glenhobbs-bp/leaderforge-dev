/**
 * Debug endpoint to examine cookies and session state
 * Purpose: Diagnose SSR authentication issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG/cookies] Request headers:', Object.fromEntries(request.headers.entries()));

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    console.log('[DEBUG/cookies] All cookies:', allCookies);

    // Test session restoration
    const { session, error } = await restoreSession(cookieStore);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        value: c.name.includes('auth') ? c.value?.substring(0, 20) + '...' : c.value
      })),
      sessionRestoration: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        hasError: !!error,
        errorMessage: error?.message
      },
      requestInfo: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        method: request.method,
        url: request.url
      }
    };

    console.log('[DEBUG/cookies] Debug info:', JSON.stringify(debugInfo, null, 2));

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('[DEBUG/cookies] Error:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}