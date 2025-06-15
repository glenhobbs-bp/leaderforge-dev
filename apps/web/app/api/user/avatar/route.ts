import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

// console.log('SERVICE ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8));

// Use env vars for Supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  console.log('--- [AVATAR API] Incoming request:', req.url);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  console.log('[AVATAR API] userId param:', userId);
  if (!userId) {
    console.warn('[AVATAR API] Missing userId');
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // SSR Auth: get cookies and hydrate session
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  console.log('[AVATAR API] Incoming cookies:', allCookies);

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  console.log('[AVATAR API] Extracted tokens:', { accessToken, refreshToken });

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session manually (if tokens found)
  if (accessToken && refreshToken) {
    const setSessionRes = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[AVATAR API] setSession result:', setSessionRes);
  } else {
    console.warn('[AVATAR API] Missing access or refresh token in cookies. SSR auth will likely fail.');
  }

  // Get current user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('[AVATAR API] SSR session:', session, 'error:', sessionError);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow user to fetch their own avatar (or add admin logic here)
  if (session.user.id !== userId) {
    console.warn('[AVATAR API] Forbidden: user tried to access another user avatar', { sessionUser: session.user.id, requested: userId });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch avatar path from DB (RLS enforced)
  const { data: user, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .single();
  console.log('[AVATAR API] Supabase user fetch:', { user, userError });

  if (userError || !user || !user.avatar_url) {
    console.warn('[AVATAR API] No avatar found or DB error:', userError);
    return NextResponse.json({ error: 'No avatar' }, { status: 404 });
  }

  // Generate signed URL
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .createSignedUrl(user.avatar_url, 3600); // 1 hour expiry
  console.log('[AVATAR API] Supabase signedUrl result:', { data, error });

  if (error || !data?.signedUrl) {
    console.error('[AVATAR API] Failed to sign URL:', error);
    return NextResponse.json({ error: error?.message || 'Failed to sign URL' }, { status: 500 });
  }

  console.log('[AVATAR API] Returning signed avatar URL:', data.signedUrl);
  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}