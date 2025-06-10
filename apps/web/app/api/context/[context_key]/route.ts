import { NextRequest } from 'next/server';
import { contextService } from '../../../lib/contextService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/context/[context_key]
 * Returns context config, including entitlement requirements.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  const { context_key } = await context.params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  console.log(`[API] GET /api/context/${context_key}?user_id=${user_id}`);
  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return new Response(JSON.stringify({ error: 'Missing or invalid context_key' }), { status: 400 });
  }
  try {
    console.log('[API] Creating Supabase SSR server client for context route');
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const all = cookieStore.getAll();
            // console.log('[SSR client] getAll cookies:', all);
            return all;
          },
          async setAll(cookiesToSet) {
            // console.log('[SSR client] setAll cookies:', cookiesToSet);
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie);
            }
          },
        },
      }
    );
    console.log('[API] Supabase SSR server client created. Fetching user...');
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    console.log('[API] Supabase user:', user, 'Session error:', sessionError);
    const config = await contextService.getContextConfig(supabase, context_key, user_id);
    if (!config) {
      console.error(`[API] Context config not found: ${context_key}`);
      return new Response(JSON.stringify({ error: 'Context config not found' }), { status: 404 });
    }
    console.log(`[API] Found context config: ${context_key}`);
    return new Response(JSON.stringify(config), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching context config:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.