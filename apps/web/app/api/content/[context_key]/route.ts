import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '../../../lib/contentService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  context: { params: { context_key: string } }
) {
  const { context_key } = context.params;
  const res = NextResponse.next();
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  console.log(`[API] GET /api/content/${context_key}`);

  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }

  // ✅ Get session from Supabase cookie
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('[API] Supabase session error:', error.message);
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  if (!session?.user?.id) {
    console.warn('[API] No valid session or user ID');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user_id = session.user.id;

  try {
    const content = await contentService.getContentForContext(supabase, context_key, user_id);
    console.log(`[API] Found ${content.length} items for user ${user_id} in context ${context_key}`);
    return NextResponse.json(content, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching content:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}