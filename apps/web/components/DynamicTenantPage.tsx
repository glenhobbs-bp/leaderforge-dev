"use client";
// File: apps/web/components/DynamicTenantPage.tsx
// Purpose: Agent-native 3-panel layout. Pure renderer - displays only what agents return.
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { UniversalSchemaRenderer } from "./ai/UniversalSchemaRenderer";
import { ComponentSchema } from "../../../packages/agent-core/types/ComponentSchema";
import { UniversalWidgetSchema } from "../../../packages/agent-core/types/UniversalWidgetSchema";
import { VideoPlayerModal } from "./widgets/VideoPlayerModal";
import { FormWidget } from "./forms/FormWidget";
import { useSupabase } from './SupabaseProvider';
import React from "react";
import { useUserPreferences } from '../app/hooks/useUserPreferences';
import { useQueryClient } from '@tanstack/react-query';
import type { UserPreferences } from '../app/lib/types';

// Diagnostic: Track module load
console.log('[DynamicTenantPage] Module loaded - Database-driven mode');

// Agent schema types - includes mockup support for agent-native mockups
interface AgentSchema {
  type: 'content_schema' | 'no_agent' | 'error' | 'mockup';
  content?: unknown; // ComponentSchema, mockup data, or simple content objects
  message?: string; // For no_agent responses
  metadata?: {
    threadId?: string;
    runId?: string;
    agentId?: string;
    agentName?: string;
    agentType?: string;
  };
}

type DynamicTenantPageProps = {
  // Props for tenant management
  initialTenants?: Array<{
    tenant_key: string;
    display_name: string;
    theme?: unknown;
    i18n?: unknown;
    logo_url?: string;
    nav_options?: unknown;
    settings?: unknown;
    created_at?: string;
    updated_at?: string;
    subtitle?: string;
  }>;
  initialTenantConfig?: unknown;
  initialNavOptions?: unknown;
  defaultTenantKey?: string;
};

export default function DynamicTenantPage(props: DynamicTenantPageProps) {
  console.log('[DynamicTenantPage] RENDER - Database-driven', props);

  // Auth context
  const { session, loading: authLoading } = useSupabase();

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Core state
  const hasMounted = useRef(false);
  const [hasRestoredContext, setHasRestoredContext] = useState(false);
  const [shouldFetchUserPrefs, setShouldFetchUserPrefs] = useState(false);

  // Video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState<{ action: string; label: string; [key: string]: unknown } | null>(null);

  // Worksheet modal state
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetModalData, setWorksheetModalData] = useState<{ contentId: string; title: string; templateId?: string; [key: string]: unknown } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<string>(
    props.defaultTenantKey || props.initialTenants?.[0]?.tenant_key || 'brilliant'
  );
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false); // New loading state for content
  const [error, setError] = useState<string | null>(null);
  const [selectedNavOptionId, setSelectedNavOptionId] = useState<string | null>(null);

  // Only fetch user preferences when explicitly needed
  const { data: userPrefs, error: userPrefsError } = useUserPreferences(
    session?.user?.id || '',
    { enabled: shouldFetchUserPrefs && !!session?.user?.id }
  );

  // Trigger user preferences fetch on initial mount when session is available
  useEffect(() => {
    if (session?.user?.id && !shouldFetchUserPrefs && !hasRestoredContext) {
      console.log('[DynamicTenantPage] Triggering initial user preferences fetch for session:', session.user.id);
      setShouldFetchUserPrefs(true);
    }
  }, [session?.user?.id, shouldFetchUserPrefs, hasRestoredContext]);

  // Handle user preferences errors gracefully
  useEffect(() => {
    if (userPrefsError) {
      console.warn('[DynamicTenantPage] User preferences failed to load:', userPrefsError);
      // Don't block the app, just mark restoration as complete to proceed
      if (!hasRestoredContext) {
        setHasRestoredContext(true);
      }
    }
  }, [userPrefsError, hasRestoredContext]);

  // Context restoration effect - restore last visited context
  useEffect(() => {
    // If user preferences failed to load, proceed without restoration
    if (userPrefsError) {
      if (!hasRestoredContext) {
        console.log('[DynamicTenantPage] Skipping tenant restoration due to user preferences error');
        setHasRestoredContext(true);
      }
      return;
    }

    if (!session?.user?.id || !userPrefs || hasRestoredContext) return;

    const preferences = userPrefs.preferences as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;

    console.log('[DynamicTenantPage] Tenant restoration:', {
      lastTenant,
      currentTenant,
      hasRestoredContext
    });

          // Restore tenant if different
      if (lastTenant && lastTenant !== currentTenant) {
        console.log('[DynamicTenantPage] Restoring last tenant:', lastTenant);
        setCurrentTenant(lastTenant);
      }

    setHasRestoredContext(true);
  }, [session?.user?.id, userPrefs, userPrefsError, hasRestoredContext, currentTenant]);

  // Navigation option restoration effect - runs after context is restored
  useEffect(() => {
    console.log('[DynamicTenantPage] 🔄 Navigation restoration effect triggered:', {
      hasSession: !!session?.user?.id,
      hasUserPrefs: !!userPrefs,
      hasUserPrefsError: !!userPrefsError,
      hasRestoredContext,
      currentTenant
    });

    // If user preferences failed to load, skip navigation restoration
    if (userPrefsError) {
      console.log('[DynamicTenantPage] Skipping navigation restoration due to user preferences error');
      return;
    }

    if (!session?.user?.id || !userPrefs || !hasRestoredContext) return;

    const preferences = userPrefs.preferences as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastTenant = navigationState?.lastTenant;
    const lastNavOption = navigationState?.lastNavOption;

    console.log('[DynamicTenantPage] 📊 Navigation restoration data:', {
      navigationState,
      lastTenant,
      lastNavOption,
      currentTenant,
      shouldRestore: lastNavOption && lastTenant === currentTenant
    });

    // Only restore navigation option if we're in the correct tenant and have a saved option
    if (lastNavOption && lastTenant === currentTenant) {
      console.log('[DynamicTenantPage] ✅ RESTORING navigation state:', {
        lastNavOption,
        lastTenant,
        currentTenant,
        timestamp: navigationState?.lastUpdated
      });
      setSelectedNavOptionId(lastNavOption);

      // Trigger content loading for the restored navigation option
      setTimeout(() => {
        console.log('[DynamicTenantPage] ⏳ Triggering content load for restored nav option:', lastNavOption);
        loadContentForNavOption(lastNavOption, false); // Don't update selection since it's already set
      }, 200); // Small delay to ensure context is fully set
    } else {
      console.log('[DynamicTenantPage] ❌ NOT restoring navigation state:', {
        hasLastNavOption: !!lastNavOption,
        lastTenant,
        currentTenant,
        tenantMatch: lastTenant === currentTenant
      });
    }
  }, [session?.user?.id, userPrefs, userPrefsError, hasRestoredContext, currentTenant]);

  // Debug session state
  useEffect(() => {
    console.log('[DynamicTenantPage] Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      authLoading,
      loading
    });
  }, [session, authLoading, loading]);

  // Track mounting for debug logging
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('[DynamicTenantPage] Component mounted - Database-driven mode');
      }
    }
  }, []);

  // 🤖 AGENT-NATIVE: Handle ComponentSchema from agent - MUST be at top level before any returns
  // Memoize content to prevent object recreation causing video re-mounting
  const content = useMemo(() => {
    return agentSchema?.content as ComponentSchema | { type: string; title?: string; description?: string; action?: string; message?: string } | undefined;
  }, [agentSchema?.content]);

  // Check if it's a ComponentSchema (Grid, Card, etc.) or simple content - also memoized
  const isComponentSchema = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content &&
      (content.type === 'Grid' || content.type === 'Card' || 'props' in content);
  }, [content]);

  const isWelcomeContent = useMemo(() => {
    return content && typeof content === 'object' && 'type' in content && (content.type === 'welcome' || content.type === 'error');
  }, [content]);

  // Create loading content component for content panel - MUST be defined before useMemo
  const createLoadingContent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E5E17] mb-4"></div>
          <p className="text-sm font-medium text-gray-800 mb-2">Loading Content</p>
          <p className="text-xs text-gray-600 text-center">
            Just a moment while we fetch your content...
          </p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-[#3E5E17] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#DD8D00] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#74A78E] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );



  // Action handler for Universal Widget Schema interactions
  const handleAction = useCallback(async (action: { action: string; label: string; [key: string]: unknown }) => {
    console.log('[DynamicTenantPage] Action triggered:', action);

    switch (action.action) {
      case 'openVideoModal':
        console.log('[DynamicTenantPage] Opening video modal:', action);
        setVideoModalData(action);
        setIsVideoModalOpen(true);
        break;

      case 'openWorksheet':
        console.log('[DynamicTenantPage] Opening worksheet:', action);
        setWorksheetModalData({
          contentId: (action.contentId as string) || (action.parameters as any)?.contentId || 'unknown',
          title: (action.title as string) || (action.parameters as any)?.title || 'Content Worksheet',
          templateId: (action.templateId as string) || (action.parameters as any)?.templateId || '663570eb-babd-41cd-9bfa-18972275863b', // Default to existing template
          ...action
        });
        setIsWorksheetModalOpen(true);
        break;

      case 'completeProgress':
        console.log('[DynamicTenantPage] Completing progress:', action);
        // TODO: Implement progress completion
        break;

      default:
        console.warn('[DynamicTenantPage] Unknown action:', action);
        break;
    }
  }, []);

  // Memoize content component to prevent video re-mounting - MUST be at top level before any returns
  const contentComponent = useMemo(() => {
    console.log('[DynamicTenantPage] contentComponent memo triggered:', {
      contentLoading,
      agentSchemaType: agentSchema?.type,
      content,
      hasComponent: content && typeof content === 'object' && 'component' in content
    });

    if (contentLoading) {
      return createLoadingContent();
    }

    // Check for mockup agent response
    if (agentSchema?.type === 'mockup' && content && typeof content === 'object' && 'component' in content) {
      console.log('[DynamicTenantPage] Rendering mockup agent response:', content);
      const mockupContent = content as {
        component: string;
        title?: string;
        subtitle?: string;
        metadata?: Record<string, unknown>
      };

      // Dynamically import MockupRenderer
      const MockupRenderer = React.lazy(() => import('./ui/MockupRenderer'));

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

    if (isComponentSchema) {
      console.log('[DynamicTenantPage] Rendering UniversalSchemaRenderer with userId:', {
        session: !!session,
        userId: session?.user?.id,
        authLoading,
        sessionUser: session?.user
      });
      return (
        <div className="p-6">
          <UniversalSchemaRenderer
            schema={content as UniversalWidgetSchema}
            userId={session?.user?.id}
            tenantKey={currentTenant}
            onAction={handleAction}
            onProgressUpdate={() => {
              // Refresh content when video progress is updated
              if (selectedNavOptionId) {
                console.log('[DynamicTenantPage] Refreshing content after progress update');
                loadContentForNavOption(selectedNavOptionId, false);
              }
            }}
          />
        </div>
      );
    }

    if (isWelcomeContent) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="mb-4 text-4xl" style={{ color: 'var(--primary, #667eea)' }}>✨</div>
            <h2 className="text-2xl font-semibold mb-4">
              {'title' in content ? content.title : 'Welcome'}
            </h2>
            <p className="text-gray-600 mb-6">
              {'description' in content ? content.description : 'Loading content...'}
            </p>
            <div className="px-4 py-2 rounded-lg inline-block" style={{ backgroundColor: 'var(--bg-neutral, #e8f4f8)', color: 'var(--primary, #667eea)' }}>
              {'action' in content ? content.action : 'Please wait'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-gray-500 mb-4">📄</div>
          <p className="text-gray-600">
            {typeof content === 'string' ? content :
             (content && typeof content === 'object' && 'message' in content ? content.message : 'Content loaded successfully')}
          </p>
        </div>
      </div>
    );
  }, [contentLoading, isComponentSchema, isWelcomeContent, content, agentSchema]);

  // 🤖 AGENT-NATIVE: Single API call to get complete UI schema
  useEffect(() => {
    const fetchAgentSchema = async () => {
      // Wait for authentication to complete
      if (authLoading) {
        setLoading(true);
        return;
      }

      // If auth is complete but no session, that's an error
      if (!session?.user?.id) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicTenantPage] Database-driven mode - creating welcome schema for tenant:', currentTenant);
        }

        // 🗄️ DATABASE-DRIVEN: Create simple welcome schema without agent calls
        const contextNames: Record<string, string> = {
          'brilliant': 'Brilliant Movement',
          'leaderforge': 'LeaderForge',
          'wealth': 'Wealth Academy'
        };

        const welcomeSchema: AgentSchema = {
          type: 'content_schema',
          content: {
            type: 'welcome',
            title: contextNames[currentTenant] || currentTenant.charAt(0).toUpperCase() + currentTenant.slice(1),
            description: 'Select an option from the navigation to get started.',
            action: 'Browse Navigation'
          }
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicTenantPage] Database-driven welcome schema created:', welcomeSchema);
        }

        setAgentSchema(welcomeSchema);
        setError(null);
        console.log('[DynamicTenantPage] Welcome schema set successfully:', welcomeSchema);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DynamicTenantPage] Welcome schema creation failed:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentSchema();
  }, [session?.user?.id, currentTenant, authLoading]);

  // Handle tenant change - also persist the change
  const handleTenantChange = (tenantKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicTenantPage] Tenant changed to:', tenantKey);
    }
    setCurrentTenant(tenantKey);

    // Clear selected navigation when context changes
    setSelectedNavOptionId(null);

    // Trigger user preferences refresh for new tenant
    setShouldFetchUserPrefs(true);

    // Persist context change to user preferences
    if (session?.user?.id) {
      fetch(`/api/user/${session.user.id}/navigation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantKey,
          navOptionId: null // Clear nav selection when changing tenant
        })
      }).catch(error => {
        console.warn('[DynamicTenantPage] Failed to persist context change:', error);
      });
    }
  };

  // Helper function to load content for a navigation option
  const loadContentForNavOption = async (navId: string, updateSelection: boolean = true) => {
    if (!session?.user?.id) {
      console.error('[DynamicTenantPage] No user session for navigation');
      return;
    }

    console.log('[DynamicTenantPage] 🚀 LOADING content for navigation option:', {
      navId,
      updateSelection,
      currentTenant,
      userId: session.user.id
    });

    // Update selected navigation option if requested
    if (updateSelection) {
      setSelectedNavOptionId(navId);
    }

    // Show loading state while fetching content
    setContentLoading(true);

    try {
      // Call the agent content API
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: session.user.id,
          tenantKey: currentTenant,
          navOptionId: navId,
          intent: {
            message: `Show me content for navigation option ${navId}`
          }
        })
      });

      if (!response.ok) {
        let errorData: { message?: string; error?: string };
        try {
          errorData = await response.json() as { message?: string; error?: string };
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('[DynamicTenantPage] Agent API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        // Clear loading state
        setContentLoading(false);

        // Show error state with more details
        setAgentSchema({
          type: 'error',
          content: {
            type: 'error',
            title: 'Unable to Load Content',
            description: errorData.error || errorData.message || `Server error: ${response.status}`,
            action: 'Retry'
          }
        });
        return;
      }

      const agentResponse = await response.json();
      console.log('[DynamicTenantPage] Agent response:', agentResponse);

      // Clear loading state
      setContentLoading(false);

      // Handle different response types
      if (agentResponse.type === 'no_agent') {
        // No agent assigned - show placeholder
        setAgentSchema({
          type: 'content_schema',
          content: {
            type: 'welcome',
            title: 'Feature Coming Soon',
            description: agentResponse.message || `The ${navId} feature is being prepared for you.`,
            action: 'Check back soon!'
          }
        });
      } else if (agentResponse.type === 'mockup') {
        // Mockup agent response - preserve type and content structure
        console.log('[DynamicTenantPage] Setting mockup agent schema:', agentResponse);
        setAgentSchema({
          type: 'mockup',
          content: agentResponse.content,
          metadata: agentResponse.metadata
        });
      } else if (agentResponse.type === 'content_schema' || agentResponse.schema) {
        // Agent returned content schema
        setAgentSchema(agentResponse);
      } else {
        // Transform agent response to expected format
        setAgentSchema({
          type: 'content_schema',
          content: agentResponse
        });
      }

    // Persist navigation state to database (always persist when content loads successfully)
    if (session?.user?.id) {
      try {
        await fetch(`/api/user/${session.user.id}/navigation-state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantKey: currentTenant,
            navOptionId: navId
          })
        });
        console.log('[DynamicTenantPage] ✅ Navigation state persisted:', { tenantKey: currentTenant, navOptionId: navId });

        // Invalidate user preferences cache to ensure fresh data on next load
        queryClient.invalidateQueries({ queryKey: ['user-preferences', session.user.id] });
        console.log('[DynamicTenantPage] 🔄 User preferences cache invalidated');
      } catch (error) {
        console.warn('[DynamicTenantPage] ⚠️ Failed to persist navigation state:', error);
      }
    }

  } catch (error) {
      console.error('[DynamicTenantPage] Network error calling agent:', error);

      // Clear loading state
      setContentLoading(false);

      // Show network error state
      setAgentSchema({
        type: 'error',
        content: {
          type: 'error',
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your connection.',
          action: 'Retry'
        }
      });
    }
  };

  // 🤖 AGENT-NATIVE: Navigation selection with agent invocation
  const handleNavSelect = async (navId: string) => {
    // Update selection and load content
    setSelectedNavOptionId(navId);
    await loadContentForNavOption(navId, false); // Don't update selection again
  };

  // Show loading state while waiting for auth or schema
  if (!session || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E5E17] mb-4"></div>
            <p className="text-sm font-medium text-gray-800 mb-2">
              {!session ? 'Authenticating...' : 'Loading Experience'}
            </p>
            <p className="text-xs text-gray-600 text-center">
              {!session ? 'Verifying your credentials...' : 'Setting up your personalized experience...'}
            </p>
            <div className="mt-4 flex space-x-1">
              <div className="w-2 h-2 bg-[#3E5E17] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#DD8D00] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[#74A78E] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state - no fallback schema
  if (error && !agentSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-medium text-gray-800 mb-2">Response Error</p>
            <p className="text-xs text-gray-600 text-center mb-6">Invalid agent response - please refresh</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#3E5E17] text-white text-sm rounded-xl hover:bg-[#2d4511] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check for valid agent response based on type
  if (!agentSchema) {
    console.log('[DynamicTenantPage] No agentSchema found - showing invalid response error');
    console.log('[DynamicTenantPage] Current state:', { agentSchema, loading, error, authLoading });
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-medium text-gray-800 mb-2">Response Error</p>
            <p className="text-xs text-gray-600 text-center mb-6">Invalid agent response - please refresh</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#3E5E17] text-white text-sm rounded-xl hover:bg-[#2d4511] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle different response types OR show loading content with navigation
  console.log('[DynamicTenantPage] Checking agentSchema type:', agentSchema?.type, 'has content:', !!agentSchema?.content, 'contentLoading:', contentLoading);

  // If we're loading content or have content, show the layout with navigation
  if (contentLoading || ((agentSchema?.type === 'content_schema' || agentSchema?.type === 'error' || agentSchema?.type === 'mockup') && agentSchema.content)) {
    console.log('[DynamicTenantPage] Handling content_schema response or loading state');
    console.log('[DynamicTenantPage] agentSchema.content:', agentSchema?.content);

    // Navigation is now handled by NavPanel's database-driven approach

    // Create nav component using database-driven approach
    const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
      return (
        <NavPanel
          tenantKey={currentTenant}
          contextOptions={props.initialTenants?.map(ctx => ({
            id: ctx.tenant_key,
            title: ctx.display_name,
            subtitle: ctx.subtitle || 'AI-Powered Experience',
            icon: 'star'
          })) || []}
          selectedTenantKey={currentTenant}
          onContextChange={handleTenantChange}
          onNavSelect={handleNavSelect}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          userId={session?.user?.id}
          selectedNavOptionId={selectedNavOptionId}
        />
      );
    };

            // Use the proper tenant-specific theme from database
    const tenantConfig = props.initialTenants?.find(ctx => ctx.tenant_key === currentTenant) || props.initialTenantConfig;
    const defaultTheme = {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#4ecdc4',
      bg_light: '#f8f9ff',
      bg_neutral: '#e8f4f8',
      text_primary: '#333333',
      bg_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    const theme = (tenantConfig && typeof tenantConfig === 'object' && 'theme' in tenantConfig ? tenantConfig.theme as typeof defaultTheme : null) || defaultTheme;

    return (
      <div style={{
        '--primary': theme.primary,
        '--secondary': theme.secondary,
        '--accent': theme.accent,
        '--bg-light': theme.bg_light,
        '--bg-neutral': theme.bg_neutral,
        '--text-primary': theme.text_primary,
        '--card-bg': theme.bg_light || '#ffffff'
      } as React.CSSProperties}>
        <ThreePanelLayout
          nav={<NavComponent />}
          content={contentComponent}
          contextConfig={{
            theme: {
              primary: theme.primary,
              secondary: theme.secondary,
              accent: theme.accent,
              bg_light: theme.bg_light,
              bg_neutral: theme.bg_neutral,
              text_primary: theme.text_primary,
              bg_gradient: theme.bg_gradient
            }
          }}
        />

        {/* Video Modal */}
        {isVideoModalOpen && videoModalData && (
          <VideoPlayerModal
            schema={{
              type: 'VideoPlayer',
              id: `video-modal-${Date.now()}`,
              data: {
                videoUrl: videoModalData.videoUrl,
                poster: videoModalData.poster,
                description: videoModalData.description,
                progress: videoModalData.progress || 0
              } as any,
              config: {
                title: videoModalData.title,
                autoplay: true,
                actions: videoModalData.onCompleteAction ? [videoModalData.onCompleteAction] : []
              } as any,
              version: '1.0'
            } as UniversalWidgetSchema}
            open={isVideoModalOpen}
            onOpenChange={(open) => {
              setIsVideoModalOpen(open);
              if (!open) {
                setVideoModalData(null);
              }
            }}
            userId={session?.user?.id}
            tenantKey={currentTenant}
            onProgressUpdate={() => {
              // Refresh content when video progress is updated
              if (selectedNavOptionId) {
                console.log('[DynamicTenantPage] Refreshing content after video progress update');
                loadContentForNavOption(selectedNavOptionId, false);
              }
            }}
          />
        )}

        {/* Worksheet Modal */}
        {isWorksheetModalOpen && worksheetModalData && (
          <FormWidget
            templateId={worksheetModalData.templateId || '663570eb-babd-41cd-9bfa-18972275863b'}
            isOpen={isWorksheetModalOpen}
            onClose={() => {
              setIsWorksheetModalOpen(false);
              setWorksheetModalData(null);
            }}
            videoContext={{
              id: worksheetModalData.contentId,
              title: worksheetModalData.title
            }}
            onSubmit={async (submissionData) => {
              console.log('[DynamicTenantPage] Worksheet submitted:', submissionData);
              // Refresh content when worksheet is submitted
              if (selectedNavOptionId) {
                console.log('[DynamicTenantPage] Refreshing content after worksheet submission');
                loadContentForNavOption(selectedNavOptionId, false);
              }
              setIsWorksheetModalOpen(false);
              setWorksheetModalData(null);
            }}
          />
        )}
      </div>
    );
  }

  // 🚨 SHOULD NEVER REACH HERE - All valid responses handled above
  console.error('[DynamicTenantPage] Unhandled agentSchema type:', agentSchema.type);
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logos/brilliant-icon.png" alt="Brilliant Icon" width={40} height={40} />
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4 text-2xl">⚠️</div>
          <p className="text-sm font-medium text-gray-800 mb-2">System Error</p>
          <p className="text-xs text-gray-600 text-center mb-6">Unhandled response type: {agentSchema.type}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#3E5E17] text-white text-sm rounded-xl hover:bg-[#2d4511] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
