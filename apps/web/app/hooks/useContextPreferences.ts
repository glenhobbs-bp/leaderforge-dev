/**
 * File: apps/web/app/hooks/useContextPreferences.ts
 * Purpose: React hook for managing user context preferences
 * Owner: Engineering Team
 * Tags: #react #hooks #context #preferences
 */

import { useState, useEffect, useCallback } from 'react';

export interface ContextPreference {
  id: string;
  name: string;
  description: string;
  scope: 'global' | 'organization' | 'team' | 'personal';
  priority: number;
  isEnabled: boolean;
  canEdit: boolean;
  requiresLicense: boolean;
}

export interface ContextPreferencesState {
  contexts: ContextPreference[];
  loading: boolean;
  error: string | null;
  userHasPreferences: boolean;
}

export interface ContextPreferencesActions {
  toggleContext: (contextId: string, isEnabled: boolean) => Promise<void>;
  bulkUpdateContexts: (preferences: { contextId: string; isEnabled: boolean }[]) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  enabledContexts: ContextPreference[];
  disabledContexts: ContextPreference[];
}

export function useContextPreferences(): ContextPreferencesState & ContextPreferencesActions {
  const [state, setState] = useState<ContextPreferencesState>({
    contexts: [],
    loading: true,
    error: null,
    userHasPreferences: false
  });

  // Fetch user's context preferences
  const fetchPreferences = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/context/preferences', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      setState(prev => ({
        ...prev,
        contexts: data.contexts,
        userHasPreferences: data.userHasPreferences,
        loading: false
      }));

    } catch (error) {
      console.error('[useContextPreferences] Fetch error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }));
    }
  }, []);

  // Toggle a single context preference
  const toggleContext = useCallback(async (contextId: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/context/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contextId, isEnabled })
      });

      if (!response.ok) {
        throw new Error(`Failed to update context: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update context');
      }

      // Check if context was updated and trigger refresh
      if (response.headers.get('X-Context-Updated') === 'true') {
        console.log('[useContextPreferences] Context updated - triggering CopilotKit refresh');
        // Trigger custom event for CopilotKit to refresh
        window.dispatchEvent(new CustomEvent('context-preferences-updated'));
        // Also store in localStorage for cross-tab communication
        localStorage.setItem('context-preferences-updated', Date.now().toString());
        localStorage.removeItem('context-preferences-updated'); // Trigger storage event
      }

      // Optimistically update the state
      setState(prev => ({
        ...prev,
        contexts: prev.contexts.map(context =>
          context.id === contextId
            ? { ...context, isEnabled }
            : context
        )
      }));

    } catch (error) {
      console.error('[useContextPreferences] Toggle error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      // Refresh to get the correct state
      await fetchPreferences();
    }
  }, [fetchPreferences]);

  // Bulk update multiple context preferences
  const bulkUpdateContexts = useCallback(async (preferences: { contextId: string; isEnabled: boolean }[]) => {
    try {
      const response = await fetch('/api/context/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk update contexts: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to bulk update contexts');
      }

      // Check if context was updated and trigger refresh
      if (response.headers.get('X-Context-Updated') === 'true') {
        console.log('[useContextPreferences] Contexts bulk updated - triggering CopilotKit refresh');
        // Trigger custom event for CopilotKit to refresh
        window.dispatchEvent(new CustomEvent('context-preferences-updated'));
        // Also store in localStorage for cross-tab communication
        localStorage.setItem('context-preferences-updated', Date.now().toString());
        localStorage.removeItem('context-preferences-updated'); // Trigger storage event
      }

      // Optimistically update the state
      const updateMap = new Map(preferences.map(p => [p.contextId, p.isEnabled]));
      setState(prev => ({
        ...prev,
        contexts: prev.contexts.map(context =>
          updateMap.has(context.id)
            ? { ...context, isEnabled: updateMap.get(context.id)! }
            : context
        )
      }));

    } catch (error) {
      console.error('[useContextPreferences] Bulk update error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      // Refresh to get the correct state
      await fetchPreferences();
    }
  }, [fetchPreferences]);

  // Initialize preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Computed values
  const enabledContexts = state.contexts.filter(c => c.isEnabled);
  const disabledContexts = state.contexts.filter(c => !c.isEnabled);

  return {
    ...state,
    toggleContext,
    bulkUpdateContexts,
    refreshPreferences: fetchPreferences,
    enabledContexts,
    disabledContexts
  };
}