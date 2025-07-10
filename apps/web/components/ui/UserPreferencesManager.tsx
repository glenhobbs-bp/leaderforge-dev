"use client";
// File: apps/web/components/ui/UserPreferencesManager.tsx
// Purpose: Manages user preferences, tenant restoration, and navigation state management
// Owner: Frontend Team
// Tags: #user-preferences #tenant-restoration #navigation #state-management

import { useEffect, useRef } from 'react';
import { useUserPreferences } from '../../app/hooks/useUserPreferences';
import type { UserPreferences } from '../../app/lib/types';

interface UserPreferencesManagerProps {
  userId?: string;
  currentTenant: string;
  onTenantChange: (tenantKey: string) => void;
  onNavOptionSelect: (navId: string) => void;
  onPreferencesReady: () => void;
}

export function UserPreferencesManager({
  userId,
  currentTenant,
  onTenantChange,
  onNavOptionSelect,
  onPreferencesReady
}: UserPreferencesManagerProps) {
  // Core state - simplified approach
  const hasInitialized = useRef(false);

  // Fetch user preferences with shorter timeout
  const { data: userPrefs, error: userPrefsError, isLoading: userPrefsLoading } = useUserPreferences(
    userId || '',
    { enabled: !!userId }
  );

  // Single effect to handle initialization
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    // Don't wait indefinitely - set a maximum wait time
    const initializationTimeout = window.setTimeout(() => {
      if (!hasInitialized.current) {
        console.log('[UserPreferencesManager] Timeout reached - proceeding without user preferences');
        hasInitialized.current = true;
        onPreferencesReady();
      }
    }, 2000); // Maximum 2 second wait

    // If no userId, proceed immediately
    if (!userId) {
      hasInitialized.current = true;
      onPreferencesReady();
      window.clearTimeout(initializationTimeout);
      return;
    }

    // If user preferences error, proceed without them
    if (userPrefsError) {
      console.warn('[UserPreferencesManager] User preferences error - proceeding without them:', userPrefsError);
      hasInitialized.current = true;
      onPreferencesReady();
      window.clearTimeout(initializationTimeout);
      return;
    }

    // If user preferences loaded successfully, restore state
    if (userPrefs && !userPrefsLoading) {
      const preferences = userPrefs as UserPreferences;
      const navigationState = preferences?.navigationState;

      // Restore tenant if different
      const lastTenant = navigationState?.lastTenant;
      if (lastTenant && lastTenant !== currentTenant) {
        console.log('[UserPreferencesManager] Restoring saved tenant:', lastTenant);
        onTenantChange(lastTenant);
      }

      // Restore navigation option if in correct tenant
      const lastNavOption = navigationState?.lastNavOption;
      if (lastNavOption && (lastTenant === currentTenant || !lastTenant)) {
        console.log('[UserPreferencesManager] Restoring saved navigation option:', lastNavOption);
        // Use immediate callback instead of timeout
        onNavOptionSelect(lastNavOption);
      }

      hasInitialized.current = true;
      onPreferencesReady();
      window.clearTimeout(initializationTimeout);
      return;
    }

    // If still loading but taking too long, the timeout will handle it
    return () => {
      window.clearTimeout(initializationTimeout);
    };
  }, [userId, userPrefs, userPrefsError, userPrefsLoading, currentTenant, onTenantChange, onNavOptionSelect, onPreferencesReady]);

  // This component doesn't render anything - it's just for state management
  return null;
}