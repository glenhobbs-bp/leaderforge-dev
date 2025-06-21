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

    // Get last navigation state
  const preferences = userPrefs?.preferences as UserPreferences;
  const navigationState = preferences?.navigation;
  const lastNavOptionId = navigationState?.lastContextKey === contextKey
    ? navigationState.lastNavOptionId || null
    : null;

  // Mutation for updating navigation state
  const updateNavStateMutation = useMutation({
    mutationFn: async (navOptionId: string) => {
      const response = await fetch(`/api/user/${userId}/navigation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextKey, navOptionId })
      });

      if (!response.ok) {
        throw new Error('Failed to update navigation state');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user preferences to sync with server
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
    },
    onError: (error) => {
      console.error('Failed to update navigation state:', error);
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