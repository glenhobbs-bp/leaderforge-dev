// File: apps/web/app/dashboard/page.tsx
// Purpose: Server-side dashboard page with SSR optimization and entitlement filtering
// Owner: Frontend team
// Tags: Next.js page, SSR, entitlements, context management, performance
import { restoreSession } from '@/lib/supabaseServerClient';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import DynamicTenantPage from '../../components/DynamicTenantPage';
import { entitlementService } from '../lib/entitlementService';
import { tenantService } from '../lib/tenantService';
import type { TenantConfig } from '../lib/types';

// Enhanced loading component - standardized to match login modal
function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-spinner mb-4"></div>
          <p className="text-sm font-medium text-gray-800 mb-2">Loading Dashboard</p>
          <p className="text-xs text-gray-600 text-center">
            Setting up your personalized experience...
          </p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-primary-dot rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-secondary-dot rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-accent-dot rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();

  // Use standard session restoration per ADR-0031
  const { session: finalSession, error: sessionError, supabase } = await restoreSession(cookieStore);

  if (sessionError || !finalSession?.user) {
    console.warn('[dashboard/page] Authentication failed:', sessionError?.message || 'No valid session');
    redirect('/login');
  }

  console.log('[dashboard/page] ✅ Session restored successfully for user:', finalSession.user.id);

  // --- SSR: Fetch entitled context list ---
  let initialTenants: TenantConfig[] = [];
  let initialTenantConfig = null;
  let initialNavOptions = null;
  let defaultTenantKey = 'leaderforge';

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

  // Directly render DynamicTenantPage with Suspense - no redundant wrapper
  return (
    <Suspense fallback={<DashboardLoader />}>
      <DynamicTenantPage
        initialTenants={initialTenants}
        initialTenantConfig={initialTenantConfig}
        initialNavOptions={initialNavOptions}
        defaultTenantKey={defaultTenantKey}
      />
    </Suspense>
  );
}