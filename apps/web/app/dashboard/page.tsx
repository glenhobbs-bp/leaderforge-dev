// File: apps/web/app/dashboard/page.tsx
// Purpose: Server-side dashboard page with SSR optimization and entitlement filtering
// Owner: Frontend team
// Tags: Next.js page, SSR, entitlements, context management, performance
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { contextService } from '../lib/contextService';
import { entitlementService } from '../lib/entitlementService';

export default async function DashboardPage() {
  const cookieStore = await cookies();
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
  } else {
    console.warn('[dashboard/page] Missing access or refresh token in cookies');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    console.warn('[dashboard/page] No user found in session, redirecting to login');
    redirect('/login');
  }

  // --- SSR: Fetch entitled context list ---
  let initialTenants = [];
  let initialTenantConfig = null;
  let initialNavOptions = null;

  try {
    let allContexts = await contextService.getAllContextConfigs(supabase);
    // Filter by user entitlement if required_entitlements is present
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, session.user.id);
    const entitlementIds = userEntitlements.map(e => e.entitlement_id);
    initialTenants = allContexts.filter(ctx => {
      if (!ctx.required_entitlements || !Array.isArray(ctx.required_entitlements) || ctx.required_entitlements.length === 0) return true;
      return ctx.required_entitlements.every((ent: string) => entitlementIds.includes(ent));
    });

    if (initialTenants.length === 0) {
      console.error('[dashboard/page] No entitled contexts for user:', session.user.id);
      redirect('/login?error=no_contexts');
    }

    // --- SSR: Pre-fetch default context configuration and nav options ---
    const defaultTenantKey = initialTenants[0].context_key;

    try {
      // Fetch context config server-side
      const { contextService } = await import('../lib/contextService');
      initialTenantConfig = await contextService.getContextConfig(supabase, defaultTenantKey);
    } catch (configErr) {
      console.error('[dashboard/page] Error pre-fetching context config:', configErr);
    }

    try {
      // Fetch nav options server-side
      const { navService } = await import('../lib/navService');
      initialNavOptions = await navService.getNavOptions(supabase, defaultTenantKey, session.user.id);
    } catch (navErr) {
      console.error('[dashboard/page] Error pre-fetching nav options:', navErr);
    }

  } catch (err) {
    console.error('[dashboard/page] Error fetching contexts:', err);
    initialTenants = [];
  }

  // TODO: Fetch last-used context for user (future)
  // For now, client will default to first context

  // Pass all SSR data to client for hydration
  return (
    <DashboardClient
      initialSession={session}
      initialTenants={initialTenants}
      initialTenantConfig={initialTenantConfig}
      initialNavOptions={initialNavOptions}
      defaultTenantKey={initialTenants[0]?.context_key}
    />
  );
}