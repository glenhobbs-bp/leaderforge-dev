"use client";
// File: apps/web/components/DynamicContextPage.tsx
// Purpose: Agent-native 3-panel layout. Pure renderer - displays only what agents return.
import { useState, useEffect, useRef } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { ComponentSchemaRenderer } from "./ai/ComponentSchemaRenderer";
import { ComponentSchema } from "../../../packages/agent-core/types/ComponentSchema";
import { useSupabase } from './SupabaseProvider';
import React from "react";

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

  // Core state
  const hasMounted = useRef(false);
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState(props.defaultContextKey || 'brilliant');

  // Navigation is now handled directly by NavPanel component

  // Auth context
  const { session, loading: authLoading } = useSupabase();

  // Navigation loading is now handled directly by NavPanel component

  // Navigation loading is now handled by NavPanel internally

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

  // Handle context change
  const handleContextChange = (contextKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicContextPage] Context changed to:', contextKey);
    }
    setCurrentContext(contextKey);
  };

  // 🤖 AGENT-NATIVE: Navigation selection with agent invocation
  const handleNavSelect = async (navId: string) => {
    if (!session?.user?.id) {
      console.error('[DynamicContextPage] No user session for navigation');
      return;
    }

    console.log('[DynamicContextPage] Agent-native navigation - invoking agent for:', navId);

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

    } catch (error) {
      console.error('[DynamicContextPage] Network error calling agent:', error);

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

  // Show loading state while waiting for auth or schema
  if (!session || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderBottomColor: 'var(--primary, #667eea)' }}></div>
          <p className="text-gray-600">
            {!session ? 'Authenticating...' : 'Loading your personalized experience...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state - no fallback schema
  if (error && !agentSchema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Agent Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        style={{
              background: 'var(--primary, #667eea)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--secondary, #764ba2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary, #667eea)';
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check for valid agent response based on type
  if (!agentSchema) {
    console.log('[DynamicContextPage] No agentSchema found - showing invalid response error');
    console.log('[DynamicContextPage] Current state:', { agentSchema, loading, error, authLoading });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p>Invalid agent response - please refresh</p>
        </div>
      </div>
    );
  }

  // Handle different response types
  console.log('[DynamicContextPage] Checking agentSchema type:', agentSchema.type, 'has content:', !!agentSchema.content);
  if ((agentSchema.type === 'content_schema' || agentSchema.type === 'error') && agentSchema.content) {
    console.log('[DynamicContextPage] Handling content_schema response');
    console.log('[DynamicContextPage] agentSchema.content:', agentSchema.content);

    // 🤖 AGENT-NATIVE: Handle ComponentSchema from agent
    const content = agentSchema.content as ComponentSchema | { type: string; title?: string; description?: string; action?: string; message?: string };

    // Check if it's a ComponentSchema (Grid, Card, etc.) or simple content
    const isComponentSchema = content && typeof content === 'object' && 'type' in content &&
      (content.type === 'Grid' || content.type === 'Card' || 'props' in content);

    const isWelcomeContent = content && typeof content === 'object' && 'type' in content && (content.type === 'welcome' || content.type === 'error');

    const contentComponent = isComponentSchema ? (
      <div className="p-6">
        <ComponentSchemaRenderer schema={content as ComponentSchema} />
      </div>
    ) : isWelcomeContent ? (
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
    ) : (
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <p>Unhandled response type: {agentSchema.type}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--primary, #667eea)',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--secondary, #764ba2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--primary, #667eea)';
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
