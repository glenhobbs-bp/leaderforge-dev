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

  // Debug the enabled condition
  console.log('[UserPreferencesManager] 🔍 USER PREFS HOOK DEBUG:', {
    shouldFetchUserPrefs,
    hasSessionUserId: !!userId,
    sessionUserId: userId,
    enabled: shouldFetchUserPrefs && !!userId,
    isLoading: userPrefsLoading,
    hasData: !!userPrefs,
    hasError: !!userPrefsError
  });

  // Mark component as mounted on initial render
  useEffect(() => {
    console.log('[UserPreferencesManager] 🎯 Component mounting...');
    hasMounted.current = true;
    console.log('[UserPreferencesManager] ✅ Component mounted, hasMounted set to true');
  }, []);

  // Trigger user preferences fetch on initial mount when session is available
  useEffect(() => {
    console.log('[UserPreferencesManager] 🔍 USER PREFS TRIGGER DEBUG:', {
      hasSessionUserId: !!userId,
      sessionUserId: userId,
      hasTriggeredUserPrefsFetch: hasTriggeredUserPrefsFetch.current,
      shouldFetchUserPrefs,
      hasMounted: hasMounted.current,
      willTrigger: userId && !hasTriggeredUserPrefsFetch.current && !shouldFetchUserPrefs && hasMounted.current
    });

    if (userId && !hasTriggeredUserPrefsFetch.current && !shouldFetchUserPrefs && hasMounted.current) {
      console.log('[UserPreferencesManager] Triggering initial user preferences fetch for session:', userId);
      hasTriggeredUserPrefsFetch.current = true;
      setShouldFetchUserPrefs(true);
    }
  }, [userId, shouldFetchUserPrefs]);

  // Handle user preferences errors gracefully
  useEffect(() => {
    if (userPrefsError) {
      console.warn('[UserPreferencesManager] User preferences failed to load:', userPrefsError);
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
        console.log('[UserPreferencesManager] Skipping tenant restoration due to user preferences error');
        setHasRestoredTenant(true);
        onPreferencesReady();
      }
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

    if (!userId || !hasRealUserPrefs || hasRestoredTenant || userPrefsLoading) {
      if (userPrefsLoading) {
        console.log('[UserPreferencesManager] ⏳ Waiting for user preferences to load...');
      }
      if (!hasRealUserPrefs && userPrefs) {
        console.log('[UserPreferencesManager] ⏳ User preferences is empty placeholder, waiting for real data...', {
          userPrefs,
          hasTheme: 'theme' in userPrefs,
          hasNavigationState: 'navigationState' in userPrefs,
          hasLanguage: 'language' in userPrefs,
          objectKeys: Object.keys(userPrefs)
        });
      }
      return;
    }

    // ✅ FIX: Add detailed debugging for user preferences structure
    console.log('[UserPreferencesManager] 🔍 DEBUG: Full userPrefs data:', userPrefs);
    console.log('[UserPreferencesManager] 🔍 DEBUG: User prefs loading state:', { userPrefsLoading, userPrefsError, hasUserPrefs: !!userPrefs });

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;

    console.log('[UserPreferencesManager] 🔍 DEBUG: Navigation state details:', {
      preferences,
      navigationState,
      lastTenant,
      lastNavOption: navigationState?.lastNavOption,
      lastUpdated: navigationState?.lastUpdated
    });

    console.log('[UserPreferencesManager] Tenant restoration:', {
      lastTenant,
      currentTenant,
      hasRestoredTenant
    });

    // ✅ FIXED: Only restore tenant if it's actually different AND not already set
    // Prevent infinite loops when tenant is already correct
    if (lastTenant && lastTenant !== currentTenant && hasRestoredTenant === false) {
      console.log('[UserPreferencesManager] Restoring last tenant:', lastTenant);
      onTenantChange(lastTenant);
    } else {
      console.log('[UserPreferencesManager] Tenant restoration skipped:', {
        hasLastTenant: !!lastTenant,
        tenantsDifferent: lastTenant !== currentTenant,
        contextNotRestored: hasRestoredTenant === false,
        reason: !lastTenant ? 'no saved tenant' :
                lastTenant === currentTenant ? 'tenant already correct' : 'context already restored'
      });
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

    console.log('[UserPreferencesManager] 🔄 Navigation restoration effect triggered:', {
      hasSession: !!userId,
      hasUserPrefs: !!userPrefs,
      hasUserPrefsError: !!userPrefsError,
      hasRestoredTenant,
      currentTenant,
      userPrefsLoading
    });

    // If user preferences failed to load, skip navigation restoration
    if (userPrefsError) {
      console.log('[UserPreferencesManager] Skipping navigation restoration due to user preferences error');
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
      if (userPrefsLoading) {
        console.log('[UserPreferencesManager] ⏳ Waiting for user preferences to load for navigation restoration...');
      }
      if (!hasRealUserPrefs && userPrefs) {
        console.log('[UserPreferencesManager] ⏳ User preferences is empty placeholder for navigation, waiting for real data...', {
          userPrefs,
          hasTheme: 'theme' in userPrefs,
          hasNavigationState: 'navigationState' in userPrefs,
          hasLanguage: 'language' in userPrefs,
          objectKeys: Object.keys(userPrefs)
        });
      }
      return;
    }

    // ✅ FIX: userPrefs IS the preferences object (API client extracts it)
    const preferences = userPrefs as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;
    const lastNavOption = navigationState?.lastNavOption;

    console.log('[UserPreferencesManager] 📊 Navigation restoration data:', {
      navigationState,
      lastTenant,
      lastNavOption,
      currentTenant,
      shouldRestore: lastNavOption && lastTenant === currentTenant,
      // ✅ DEBUG: Add more detailed debugging
      userPrefsStructure: userPrefs,
      preferencesIsUserPrefs: preferences === userPrefs,
      navigationStateRaw: navigationState
    });

    // Only restore navigation option if we're in the correct tenant and have a saved option
    if (lastNavOption && lastTenant === currentTenant) {
      console.log('[UserPreferencesManager] ✅ RESTORING navigation state:', {
        lastNavOption,
        lastTenant,
        currentTenant,
        timestamp: navigationState?.lastUpdated
      });

      hasNavigationRestored.current = true; // Mark as restored

      // Trigger content loading for the restored navigation option
      setTimeout(() => {
        console.log('[UserPreferencesManager] ⏳ Triggering content load for restored nav option:', lastNavOption);
        onNavOptionSelect(lastNavOption);
      }, 200); // Small delay to ensure context is fully set
    } else {
      console.log('[UserPreferencesManager] 📋 No navigation state to restore:', {
        hasLastNavOption: !!lastNavOption,
        lastTenant: lastTenant || 'none',
        currentTenant,
        reason: !lastNavOption ? 'no saved navigation' : 'tenant mismatch'
      });
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