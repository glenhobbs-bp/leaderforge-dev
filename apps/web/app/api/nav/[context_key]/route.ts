import { NextRequest } from 'next/server';
import { navService } from '../../../lib/navService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/nav/[context_key]?user_id=...
 * Returns nav options for the context, entitlement-filtered.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  const { context_key } = await context.params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  console.log(`[API] GET /api/nav/${context_key}?user_id=${user_id}`);
  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return new Response(JSON.stringify({ error: 'Missing or invalid context_key' }), { status: 400 });
  }
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid user_id' }), { status: 400 });
  }
  try {
    console.log('[API] Creating Supabase SSR server client for nav route');
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
    console.log('[API] Supabase SSR server client created. Fetching nav options...');
    const navOptions = await navService.getNavOptions(supabase, context_key, user_id);
    console.log(`[API] Found ${navOptions.length} nav options for user ${user_id} in context ${context_key}`);
    return new Response(JSON.stringify(navOptions), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching nav options:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.