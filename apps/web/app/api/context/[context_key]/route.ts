import { NextRequest } from 'next/server';
import { contextService } from '../../../lib/contextService';

/**
 * GET /api/context/[context_key]
 * Returns context config, including entitlement requirements.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { context_key: string } }
) {
  const { context_key } = params;
  console.log(`[API] GET /api/context/${context_key}`);
  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return new Response(JSON.stringify({ error: 'Missing or invalid context_key' }), { status: 400 });
  }
  try {
    const config = await contextService.getContextConfig(context_key);
    if (!config) {
      console.error(`[API] Context config not found: ${context_key}`);
      return new Response(JSON.stringify({ error: 'Context not found' }), { status: 404 });
    }
    console.log(`[API] Found context config: ${context_key}`);
    return new Response(JSON.stringify(config), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching context config:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.