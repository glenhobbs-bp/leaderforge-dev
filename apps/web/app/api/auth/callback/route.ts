// apps/web/app/auth/callback/route.ts
import { authExchange } from '@supabase/auth-helpers-nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Handles Supabase auth redirect and sets cookies for SSR session access.
 */
export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  return authExchange(req, supabase);
}