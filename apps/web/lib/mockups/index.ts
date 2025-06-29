// File: apps/web/lib/mockups/index.ts
// Purpose: Entry point for mockup system - exports all mockup functionality
// Owner: Product Team
// Tags: mockups, routing, feature-flags, exports

export {
  MOCKUP_REGISTRY,
  isMockupEnabled,
  getMockupComponent,
  getAllMockups,
  debugMockupStatus,
  type MockupConfig
} from './MockupRegistry';

export { default as MockupRouter, useMockupCheck } from './MockupRouter';

// Import for development helpers
import { debugMockupStatus } from './MockupRegistry';

// Feature flag constants for consistency
export const MOCKUP_FEATURE_FLAGS = {
  ENABLE_DASHBOARD_MOCKUP: 'ENABLE_DASHBOARD_MOCKUP',
  ENABLE_TEAM_LEADER_MOCKUP: 'ENABLE_TEAM_LEADER_MOCKUP',
} as const;

// Development helpers
export const DEV_HELPERS = {
  isDevMode: process.env.NODE_ENV === 'development',
  logMockupStatus: (navOptionId: string, userId: string) => {
    if (process.env.NODE_ENV === 'development') {
      debugMockupStatus(navOptionId, userId);
    }
  }
};