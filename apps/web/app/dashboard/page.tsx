// File: apps/web/app/dashboard/page.tsx
// Purpose: Server-side dashboard page with SSR optimization and entitlement filtering
// Owner: Frontend team
// Tags: Next.js page, SSR, entitlements, context management, performance
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { entitlementService } from '../lib/entitlementService';
import { tenantService } from '../lib/tenantService';

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
    error: sessionError
  } = await supabase.auth.getSession();

  let finalSession = session;

  // Add more detailed session validation
  if (!session?.user) {
    console.warn('[dashboard/page] No user found in session, redirecting to login');
    console.warn('[dashboard/page] Debug info:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      sessionExists: !!session,
      userExists: !!session?.user,
      sessionError: sessionError?.message
    });

    // If we have tokens but no session, try to refresh
    if (accessToken && refreshToken && sessionError) {
      console.warn('[dashboard/page] Session error with valid tokens, attempting refresh');
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshData?.session?.user) {
          console.log('[dashboard/page] Session refresh successful');
          finalSession = refreshData.session;
        } else {
          console.error('[dashboard/page] Session refresh failed:', refreshError?.message);
          redirect('/login?error=session_refresh_failed');
        }
      } catch (refreshException) {
        console.error('[dashboard/page] Session refresh exception:', refreshException);
        redirect('/login?error=session_exception');
      }
    } else {
      redirect('/login');
    }
  }

  // Ensure we have a valid session after refresh attempts
  if (!finalSession?.user) {
    console.error('[dashboard/page] No valid session after refresh attempts');
    redirect('/login?error=no_valid_session');
  }

  // --- SSR: Fetch entitled context list ---
  let initialTenants = [];
  let initialTenantConfig = null;
  let initialNavOptions = null;
  let defaultTenantKey = 'leaderforge'; // Default fallback

  try {
    let allContexts = await tenantService.getAllTenantConfigs(supabase);
    // Filter by user entitlement if required_entitlements is present
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, finalSession.user.id);
    const entitlementIds = userEntitlements.map(e => e.entitlement_id);
    initialTenants = allContexts.filter(ctx => {
      if (!ctx.required_entitlements || !Array.isArray(ctx.required_entitlements) || ctx.required_entitlements.length === 0) return true;
      return ctx.required_entitlements.every((ent: string) => entitlementIds.includes(ent));
    });

    if (initialTenants.length === 0) {
      console.error('[dashboard/page] No entitled contexts for user:', finalSession.user.id);
      redirect('/login?error=no_contexts');
    }

    // --- SSR: Pre-fetch default context configuration and nav options ---
    // Prefer 'leaderforge' if available, otherwise use first tenant
    defaultTenantKey = initialTenants.find(t => t.tenant_key === 'leaderforge')?.tenant_key || initialTenants[0].tenant_key;

    try {
      // Fetch context config server-side
      initialTenantConfig = await tenantService.getTenantConfig(supabase, defaultTenantKey);
    } catch (configErr) {
      console.error('[dashboard/page] Error pre-fetching context config:', configErr);
    }

    try {
      // Fetch nav options server-side
      const { navService } = await import('../lib/navService');
      initialNavOptions = await navService.getNavOptions(supabase, defaultTenantKey, finalSession.user.id);
    } catch (navErr) {
      console.error('[dashboard/page] Error pre-fetching nav options:', navErr);
    }

  } catch (err) {
    console.error('[dashboard/page] Error fetching contexts:', err);
    initialTenants = [];
  }

  // Pass all SSR data to client for hydration
  return (
    <DashboardClient
      initialSession={finalSession}
      initialTenants={initialTenants}
      initialTenantConfig={initialTenantConfig}
      initialNavOptions={initialNavOptions}
      defaultTenantKey={defaultTenantKey}
    />
  );
}