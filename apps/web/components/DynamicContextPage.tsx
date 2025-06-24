"use client";
// File: apps/web/components/DynamicContextPage.tsx
// Purpose: Agent-native 3-panel layout. Pure renderer - displays only what agents return.
import { useState, useEffect, useRef, useMemo } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
import { ComponentSchema } from "../../../packages/agent-core/types/ComponentSchema";
import { useSupabase } from './SupabaseProvider';
import React from "react";
import { useUserPreferences } from '../app/hooks/useUserPreferences';
import { useQueryClient } from '@tanstack/react-query';
import type { UserPreferences } from '../app/lib/types';

// Diagnostic: Track module load
console.log('[DynamicContextPage] Module loaded - Database-driven mode');

// Agent schema types - pure content_schema responses only
interface AgentSchema {
  type: 'content_schema' | 'no_agent' | 'error';
  content?: unknown; // ComponentSchema or simple content objects
  message?: string; // For no_agent responses
  metadata?: {
    threadId?: string;
    runId?: string;
    agentId?: string;
    agentName?: string;
  };
}

type DynamicContextPageProps = {
  // Props for context management
  initialContexts?: Array<{
    id: string;
    context_key: string;
    display_name: string;
    description?: string;
  }>;
  initialContextConfig?: unknown;
  initialNavOptions?: unknown;
  defaultContextKey?: string;
};

export default function DynamicContextPage(props: DynamicContextPageProps) {
  console.log('[DynamicContextPage] RENDER - Database-driven', props);

  // Auth context
  const { session, loading: authLoading } = useSupabase();

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Get user preferences for context restoration
  const { data: userPrefs } = useUserPreferences(session?.user?.id || '');

  // Core state
  const hasMounted = useRef(false);
  const [hasRestoredContext, setHasRestoredContext] = useState(false);
  const [currentContext, setCurrentContext] = useState<string>(
    props.defaultContextKey || props.initialContexts?.[0]?.context_key || 'brilliant'
  );
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false); // New loading state for content
  const [error, setError] = useState<string | null>(null);
  const [selectedNavOptionId, setSelectedNavOptionId] = useState<string | null>(null);

  // Navigation is now handled directly by NavPanel component

    // Context restoration effect - restore last visited context
  useEffect(() => {
    if (!session?.user?.id || !userPrefs || hasRestoredContext) return;

    const preferences = userPrefs.preferences as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastContext = navigationState?.lastContext;

    console.log('[DynamicContextPage] Context restoration:', {
      lastContext,
      currentContext,
      hasRestoredContext
    });

    // Restore context if different
    if (lastContext && lastContext !== currentContext) {
      console.log('[DynamicContextPage] Restoring last context:', lastContext);
      setCurrentContext(lastContext);
    }

    setHasRestoredContext(true);
  }, [session?.user?.id, userPrefs, hasRestoredContext, currentContext]);

  // Navigation option restoration effect - runs after context is restored
  useEffect(() => {
    console.log('[DynamicContextPage] 🔄 Navigation restoration effect triggered:', {
      hasSession: !!session?.user?.id,
      hasUserPrefs: !!userPrefs,
      hasRestoredContext,
      currentContext
    });

    if (!session?.user?.id || !userPrefs || !hasRestoredContext) return;

    const preferences = userPrefs.preferences as UserPreferences;
    const navigationState = preferences?.navigationState;
    const lastContext = navigationState?.lastContext;
    const lastNavOption = navigationState?.lastNavOption;

    console.log('[DynamicContextPage] 📊 Navigation restoration data:', {
      navigationState,
      lastContext,
      lastNavOption,
      currentContext,
      shouldRestore: lastNavOption && lastContext === currentContext
    });

    // Only restore navigation option if we're in the correct context and have a saved option
    if (lastNavOption && lastContext === currentContext) {
      console.log('[DynamicContextPage] ✅ RESTORING navigation state:', {
        lastNavOption,
        lastContext,
        currentContext,
        timestamp: navigationState?.lastUpdated
      });
      setSelectedNavOptionId(lastNavOption);

      // Trigger content loading for the restored navigation option
      setTimeout(() => {
        console.log('[DynamicContextPage] ⏳ Triggering content load for restored nav option:', lastNavOption);
        loadContentForNavOption(lastNavOption, false); // Don't update selection since it's already set
      }, 200); // Small delay to ensure context is fully set
    } else {
      console.log('[DynamicContextPage] ❌ NOT restoring navigation state:', {
        hasLastNavOption: !!lastNavOption,
        lastContext,
        currentContext,
        contextMatch: lastContext === currentContext
      });
    }
  }, [session?.user?.id, userPrefs, hasRestoredContext, currentContext]);

  // Debug session state
  useEffect(() => {
    console.log('[DynamicContextPage] Session state:', {
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
        console.log('[DynamicContextPage] Component mounted - Database-driven mode');
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

  // Memoize content component to prevent video re-mounting - MUST be at top level before any returns
  const contentComponent = useMemo(() => {
    if (contentLoading) {
      return createLoadingContent();
    }

    if (isComponentSchema) {
      console.log('[DynamicContextPage] Rendering ComponentSchemaRenderer with userId:', {
        session: !!session,
        userId: session?.user?.id,
        authLoading,
        sessionUser: session?.user
      });
      return (
        <div className="p-6">
          <ComponentSchemaRenderer
            schema={content as ComponentSchema}
            userId={session?.user?.id}
            onProgressUpdate={() => {
              // Refresh content when video progress is updated
              if (selectedNavOptionId) {
                console.log('[DynamicContextPage] Refreshing content after progress update');
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
  }, [contentLoading, isComponentSchema, isWelcomeContent, content]);

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
          console.log('[DynamicContextPage] Database-driven mode - creating welcome schema for context:', currentContext);
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
            title: contextNames[currentContext] || currentContext.charAt(0).toUpperCase() + currentContext.slice(1),
            description: 'Select an option from the navigation to get started.',
            action: 'Browse Navigation'
          }
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicContextPage] Database-driven welcome schema created:', welcomeSchema);
        }

        setAgentSchema(welcomeSchema);
        setError(null);
        console.log('[DynamicContextPage] Welcome schema set successfully:', welcomeSchema);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DynamicContextPage] Welcome schema creation failed:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentSchema();
  }, [session?.user?.id, currentContext, authLoading]);

  // Handle context change - also persist the change
  const handleContextChange = (contextKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicContextPage] Context changed to:', contextKey);
    }
    setCurrentContext(contextKey);

    // Clear selected navigation when context changes
    setSelectedNavOptionId(null);

    // Persist context change to user preferences
    if (session?.user?.id) {
      fetch(`/api/user/${session.user.id}/navigation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextKey,
          navOptionId: null // Clear nav selection when changing context
        })
      }).catch(error => {
        console.warn('[DynamicContextPage] Failed to persist context change:', error);
      });
    }
  };

  // Helper function to load content for a navigation option
  const loadContentForNavOption = async (navId: string, updateSelection: boolean = true) => {
    if (!session?.user?.id) {
      console.error('[DynamicContextPage] No user session for navigation');
      return;
    }

    console.log('[DynamicContextPage] 🚀 LOADING content for navigation option:', {
      navId,
      updateSelection,
      currentContext,
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
          contextKey: currentContext,
          navOptionId: navId,
          intent: {
            message: `Show me content for navigation option ${navId}`
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DynamicContextPage] Agent API error:', errorData);

        // Clear loading state
        setContentLoading(false);

        // Show error state
        setAgentSchema({
          type: 'error',
          content: {
            type: 'error',
            title: 'Unable to Load Content',
            description: errorData.message || 'Please try again later.',
            action: 'Retry'
          }
        });
        return;
      }

      const agentResponse = await response.json();
      console.log('[DynamicContextPage] Agent response:', agentResponse);

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
            contextKey: currentContext,
            navOptionId: navId
          })
        });
        console.log('[DynamicContextPage] ✅ Navigation state persisted:', { contextKey: currentContext, navOptionId: navId });

        // Invalidate user preferences cache to ensure fresh data on next load
        queryClient.invalidateQueries({ queryKey: ['user-preferences', session.user.id] });
        console.log('[DynamicContextPage] 🔄 User preferences cache invalidated');
      } catch (error) {
        console.warn('[DynamicContextPage] ⚠️ Failed to persist navigation state:', error);
      }
    }

  } catch (error) {
      console.error('[DynamicContextPage] Network error calling agent:', error);

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
    console.log('[DynamicContextPage] No agentSchema found - showing invalid response error');
    console.log('[DynamicContextPage] Current state:', { agentSchema, loading, error, authLoading });
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
  console.log('[DynamicContextPage] Checking agentSchema type:', agentSchema?.type, 'has content:', !!agentSchema?.content, 'contentLoading:', contentLoading);

  // If we're loading content or have content, show the layout with navigation
  if (contentLoading || ((agentSchema?.type === 'content_schema' || agentSchema?.type === 'error') && agentSchema.content)) {
    console.log('[DynamicContextPage] Handling content_schema response or loading state');
    console.log('[DynamicContextPage] agentSchema.content:', agentSchema?.content);

    // Navigation is now handled by NavPanel's database-driven approach

    // Create nav component using database-driven approach
    const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
      return (
        <NavPanel
          contextKey={currentContext}
          contextOptions={props.initialContexts?.map(ctx => ({
            id: ctx.context_key,
            title: ctx.display_name,
            subtitle: ctx.description || 'AI-Powered Experience',
            icon: 'star'
          })) || []}
          contextValue={currentContext}
          onContextChange={handleContextChange}
          onNavSelect={handleNavSelect}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          userId={session?.user?.id}
          selectedNavOptionId={selectedNavOptionId}
        />
      );
    };

            // Use the proper context-specific theme from database
    const contextConfig = props.initialContexts?.find(ctx => ctx.context_key === currentContext) || props.initialContextConfig;
    const defaultTheme = {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#4ecdc4',
      bg_light: '#f8f9ff',
      bg_neutral: '#e8f4f8',
      text_primary: '#333333',
      bg_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    const theme = (contextConfig && typeof contextConfig === 'object' && 'theme' in contextConfig ? contextConfig.theme as typeof defaultTheme : null) || defaultTheme;

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
      </div>
    );
  }

  // 🚨 SHOULD NEVER REACH HERE - All valid responses handled above
  console.error('[DynamicContextPage] Unhandled agentSchema type:', agentSchema.type);
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
