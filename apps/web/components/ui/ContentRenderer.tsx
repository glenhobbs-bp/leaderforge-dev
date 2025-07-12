"use client";
// File: apps/web/components/ui/ContentRenderer.tsx
// Purpose: Handles content rendering for different schema types with memoization and error states
// Owner: Frontend Team
// Tags: #content #rendering #schema #universal-widget

import React, { useMemo } from 'react';
import { UniversalSchemaRenderer } from '../ai/UniversalSchemaRenderer';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';
import { defaultActionRegistry, type ActionData } from '../../app/lib/widgetActionRegistry';

interface AgentSchema {
  type: 'content_schema' | 'no_agent' | 'error' | 'mockup' | 'direct_route' | 'static_page';
  content?: unknown;
  message?: string;
  metadata?: {
    threadId?: string;
    runId?: string;
    agentId?: string;
    agentName?: string;
    agentType?: string;
    directRoute?: string;
  };
}

interface ContentRendererProps {
  agentSchema: AgentSchema | null;
  contentLoading: boolean;
  error: string | null;
  userId?: string;
  tenantKey: string;
  onAction?: (action: ActionData) => void;
  onProgressUpdate?: () => void;
}

export function ContentRenderer({
  agentSchema,
  contentLoading,
  error,
  userId,
  tenantKey,
  onAction,
  onProgressUpdate
}: ContentRendererProps) {
  // Create loading content component
  const createLoadingContent = () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4f49cf] mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );

  // 🤖 AGENT-NATIVE: Handle ComponentSchema from agent - MUST be at top level before any returns
  // Memoize content to prevent object recreation causing video re-mounting
  const content = useMemo(() => {
    return agentSchema?.content as ComponentSchema | { type: string; title?: string; description?: string; action?: string; message?: string } | undefined;
  }, [agentSchema?.content]);

  // Check if it's a ComponentSchema (Grid, Card, etc.) or UniversalWidgetSchema - also memoized
  const isComponentSchema = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content &&
      (content.type === 'Grid' || content.type === 'Card' || 'props' in content);
  }, [content]);

  // Check if it's a UniversalWidgetSchema (PromptContext, etc.)
  const isUniversalWidgetSchema = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content && 'id' in content && 'data' in content && 'config' in content && 'version' in content;
  }, [content]);

  const isWelcomeContent = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content && (content.type === 'welcome' || content.type === 'error');
  }, [content]);

  // Memoize schema type separately to avoid contentComponent dependency on full agentSchema
  const schemaType = useMemo(() => {
    return agentSchema?.type;
  }, [agentSchema?.type]);

  // Action handler for Universal Widget Schema interactions
  const handleAction = React.useCallback(async (action: ActionData) => {
    console.log('[ContentRenderer] Action triggered:', action);

    // ✅ ARCHITECTURAL FIX: Use action registry instead of hardcoded switch statement
    try {
      await defaultActionRegistry.handle(action);
      if (onAction) {
        onAction(action);
      }
    } catch (error) {
      console.error('[ContentRenderer] Action handling failed:', error);
    }
  }, [onAction]);

  // Memoize content component to prevent video re-mounting - MUST be at top level before any returns
  const contentComponent = useMemo(() => {
    if (contentLoading) {
      return createLoadingContent();
    }

    // Check for static page response
    if (schemaType === 'static_page' && content && typeof content === 'object' && 'route' in content) {
      // ✅ FIX: Remove console logs that were contributing to infinite render loops
      const staticPageContent = content as {
        route: string;
        title?: string;
        componentId?: string;
      };

      // Map routes to their corresponding page components
      const routeComponentMap: Record<string, string> = {
        '/context/preferences': 'PromptContextsPage',
        'context/preferences': 'PromptContextsPage'
      };

      const componentName = routeComponentMap[staticPageContent.route];

      if (componentName) {
        // Dynamically import the page component through mockup system
        const PageComponent = React.lazy(() => import(`../mockups/${componentName}`));

        return (
          <div className="static-page-content">
            <React.Suspense fallback={createLoadingContent()}>
              <PageComponent />
            </React.Suspense>
          </div>
        );
      } else {
        console.warn('[ContentRenderer] No component mapped for static page route:', staticPageContent.route);
        return (
          <div className="p-6">
            <div className="text-center">
              <div className="text-gray-500 mb-4">📄</div>
              <p className="text-gray-600">Static page component not found for route: {staticPageContent.route}</p>
            </div>
          </div>
        );
      }
    }

    // Check for mockup agent response
    if (schemaType === 'mockup' && content && typeof content === 'object' && 'component' in content) {
      console.log('[ContentRenderer] Rendering mockup agent response:', content);
      const mockupContent = content as {
        component: string;
        title?: string;
        subtitle?: string;
        metadata?: Record<string, unknown>
      };

      // Dynamically import MockupRenderer
      const MockupRenderer = React.lazy(() => import('./MockupRenderer'));

      return (
        <div className="p-6">
          <React.Suspense fallback={createLoadingContent()}>
            <MockupRenderer
              componentName={mockupContent.component}
              title={mockupContent.title}
              subtitle={mockupContent.subtitle}
              metadata={mockupContent.metadata}
            />
          </React.Suspense>
        </div>
      );
    }

    if (isComponentSchema || isUniversalWidgetSchema) {
      console.log('[ContentRenderer] Rendering UniversalSchemaRenderer with userId:', {
        hasSession: !!userId,
        userId: userId,
        schemaType: content && typeof content === 'object' && 'type' in content ? content.type : 'unknown'
      });
      return (
        <div className="p-6">
          <UniversalSchemaRenderer
            schema={content as UniversalWidgetSchema}
            userId={userId}
            tenantKey={tenantKey}
            onAction={handleAction}
            onProgressUpdate={onProgressUpdate || (() => {
              // ✅ FIXED: No need to refresh content - progress tracking is handled automatically
              // Progress updates should not trigger content reloads as they don't change the content structure
              console.log('[ContentRenderer] Video progress updated - no content refresh needed');
            })}
          />
        </div>
      );
    }

    // Show welcome content
    if (isWelcomeContent) {
      const welcomeContent = content as { type: string; title?: string; description?: string; action?: string; message?: string };
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <img src="/logos/leaderforge-icon.png" alt="LeaderForge Icon" width={40} height={40} />
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {welcomeContent.title || 'Welcome'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {welcomeContent.description || welcomeContent.message || 'Select an option from the navigation to get started.'}
              </p>
              {welcomeContent.action && (
                <button className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors">
                  {welcomeContent.action}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show error content
    if (schemaType === 'error') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <img src="/logos/leaderforge-icon.png" alt="LeaderForge Icon" width={40} height={40} />
            </div>
            <div className="space-y-4">
              <div className="text-red-500 mb-4 text-2xl">⚠️</div>
              <h1 className="text-xl font-bold text-gray-800">Content Error</h1>
              <p className="text-sm text-gray-600">
                {agentSchema?.message || 'Unable to load content. Please try refreshing the page.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default fallback content
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon.png" alt="LeaderForge Icon" width={40} height={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">No Content Available</h1>
            <p className="text-sm text-gray-600">Please select an option from the navigation.</p>
          </div>
        </div>
      </div>
    );
  }, [contentLoading, schemaType, content, isComponentSchema, isUniversalWidgetSchema, isWelcomeContent, userId, tenantKey, handleAction, onProgressUpdate, agentSchema?.message]);

  // Show error state - no fallback schema
  if (error && !agentSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/leaderforge-icon-large.png" alt="LeaderForge" width={48} height={48} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-medium text-gray-800 mb-2">Response Error</p>
            <p className="text-xs text-gray-600 text-center mb-6">Invalid agent response - please refresh</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4f49cf] text-white text-sm rounded-xl hover:bg-[#423db8] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return contentComponent;
}