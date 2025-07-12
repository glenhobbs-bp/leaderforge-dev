import { NextResponse } from 'next/server';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

// Extract project reference from Supabase URL
function getProjectRef(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const projectRef = getProjectRef();

    // Check for auth cookies
    const accessTokenCookie = projectRef ? `sb-${projectRef}-auth-token` : null;
    const refreshTokenCookie = projectRef ? `sb-${projectRef}-refresh-token` : null;

    const accessToken = accessTokenCookie ? cookieStore.get(accessTokenCookie)?.value : null;
    const refreshToken = refreshTokenCookie ? cookieStore.get(refreshTokenCookie)?.value : null;

    // Attempt session restoration
    const { session, error } = await restoreSession(cookieStore);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      projectRef,
      cookieNames: {
        accessToken: accessTokenCookie,
        refreshToken: refreshTokenCookie,
      },
      cookieStatus: {
        accessToken: accessToken ? {
          present: true,
          length: accessToken.length,
          preview: accessToken.substring(0, 20) + '...',
        } : { present: false },
        refreshToken: refreshToken ? {
          present: true,
          length: refreshToken.length,
          preview: refreshToken.substring(0, 20) + '...',
        } : { present: false },
      },
      sessionStatus: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        error: error?.message || null,
      },
      allCookies: Array.from(cookieStore.getAll()).map(cookie => ({
        name: cookie.name,
        present: true,
        length: cookie.value?.length || 0,
      })),
    });
  } catch (err) {
    console.error('[debug/auth-status] Error:', err);
    return NextResponse.json({
      error: 'Failed to check auth status',
      details: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}