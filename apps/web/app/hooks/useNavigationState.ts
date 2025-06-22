// File: apps/web/app/hooks/useNavigationState.ts
// Purpose: React hook for persisting navigation state with optimistic updates
// Owner: Frontend team
// Tags: React hooks, navigation state, user preferences

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserPreferences } from './useUserPreferences';
import type { UserPreferences } from '../lib/types';

interface UseNavigationStateProps {
  userId: string;
  contextKey: string;
}

interface UseNavigationStateReturn {
  lastNavOptionId: string | null;
  updateNavigationState: (navOptionId: string) => void;
  isLoading: boolean;
}

/**
 * Hook for managing navigation state persistence
 */
export function useNavigationState({ userId, contextKey }: UseNavigationStateProps): UseNavigationStateReturn {
  const { data: userPrefs } = useUserPreferences(userId);
  const queryClient = useQueryClient();

  // Get last navigation state - FIX: Use correct field names that match userService
  const preferences = userPrefs?.preferences as UserPreferences;
  const navigationState = preferences?.navigationState; // Changed from 'navigation' to 'navigationState'
  const lastNavOptionId = navigationState?.lastContext === contextKey // Changed from 'lastContextKey' to 'lastContext'
    ? navigationState.lastNavOption || null // Changed from 'lastNavOptionId' to 'lastNavOption'
    : null;

  // Debounced mutation to update navigation state (reduce database calls)
  const updateNavStateMutation = useMutation({
    mutationFn: async (navOptionId: string) => {
      // Only update if different from current state
      if (lastNavOptionId === navOptionId) {
        return { success: true };
      }

      const response = await fetch(`/api/user/${userId}/navigation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextKey, navOptionId })
      });

      if (!response.ok) {
        // Don't throw error for navigation state - it's not critical
        console.warn('Navigation state update failed, continuing...');
        return { success: false };
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user preferences to sync with server (but don't block UI)
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
    },
    onError: (error) => {
      // Don't block UI for navigation state errors
      console.warn('Navigation state update failed:', error);
    }
  });

  const updateNavigationState = useCallback((navOptionId: string) => {
    updateNavStateMutation.mutate(navOptionId);
  }, [updateNavStateMutation]);

  return {
    lastNavOptionId,
    updateNavigationState,
    isLoading: updateNavStateMutation.isPending
  };
}