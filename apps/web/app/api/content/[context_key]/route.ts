import { NextRequest } from 'next/server';
import { contentService } from '../../../lib/contentService';

/**
 * GET /api/content/[context_key]?user_id=...
 * Returns only content the user is entitled to for the given context.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { context_key: string } }
) {
  const { context_key } = params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  console.log(`[API] GET /api/content/${context_key}?user_id=${user_id}`);
  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return new Response(JSON.stringify({ error: 'Missing or invalid context_key' }), { status: 400 });
  }
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid user_id' }), { status: 400 });
  }
  try {
    const content = await contentService.getContentForContext(context_key, user_id);
    console.log(`[API] Found ${content.length} content items for user ${user_id} in context ${context_key}`);
    return new Response(JSON.stringify(content), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching content:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.