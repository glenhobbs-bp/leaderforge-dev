// File: apps/web/lib/mockups/MockupRegistry.ts
// Purpose: Generalized mockup routing system for rapid prototyping in production context
// Owner: Product Team
// Tags: mockups, feature-flags, prototyping, navigation

import { ComponentType } from 'react';

// Import mockup components
import MarcusDashboard from '../../components/mockups/MarcusDashboardMockup';
import TeamLeaderDashboard from '../../components/mockups/TeamLeaderDashboardMockup';
import ExecutiveDashboard from '../../components/mockups/ExecutiveDashboardMockup';
import PromptLibraryMockup from '../../components/mockups/PromptLibraryMockup';
import BackgroundAgentsMockup from '../../components/mockups/BackgroundAgentsMockup';
import PowerPromptsMockup from '../../components/mockups/PowerPromptsMockup';
import CompanySettingsMockup from '../../components/mockups/CompanySettingsMockup';

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

  // Team Leader Dashboard - Stakeholder Review
  '8e36b3b6-9c8b-46d7-93f7-8ac41cfd9086': {
    component: TeamLeaderDashboard,
    name: 'Team Leader Dashboard',
    description: 'Team leader perspective mockup for stakeholder review',
    featureFlag: 'ENABLE_TEAM_LEADER_MOCKUP',
    entitlementName: 'team-leader-mockup',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },

  // Executive Dashboard - Stakeholder Review
  'bd9b0a73-e281-46a0-84c1-2d532c3ab7fb': {
    component: ExecutiveDashboard,
    name: 'Executive Dashboard',
    description: 'Executive/organizational perspective mockup for stakeholder review',
    featureFlag: 'ENABLE_EXECUTIVE_MOCKUP',
    entitlementName: 'executive-mockup',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },

  // Prompt Library - AI Operating System
  'fc9861cd-210d-4abe-9d13-76f1a366ef88': {
    component: PromptLibraryMockup,
    name: 'Prompt Library',
    description: 'Searchable repository of proven AI prompts for business scenarios',
    featureFlag: 'ENABLE_PROMPT_LIBRARY_MOCKUP',
    entitlementName: 'prompt-library-mockup',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },

  // Background Agents - AI Operating System
  '8c9029a8-f0d6-4522-8f10-b1107c84b594': {
    component: BackgroundAgentsMockup,
    name: 'Background Agents',
    description: 'AI agents working behind the scenes to monitor, analyze, and alert',
    featureFlag: 'ENABLE_BACKGROUND_AGENTS_MOCKUP',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },

  // PowerPrompts - AI Operating System
  'd9e41e48-3191-42b1-9d39-69b397014ee4': {
    component: PowerPromptsMockup,
    name: 'PowerPrompts',
    description: 'AI-driven sequences that proactively guide your development with personalized prompts and challenges',
    featureFlag: 'ENABLE_POWERPROMPTS_MOCKUP',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },

  // Company Settings - Admin-level company management
  'bd60dca8-8346-48ea-9d6a-7caa4b69740f': {
    component: CompanySettingsMockup,
    name: 'Company Settings',
    description: 'Admin-level company management interface for settings, user roles, and invite links',
    featureFlag: 'ENABLE_COMPANY_SETTINGS_MOCKUP',
    entitlementName: 'admin-company-settings',
    enabledForAll: process.env.ENABLE_MOCKUPS_FOR_ALL === 'true',
  },
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