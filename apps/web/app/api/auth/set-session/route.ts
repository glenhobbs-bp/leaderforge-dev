import { NextRequest, NextResponse } from 'next/server';

// This route sets the Supabase session cookie as a JSON stringified session object,
// which is required for SSR and RLS to work. The cookie name must match the Supabase project ref.
// See: https://supabase.com/docs/guides/auth/server-side/nextjs#using-access-tokens

export async function POST(req: NextRequest) {
  // Accept the full session object from the client
  const session = await req.json();
  // Set the cookie to the JSON stringified session object
  const res = NextResponse.json({ success: true });
  res.cookies.set('sb-pcjaagjqydyqfsthsmac-auth-token', JSON.stringify(session), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Always false for localhost!
  });
  console.log('[set-session] Setting cookie sb-pcjaagjqydyqfsthsmac-auth-token:', session);
  return res;
}