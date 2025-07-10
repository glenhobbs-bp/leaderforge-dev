"use client";
// File: apps/web/components/ui/UserPreferencesManager.tsx
// Purpose: Manages user preferences, tenant restoration, and navigation state management
// Owner: Frontend Team
// Tags: #user-preferences #tenant-restoration #navigation #state-management

import React, { useState, useEffect, useRef } from 'react';
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
  // Core state - prevent multiple mounts
  const hasMounted = useRef(false);
  const hasNavigationRestored = useRef(false);
  const hasTriggeredUserPrefsFetch = useRef(false);
  const [hasRestoredTenant, setHasRestoredTenant] = useState(false);
  const [shouldFetchUserPrefs, setShouldFetchUserPrefs] = useState(false);

  // Only fetch user preferences when explicitly needed
  const { data: userPrefs, error: userPrefsError, isLoading: userPrefsLoading } = useUserPreferences(
    userId || '',
    { enabled: shouldFetchUserPrefs && !!userId }
  );

      // ✅ FIX: Remove debug logging that was causing infinite render loops
  // Debugging disabled to prevent performance issues and infinite loops

  // Mark component as mounted on initial render
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // Trigger user preferences fetch on initial mount when session is available
  useEffect(() => {
    if (userId && !hasTriggeredUserPrefsFetch.current && !shouldFetchUserPrefs && hasMounted.current) {
      hasTriggeredUserPrefsFetch.current = true;
      setShouldFetchUserPrefs(true);
    }
  }, [userId, shouldFetchUserPrefs]);

  // Handle user preferences errors gracefully
  useEffect(() => {
    if (userPrefsError) {
      // Don't block the app, just mark restoration as complete to proceed
      if (!hasRestoredTenant) {
        setHasRestoredTenant(true);
        onPreferencesReady();
      }
    }
  }, [userPrefsError, hasRestoredTenant, onPreferencesReady]);

  // Context restoration effect - restore last visited context
  useEffect(() => {
    // If user preferences failed to load, proceed without restoration
    if (userPrefsError) {
      if (!hasRestoredTenant) {
        setHasRestoredTenant(true);
        onPreferencesReady();
      }
      return;
    }

    // ✅ FIX: Check for actual preference properties (not just object length) to detect real vs placeholder data
    // Wait for actual data before proceeding
    const hasRealUserPrefs = userPrefs && (
      'theme' in userPrefs ||
      'navigationState' in userPrefs ||
      'language' in userPrefs ||
      Object.keys(userPrefs).length > 0
    );

    if (!userId || !hasRealUserPrefs || hasRestoredTenant || userPrefsLoading) {
      // ✅ FIX: Remove console logs that were contributing to infinite render loops
      return;
    }

    // ✅ CRITICAL FIX: Remove debugging console logs to prevent infinite render loops

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;

    // Navigation state details extracted for processing

    // ✅ FIXED: Only restore tenant if it's actually different AND not already set
    // Prevent infinite loops when tenant is already correct
    if (lastTenant && lastTenant !== currentTenant && hasRestoredTenant === false) {
      onTenantChange(lastTenant);
    }

    setHasRestoredTenant(true);
    onPreferencesReady();
  }, [userId, userPrefs, userPrefsError, hasRestoredTenant, currentTenant, userPrefsLoading, onTenantChange, onPreferencesReady]);

  // Navigation option restoration effect - runs ONLY ONCE after context is restored
  useEffect(() => {
    // ✅ CRITICAL FIX: Early exit if already restored to prevent infinite loops
    if (hasNavigationRestored.current || !hasMounted.current) {
      return;
    }

    // If user preferences failed to load, skip navigation restoration
    if (userPrefsError) {
      hasNavigationRestored.current = true; // Mark as attempted to prevent retry loops
      return;
    }

    // ✅ FIX: Check for actual preference properties (not just object length) to detect real vs placeholder data
    // Placeholder data is {} but real data has properties like theme, navigationState, etc.
    const hasRealUserPrefs = userPrefs && (
      'theme' in userPrefs ||
      'navigationState' in userPrefs ||
      'language' in userPrefs ||
      Object.keys(userPrefs).length > 0
    );

    if (!userId || !hasRealUserPrefs || !hasRestoredTenant || userPrefsLoading) {
      return;
    }

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;
    const lastNavOption = navigationState?.lastNavOption;

    // Extract navigation restoration data

    // Only restore navigation option if we're in the correct tenant and have a saved option
    if (lastNavOption && lastTenant === currentTenant) {
      hasNavigationRestored.current = true; // Mark as restored

      // Trigger content loading for the restored navigation option
      setTimeout(() => {
        onNavOptionSelect(lastNavOption);
      }, 200); // Small delay to ensure context is fully set
    } else {
      hasNavigationRestored.current = true; // Mark as attempted even if no restoration
    }
  }, [userId, userPrefs, userPrefsError, hasRestoredTenant, currentTenant, userPrefsLoading, onNavOptionSelect]);

  // Show loading state if preferences not ready
  if (!hasRestoredTenant && !userPrefsError && userId) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-spinner mb-4"></div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Loading Experience
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
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

  // Component is invisible when ready - it only manages state
  return null;
}