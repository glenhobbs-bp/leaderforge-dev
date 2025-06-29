// File: apps/web/lib/mockups/MockupRouter.tsx
// Purpose: Routes navigation to mockups when enabled, falls back to agent content
// Owner: Product Team
// Tags: mockups, routing, feature-flags, navigation

import React from 'react';
import { isMockupEnabled, getMockupComponent, debugMockupStatus } from './MockupRegistry';

interface MockupRouterProps {
  navOptionId: string;
  userId: string;
  children: React.ReactNode; // Fallback content when mockup not enabled
  featureFlags?: Record<string, boolean>;
}

export default function MockupRouter({
  navOptionId,
  userId,
  children,
  featureFlags = {}
}: MockupRouterProps) {
  // Debug mockup status in development
  if (process.env.NODE_ENV === 'development') {
    debugMockupStatus(navOptionId, userId);
  }

  // Check if mockup is enabled for this user/nav option
  const mockupEnabled = isMockupEnabled(navOptionId, userId, featureFlags);

  if (mockupEnabled) {
    const MockupComponent = getMockupComponent(navOptionId);

    if (MockupComponent) {
      console.log(`[MockupRouter] 🎭 Rendering mockup for nav option: ${navOptionId}`);

      // Render mockup in production context
      return (
        <div className="mockup-container">
          {/* Optional mockup indicator for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium shadow-lg">
              🎭 Mockup Active
            </div>
          )}
          <MockupComponent />
        </div>
      );
    }
  }

  // Fallback to regular agent content
  console.log(`[MockupRouter] 🤖 Using agent content for nav option: ${navOptionId}`);
  return <>{children}</>;
}

// Hook for checking if current navigation should use mockup
export function useMockupCheck(navOptionId: string, userId: string, featureFlags?: Record<string, boolean>) {
  const mockupEnabled = isMockupEnabled(navOptionId, userId, featureFlags);
  const mockupComponent = mockupEnabled ? getMockupComponent(navOptionId) : null;

  return {
    isMockup: mockupEnabled && !!mockupComponent,
    MockupComponent: mockupComponent,
  };
}