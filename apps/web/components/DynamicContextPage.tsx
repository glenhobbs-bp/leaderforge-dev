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

// Basic types for agent schema (pure - no transformation logic)
interface AgentSchema {
  type: string;
  schema?: {
    contextKey: string;
    contextName: string;
    theme: {
      primary: string;
      secondary: string;
      accent: string;
      bg_light: string;
      bg_neutral: string;
      text_primary: string;
    };
    navigation: Array<unknown>; // Let agents define structure
    content: {
      recommendations: Array<unknown>; // Let agents define structure
    };
    chat: {
      heading: string;
      message: string;
    };
  };
  content?: unknown; // For content_schema responses
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
          type: 'context_schema',
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

  // 🗄️ DATABASE-DRIVEN: Navigation selection - no agent calls
  const handleNavSelect = async (navId: string) => {
    if (!session?.user?.id) {
      console.error('[DynamicContextPage] No user session for navigation');
      return;
    }

    console.log('[DynamicContextPage] Database-driven navigation - showing placeholder for:', navId);

    // 🗄️ DATABASE-DRIVEN: Simple placeholder content without agent calls
    setAgentSchema({
      type: 'context_schema',
      content: {
        type: 'welcome',
        title: 'Feature Coming Soon',
        description: `The ${navId} feature is being prepared for you.`,
        action: 'Check back soon!'
      }
    });
  };

  // Show loading state while waiting for auth or schema
  if (!session || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
  if (agentSchema.type === 'context_schema' && agentSchema.content) {
    console.log('[DynamicContextPage] Handling content_schema response');
    console.log('[DynamicContextPage] props.initialNavOptions type:', typeof props.initialNavOptions);
    console.log('[DynamicContextPage] props.initialNavOptions length:', Array.isArray(props.initialNavOptions) ? props.initialNavOptions.length : 'not array');

    // 🗄️ DATABASE-DRIVEN: Simple welcome content without ComponentSchemaRenderer
    const content = agentSchema.content as { type: string; title: string; description: string; action: string };
    const contentComponent = content.type === 'welcome' ? (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="text-blue-500 mb-4 text-4xl">✨</div>
          <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>
          <p className="text-gray-600 mb-6">{content.description}</p>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg inline-block">
            {content.action}
          </div>
        </div>
      </div>
    ) : (
      <div className="p-6">
        <ComponentSchemaRenderer schema={agentSchema.content as ComponentSchema} />
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

    return (
      <div style={{
        '--primary': '#1e40af',
        '--secondary': '#64748b',
        '--accent': '#0ea5e9',
        '--bg-light': '#f8fafc',
        '--bg-neutral': '#f1f5f9',
        '--text-primary': '#1e293b',
        '--card-bg': '#ffffff'
      } as React.CSSProperties}>
        <ThreePanelLayout
          nav={<NavComponent />}
          content={contentComponent}
          contextConfig={{
            theme: {
              primary: '#1e40af',
              secondary: '#64748b',
              accent: '#0ea5e9',
              bg_light: '#f8fafc',
              bg_neutral: '#f1f5f9',
              text_primary: '#1e293b'
            }
          }}
        />
      </div>
    );
  }

  // Handle legacy schema response
  const schema = agentSchema?.schema;
  console.log('[DynamicContextPage] Legacy schema check - schema exists:', !!schema);
  console.log('[DynamicContextPage] agentSchema.type:', agentSchema.type);
  if (!schema) {
    console.log('[DynamicContextPage] No legacy schema found - showing invalid response error');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p>Invalid agent response - please refresh</p>
        </div>
      </div>
    );
  }

  // 🤖 AGENT-NATIVE: Pure rendering - navigation now database-driven

  // Context options for context selector
  const contextOptions = props.initialContexts?.map(ctx => ({
    id: ctx.context_key,
    title: ctx.display_name,
    subtitle: ctx.description || 'AI-Powered Experience',
    icon: 'star'
  })) || [{
    id: schema.contextKey,
    title: schema.contextName,
    subtitle: 'AI-Powered Experience',
    icon: 'star'
  }];

  // Create nav component using database-driven approach
  const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
    return (
      <NavPanel
        contextKey={currentContext}
        contextOptions={contextOptions}
        contextValue={currentContext}
        onContextChange={handleContextChange}
        onNavSelect={handleNavSelect}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        userId={session?.user?.id}
      />
    );
  };

  const navComponent = <NavComponent />;

  // 🤖 AGENT-NATIVE: Pure content rendering - no frontend business logic
  const contentComponent = (
    <div className="p-6">
      {schema.content.recommendations.map((rec: { type: string; [key: string]: unknown }, index: number) => {
        // Let ComponentSchemaRenderer handle all schema types
        return (
          <div key={index} className="mb-8">
            {/* @ts-expect-error - Agent-provided schema structure */}
            <ComponentSchemaRenderer schema={rec} />
          </div>
        );
      })}
    </div>
  );

  return (
    <ThreePanelLayout
      nav={navComponent}
      content={contentComponent}
      contextConfig={{
        theme: schema.theme
      }}
    />
  );
}
