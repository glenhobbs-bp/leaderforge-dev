import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[force-clear-cookies] Aggressively clearing all auth cookies');

  const response = NextResponse.json({
    success: true,
    message: 'All authentication cookies cleared aggressively'
  });

  // Extract project reference from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let projectRef = null;
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    projectRef = match ? match[1] : null;
  }

  // Clear all possible cookie variations
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    ...(projectRef ? [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-refresh-token`
    ] : [])
  ];

  cookieNames.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
  });

  console.log('[force-clear-cookies] Cleared cookies:', cookieNames);

  return response;
}