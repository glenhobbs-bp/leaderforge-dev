/**
 * Purpose: Schema-driven Prompt Context Management Page - Uses PromptContextWidget
 * Owner: Prompt Management System
 * Tags: [prompt-contexts, schema-driven, agent-native, widget-based]
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UniversalSchemaRenderer } from '../../../components/ai/UniversalSchemaRenderer';

interface PromptContext {
  id: string;
  name: string;
  description: string;
  scope: 'personal' | 'team' | 'organization' | 'external';
  isEnabled: boolean;
  canEdit: boolean;
  requiresLicense: boolean;
  priority: number;
}

interface ContextPreferencesResponse {
  contexts: PromptContext[];
  success: boolean;
  error?: string;
}

export default function PromptContextsPage() {
  const router = useRouter();
  const [contexts, setContexts] = useState<PromptContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contexts on component mount
  useEffect(() => {
    loadContexts();
  }, []);

  const loadContexts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/context/preferences', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Failed to load contexts: ${response.status}`);
      }

      const data: ContextPreferencesResponse = await response.json();

      if (data.success) {
        setContexts(data.contexts);
      } else {
        throw new Error(data.error || 'Failed to load contexts');
      }
    } catch (err) {
      console.error('Error loading contexts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contexts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleContext = async (contextId: string, isEnabled: boolean) => {
    try {
      setError(null);

      const response = await fetch('/api/context/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contextId,
          isEnabled,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Failed to update context: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setContexts(prevContexts =>
          prevContexts.map(ctx =>
            ctx.id === contextId ? { ...ctx, isEnabled } : ctx
          )
        );
      } else {
        throw new Error(data.error || 'Failed to update context');
      }
    } catch (err) {
      console.error('Error updating context:', err);
      setError(err instanceof Error ? err.message : 'Failed to update context');
    }
  };

  // Create schema for PromptContextWidget
  const createContextSchema = () => ({
    type: "PromptContext",
    id: "prompt-context-management",
    version: "1.0.0",
    data: {
      source: "static",
      contextData: {
        contexts: contexts,
        groupByScope: true,
        showScopeIcons: true,
        apiEndpoint: '/api/context/preferences'
      }
    },
    config: {
      title: "Prompt Context Management",
      subtitle: "Configure how AI understands and responds to you across all LeaderForge interactions"
    }
  });

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading prompt contexts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      <UniversalSchemaRenderer
        schema={createContextSchema()}
        onAction={(action) => {
          if (action.action === 'context_toggled' && action.contextId && typeof action.enabled === 'boolean') {
            handleToggleContext(action.contextId as string, action.enabled as boolean);
          }
        }}
      />
    </div>
  );
}