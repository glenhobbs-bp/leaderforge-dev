import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../../lib/userService';
import { createSupabaseServerClient } from '../../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/user/[user_id]/preferences
 * Returns user preferences (localization, avatar, etc.).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  // SSR Auth: get cookies and hydrate session
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  const supabase = createSupabaseServerClient(cookieStore);

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user_id } = params;
  console.log(`[API] GET /api/user/${user_id}/preferences`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return NextResponse.json({ error: 'Missing or invalid user_id' }, { status: 400 });
  }
  // Only allow user to fetch their own preferences
  if (session.user.id !== user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const user = await userService.getUser(user_id);
    if (!user) {
      console.error(`[API] User not found: ${user_id}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log(`[API] Found preferences for user: ${user_id}`);
    return NextResponse.json(user.preferences || {}, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching user preferences:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/[user_id]/preferences
 * Updates user preferences (partial update).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  // SSR Auth: get cookies and hydrate session
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  const supabase = createSupabaseServerClient(cookieStore);

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user_id } = params;
  console.log(`[API] PATCH /api/user/${user_id}/preferences`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return NextResponse.json({ error: 'Missing or invalid user_id' }, { status: 400 });
  }
  // Only allow user to update their own preferences
  if (session.user.id !== user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[API] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    console.error('[API] Missing or invalid preferences in body');
    return NextResponse.json({ error: 'Missing or invalid preferences' }, { status: 400 });
  }
  try {
    const updated = await userService.updateUserPreferences(user_id, body);
    if (!updated) {
      console.error(`[API] User not found for update: ${user_id}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log(`[API] Updated preferences for user: ${user_id}`);
    return NextResponse.json(updated.preferences || {}, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error updating user preferences:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.