import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '../../../lib/contentService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import { Content } from '../../../lib/types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenant_key: string }> }
) {
  const { tenant_key } = await context.params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  console.log(`[API] GET /api/content/${tenant_key}`);

  if (!tenant_key || typeof tenant_key !== 'string') {
    console.error('[API] Missing or invalid tenant_key');
    return NextResponse.json({ error: 'Missing or invalid tenant_key' }, { status: 400 });
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
    const content: Content[] = await contentService.getContentForContext(supabase, tenant_key, user_id);
    console.log(`[API] Found ${content.length} items for user ${user_id} in tenant ${tenant_key}`);
    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error('[API] Error fetching content:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}