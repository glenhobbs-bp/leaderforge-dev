// File: apps/web/lib/mockups/MockupRegistry.ts
// Purpose: Generalized mockup routing system for rapid prototyping in production context
// Owner: Product Team
// Tags: mockups, feature-flags, prototyping, navigation

import { ComponentType } from 'react';

// Import mockup components
import MarcusDashboard from '../../app/test-dashboard/page';

// Mockup registry interface
export interface MockupConfig {
  component: ComponentType<Record<string, unknown>>;
  name: string;
  description: string;
  featureFlag?: string;
  enabledUsers?: string[]; // User IDs who can see this mockup
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
    enabledUsers: [
      'bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b', // Marcus test user
      '47f9db16-f24f-4868-8155-256cfa2edc2c', // Glen user
      // Add other user IDs as needed
    ],
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
export function isMockupEnabled(
  navOptionId: string,
  userId: string,
  featureFlags: Record<string, boolean> = {}
): boolean {
  const mockupConfig = MOCKUP_REGISTRY[navOptionId];
  if (!mockupConfig) return false;

  // Check if enabled for all users (via environment variable)
  if (mockupConfig.enabledForAll) return true;

  // Check if user is in enabled users list
  if (mockupConfig.enabledUsers?.includes(userId)) {
    return true;
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
export function debugMockupStatus(navOptionId: string, userId: string): void {
  const mockupConfig = MOCKUP_REGISTRY[navOptionId];
  const isEnabled = isMockupEnabled(navOptionId, userId);

  console.log('[MockupRegistry] Status check:', {
    navOptionId,
    userId,
    hasMockup: !!mockupConfig,
    mockupName: mockupConfig?.name,
    isEnabled,
    featureFlag: mockupConfig?.featureFlag,
    enabledForAll: mockupConfig?.enabledForAll,
    enabledUsers: mockupConfig?.enabledUsers,
    environment: process.env.NODE_ENV,
    enableMockupsForAll: process.env.ENABLE_MOCKUPS_FOR_ALL,
  });
}