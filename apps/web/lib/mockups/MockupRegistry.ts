// File: apps/web/lib/mockups/MockupRegistry.ts
// Purpose: Generalized mockup routing system for rapid prototyping in production context
// Owner: Product Team
// Tags: mockups, feature-flags, prototyping, navigation

import { ComponentType } from 'react';

// Import mockup components
import MarcusDashboard from '../../components/mockups/MarcusDashboardMockup';

// Mockup registry interface
export interface MockupConfig {
  component: ComponentType<Record<string, unknown>>;
  name: string;
  description: string;
  featureFlag?: string;
  entitlementName?: string; // Entitlement required to see this mockup
  enabledForAll?: boolean; // Enable for all users (careful!)
}

// Registry mapping nav_option UUIDs to mockup configurations
export const MOCKUP_REGISTRY: Record<string, MockupConfig> = {
  // Marcus Dashboard - My Dashboard nav option
  'e51a7dde-e349-41c4-b3ed-4a8a75155f94': {
    component: MarcusDashboard,
    name: 'Marcus Dashboard',
    description: 'Mockup dashboard for user experience validation',
    featureFlag: 'ENABLE_DASHBOARD_MOCKUP',
    entitlementName: 'user-dashboard-mockup',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true', // Environment variable control
  },

  // Future mockups will be added here:
  // 'another-nav-uuid': {
  //   component: TeamLeaderMockup,
  //   name: 'Team Leader Dashboard',
  //   description: 'Team leader experience mockup',
  //   featureFlag: 'ENABLE_TEAM_LEADER_MOCKUP',
  //   enabledUsers: ['user-id-1', 'user-id-2'],
  // },
};

// Feature flag checker
export async function isMockupEnabled(
  navOptionId: string,
  userId: string,
  featureFlags: Record<string, boolean> = {}
): Promise<boolean> {
  const mockupConfig = MOCKUP_REGISTRY[navOptionId];
  if (!mockupConfig) return false;

  // Check if enabled for all users (via environment variable)
  if (mockupConfig.enabledForAll) return true;

  // Check if user has required entitlement
  if (mockupConfig.entitlementName) {
    try {
      const response = await fetch(`/api/entitlements/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const entitlements = await response.json();
        const hasEntitlement = entitlements.some((ent: { name: string }) => ent.name === mockupConfig.entitlementName);
        if (hasEntitlement) return true;
      }
    } catch (error) {
      console.warn('[MockupRegistry] Entitlement check failed:', error);
    }
  }

  // Check feature flag (if provided)
  if (mockupConfig.featureFlag && featureFlags[mockupConfig.featureFlag]) {
    return true;
  }

  // Development mode enables all mockups for debugging
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// Get mockup component
export function getMockupComponent(navOptionId: string): ComponentType<Record<string, unknown>> | null {
  const mockupConfig = MOCKUP_REGISTRY[navOptionId];
  return mockupConfig?.component || null;
}

// Get all available mockups (for admin/debug purposes)
export function getAllMockups(): Array<{
  navOptionId: string;
  config: MockupConfig;
}> {
  return Object.entries(MOCKUP_REGISTRY).map(([navOptionId, config]) => ({
    navOptionId,
    config,
  }));
}

// Debug function to log mockup status (works in production for mockup debugging)
export async function debugMockupStatus(navOptionId: string, userId: string): Promise<void> {
  const mockupConfig = MOCKUP_REGISTRY[navOptionId];
  const isEnabled = await isMockupEnabled(navOptionId, userId);

  console.log('[MockupRegistry] Status check:', {
    navOptionId,
    userId,
    hasMockup: !!mockupConfig,
    mockupName: mockupConfig?.name,
    isEnabled,
    featureFlag: mockupConfig?.featureFlag,
    enabledForAll: mockupConfig?.enabledForAll,
    entitlementName: mockupConfig?.entitlementName,
    environment: process.env.NODE_ENV,
    enableMockupsForAll: process.env.ENABLE_MOCKUPS_FOR_ALL,
  });
}