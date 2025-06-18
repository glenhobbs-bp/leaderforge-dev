// File: apps/web/app/dashboard/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { contextService } from '../lib/contextService';
import { entitlementService } from '../lib/entitlementService';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('[dashboard/page] All cookies:', allCookies);

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  console.log('[dashboard/page] accessToken:', accessToken);
  console.log('[dashboard/page] refreshToken:', refreshToken);

  const supabase = createSupabaseServerClient(cookieStore);

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // --- SSR: Fetch entitled context list ---
  let initialContexts = [];
  try {
    let allContexts = await contextService.getAllContexts(supabase);
    // Filter by user entitlement if required_entitlements is present
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, session.user.id);
    const entitlementIds = userEntitlements.map(e => e.entitlement_id);
    initialContexts = allContexts.filter(ctx => {
      if (!ctx.required_entitlements || ctx.required_entitlements.length === 0) return true;
      return ctx.required_entitlements.every((ent: string) => entitlementIds.includes(ent));
    });
    if (initialContexts.length === 0) {
      console.error('[dashboard/page] No entitled contexts for user:', session.user.id);
      redirect('/login?error=no_contexts');
    }
  } catch (err) {
    console.error('[dashboard/page] Error fetching contexts:', err);
    initialContexts = [];
  }

  // TODO: Fetch last-used context for user (future)
  // For now, client will default to first context

  // Pass session and initialContexts to client for hydration
  return <DashboardClient initialSession={session} initialContexts={initialContexts} />;
}