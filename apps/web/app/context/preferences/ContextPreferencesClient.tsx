"use client";

/**
 * Purpose: Client component for prompt context management
 * Owner: Prompt Management System
 * Tags: [prompt-contexts, client]
 */

import React, { useState, useEffect } from 'react';
import { PromptContextWidget } from '../../../components/widgets/PromptContextWidget';
import { useSupabase } from '../../../components/SupabaseProvider';

interface ContextData {
  id: string;
  name: string;
  description: string;
  scope: string;
  isEnabled: boolean;
  canEdit: boolean;
  priority: number;
}

export default function ContextPreferencesClient() {
  const { session, supabase } = useSupabase();
  const [contexts, setContexts] = useState<ContextData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContexts = async () => {
      if (!session?.user?.id || !supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch user's context preferences
        const response = await fetch('/api/context/preferences', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch contexts: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.contexts) {
          setContexts(result.contexts);
        } else {
          // If no contexts yet, show default empty state
          setContexts([]);
        }
      } catch (err) {
        console.error('[ContextPreferencesClient] Error fetching contexts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contexts');
      } finally {
        setLoading(false);
      }
    };

    fetchContexts();
  }, [session, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Context Preferences
            </h1>
            <p className="text-gray-600">
              Manage your prompt context settings for enhanced AI interactions
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center py-8">
              <div className="text-blue-600 text-4xl mb-4">⚙️</div>
              <p className="text-gray-600">Loading your context preferences...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Context Preferences
            </h1>
            <p className="text-gray-600">
              Manage your prompt context settings for enhanced AI interactions
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center py-8">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Unable to Load Contexts
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform the contexts data to match the widget's expected format
  const transformedContexts = contexts.map(ctx => ({
    id: ctx.id,
    name: ctx.name,
    description: ctx.description,
    type: ctx.scope.toLowerCase() as 'personal' | 'team' | 'organization' | 'external',
    isActive: ctx.isEnabled,
    canEdit: ctx.canEdit,
    icon: ctx.scope.toLowerCase(),
    priority: ctx.priority,
    lastUpdated: 'Recently',
    usage: Math.floor(Math.random() * 100) // Mock usage data
  }));

  return (
    <PromptContextWidget
      data={{
        contexts: transformedContexts,
        groupByScope: true,
        showScopeIcons: true,
        enableRealTimeToggle: true,
        apiEndpoint: '/api/context/preferences'
      }}
    />
  );
}