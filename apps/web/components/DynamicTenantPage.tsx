"use client";
// File: apps/web/components/DynamicTenantPage.tsx
// Purpose: Agent-native 3-panel layout orchestrator using modular components for clean architecture
// Owner: Frontend Team
// Tags: #tenant-page #orchestration #modular #performance

import React, { useState } from "react";
import { AuthenticationGuard } from './ui/AuthenticationGuard';
import { UserPreferencesManager } from './ui/UserPreferencesManager';
import { NavigationOrchestrator } from './ui/NavigationOrchestrator';
import type { TenantConfig } from '../app/lib/types';
import { useSupabase } from './SupabaseProvider';

// Diagnostic: Track module load
console.log('[DynamicTenantPage] Module loaded - Modular architecture');

type DynamicTenantPageProps = {
  // Props for tenant management - using correct TenantConfig type
  initialTenants?: TenantConfig[];
  initialTenantConfig?: unknown;
  initialNavOptions?: unknown;
  defaultTenantKey?: string;
};

export default function DynamicTenantPage(props: DynamicTenantPageProps) {
  // Auth context
  const { session } = useSupabase();

  // Core tenant state
  const [currentTenant, setCurrentTenant] = useState<string>(
    props.defaultTenantKey || props.initialTenants?.[0]?.tenant_key || 'leaderforge'
  );
  const [isPreferencesReady, setIsPreferencesReady] = useState(false);
  const [selectedNavOptionId, setSelectedNavOptionId] = useState<string | null>(null);

  // Handle tenant changes from user preferences
  const handleTenantChange = (tenantKey: string) => {
    console.log('[DynamicTenantPage] Tenant change:', tenantKey);
    setCurrentTenant(tenantKey);
  };

  // Handle navigation option selection from user preferences
  const handleNavOptionSelect = (navId: string) => {
    console.log('[DynamicTenantPage] Navigation option selected:', navId);
    setSelectedNavOptionId(navId);
  };

  // Handle preferences ready callback
  const handlePreferencesReady = () => {
    console.log('[DynamicTenantPage] User preferences ready');
    setIsPreferencesReady(true);
  };

  return (
    <AuthenticationGuard>
      <UserPreferencesManager
        userId={session?.user?.id}
        currentTenant={currentTenant}
        onTenantChange={handleTenantChange}
        onNavOptionSelect={handleNavOptionSelect}
        onPreferencesReady={handlePreferencesReady}
      />
      {isPreferencesReady && (
        <NavigationOrchestrator
          initialTenants={props.initialTenants}
          initialTenantConfig={props.initialTenantConfig}
          defaultTenantKey={props.defaultTenantKey}
          userId={session?.user?.id}
          isReady={isPreferencesReady}
          selectedNavOptionId={selectedNavOptionId}
        />
      )}
    </AuthenticationGuard>
  );
}
