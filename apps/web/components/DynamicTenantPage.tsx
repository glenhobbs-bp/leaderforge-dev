"use client";
// File: apps/web/components/DynamicTenantPage.tsx
// Purpose: Agent-native 3-panel layout orchestrator using modular components for clean architecture
// Owner: Frontend Team
// Tags: #tenant-page #orchestration #modular #performance

import React, { useState, useEffect, useCallback } from "react";
import { AuthenticationGuard } from './ui/AuthenticationGuard';
import { UserPreferencesManager } from './ui/UserPreferencesManager';
import { NavigationOrchestrator } from './ui/NavigationOrchestrator';
import type { TenantConfig } from '../app/lib/types';
import { useSupabase } from './SupabaseProvider';
import { parallelLoader } from '../app/lib/parallelLoader';

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

  // Add stabilization to prevent rapid re-renders
  const [isStable, setIsStable] = useState(false);

  // Parallel loading state
  const [parallelLoadComplete, setParallelLoadComplete] = useState(false);

  // Start parallel loading when user session is available - with mounting stability
  useEffect(() => {
    // Prevent duplicate loads during auth state transitions
    const userId = session?.user?.id;
    if (userId && !parallelLoadComplete) {
      console.log('[DynamicTenantPage] 🚀 Initiating parallel data load for user:', userId);

      // Add small delay to prevent duplicate calls during rapid auth state changes
      const loadTimer = setTimeout(() => {
        parallelLoader.loadDashboardData(userId, currentTenant)
          .then(result => {
            console.log('[DynamicTenantPage] 📊 Parallel load result:', {
              success: result.success,
              totalTime: result.totalTime,
              hasUserPrefs: !!result.userPreferences,
              hasNavOptions: !!result.navOptions,
              hasAgentContext: !!result.agentContext
            });

            setParallelLoadComplete(true);

            // Auto-restore navigation state if available
            if (result.userPreferences?.preferences?.navigationState?.lastNavOption) {
              const lastNavOption = result.userPreferences.preferences.navigationState.lastNavOption;
              console.log('[DynamicTenantPage] 🔄 Restoring navigation from parallel load:', lastNavOption);
              setSelectedNavOptionId(lastNavOption);
            }
          })
          .catch(error => {
            console.error('[DynamicTenantPage] Parallel load failed:', error);
            setParallelLoadComplete(true); // Still mark as complete to avoid blocking
          });
      }, 50); // Small delay to batch rapid state changes

      return () => {
        window.clearTimeout(loadTimer);
      };
    }
  }, [session?.user?.id, currentTenant, parallelLoadComplete]);

  // Handle tenant changes from user preferences - STABLE with useCallback
  const handleTenantChange = useCallback((tenantKey: string) => {
    console.log('[DynamicTenantPage] Tenant change:', tenantKey);
    setCurrentTenant(tenantKey);
    // Reset parallel loading for new tenant
    setParallelLoadComplete(false);
  }, []);

  // Handle navigation option selection from user preferences - STABLE with useCallback
  const handleNavOptionSelect = useCallback((navId: string) => {
    console.log('[DynamicTenantPage] Navigation option selected:', navId);
    setSelectedNavOptionId(navId);
  }, []);

  // Handle preferences ready callback with stabilization - STABLE with useCallback
  const handlePreferencesReady = useCallback(() => {
    console.log('[DynamicTenantPage] User preferences ready');
    setIsPreferencesReady(true);
  }, []);

  // Stabilize component mounting after preferences are ready
  useEffect(() => {
    if (isPreferencesReady && !isStable) {
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 50); // Very short delay just to batch state updates

      return () => window.clearTimeout(timer);
    }
  }, [isPreferencesReady, isStable]);

  // Only show NavigationOrchestrator when parallel load is complete OR preferences are ready
  const shouldShowOrchestrator = (parallelLoadComplete || isPreferencesReady) && isStable;

  return (
    <AuthenticationGuard>
      <UserPreferencesManager
        userId={session?.user?.id}
        currentTenant={currentTenant}
        onTenantChange={handleTenantChange}
        onNavOptionSelect={handleNavOptionSelect}
        onPreferencesReady={handlePreferencesReady}
      />
      {shouldShowOrchestrator && (
        <NavigationOrchestrator
          initialTenants={props.initialTenants}
          initialTenantConfig={props.initialTenantConfig}
          defaultTenantKey={props.defaultTenantKey}
          userId={session?.user?.id}
          isReady={shouldShowOrchestrator}
          selectedNavOptionId={selectedNavOptionId}
        />
      )}
    </AuthenticationGuard>
  );
}
