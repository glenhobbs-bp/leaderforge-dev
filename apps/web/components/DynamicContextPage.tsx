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
console.log('[DynamicContextPage] Module loaded - Agent-native mode');

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
  console.log('[DynamicContextPage] RENDER - Agent-native', props);

  // Core state
  const hasMounted = useRef(false);
  const [agentSchema, setAgentSchema] = useState<AgentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState(props.defaultContextKey || 'brilliant');
  const [contentLoading, setContentLoading] = useState(false);

  // Navigation state (persistent, entitlement-based)
  const [navSections, setNavSections] = useState<Array<{
    title: string;
    icon?: string;
    items: Array<{ id: string; label: string; description?: string; icon?: string; }>
  }>>([]);
  const [navLoading, setNavLoading] = useState(false);

  // Auth context
  const { session, loading: authLoading } = useSupabase();

  // Load navigation based on entitlements (separate from agent calls)
  const loadNavigationForContext = async (contextKey: string) => {
    if (!session?.user?.id || navLoading) return;

    try {
      setNavLoading(true);
      console.log('[DynamicContextPage] Loading navigation for context:', contextKey);
      console.log('[DynamicContextPage] Session info:', {
        userId: session?.user?.id,
        hasSession: !!session,
        userAgent: navigator.userAgent.substring(0, 50)
      });

      const url = `/api/nav/${contextKey}`;
      console.log('[DynamicContextPage] Fetching URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      console.log('[DynamicContextPage] Response status:', response.status, response.statusText);
      console.log('[DynamicContextPage] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DynamicContextPage] Navigation fetch failed - status:', response.status);
        console.error('[DynamicContextPage] Response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('[DynamicContextPage] Navigation fetch error data:', errorData);
        } catch {
          console.error('[DynamicContextPage] Could not parse error response as JSON');
        }
        return;
      }

      const navOptions = await response.json();
      console.log('[DynamicContextPage] Loaded navigation options:', navOptions.length);

      // Transform nav options to sections (by section or use default)
      const sectionMap = new Map<string, Array<{ id: string; label: string; description?: string; icon?: string; }>>();

      navOptions.forEach((nav: { section?: string; nav_key: string; label: string; description?: string; icon?: string; }) => {
        const sectionKey = nav.section || 'default';
        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, []);
        }
        sectionMap.get(sectionKey)!.push({
          id: nav.nav_key,
          label: nav.label,
          description: nav.description,
          icon: nav.icon
        });
      });

      // Convert to sections array
      const sections = Array.from(sectionMap.entries()).map(([sectionKey, items]) => ({
        title: sectionKey === 'default' ? 'Navigation' : sectionKey,
        items
      }));

      setNavSections(sections);
      console.log('[DynamicContextPage] Navigation sections set:', sections.length);

    } catch (err) {
      console.error('[DynamicContextPage] Navigation loading failed:', err);
      console.error('[DynamicContextPage] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setNavLoading(false);
    }
  };

  // Load navigation on context change (persistent, entitlement-based)
  useEffect(() => {
    console.log('[DynamicContextPage] Loading navigation for context:', currentContext);
    if (!authLoading && session?.user?.id) {
      loadNavigationForContext(currentContext);
    }
  }, [currentContext, authLoading, session?.user?.id]);

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
        console.log('[DynamicContextPage] Component mounted - Agent-native mode');
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
          console.log('[DynamicContextPage] Requesting UI schema from agent for context:', currentContext);
        }

        const response = await fetch('/api/agent/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: `What should I see on my dashboard for ${currentContext}?`,
            userId: session?.user?.id,
            context: currentContext
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch agent schema' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const agentResponse = await response.json();

        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicContextPage] Agent schema received:', agentResponse);
        }

        // 🤖 AGENT-NATIVE: Use agent response as-is, no transformation
        setAgentSchema(agentResponse);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DynamicContextPage] Agent schema fetch failed:', errorMessage);
        setError(errorMessage);
        // 🤖 AGENT-NATIVE: No fallback schema - show error instead
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

  // 🤖 AGENT-NATIVE: Navigation selection - selective agent invocation
  const handleNavSelect = async (navId: string) => {
    if (!session?.user?.id) {
      console.error('[DynamicContextPage] No user session for navigation');
      return;
    }

    // TODO: Remove hardcoding - this should be driven by database configuration
    // In production: nav_options table should have context_key column
    // TESTING ONLY: Hardcoded context switching for Leadership Library
    if (process.env.NODE_ENV === 'development') {
      const isLeadershipLibrary = navId === '3202016b-05fa-4db6-bbc7-c785ba898e2f' || navId === 'leadership-library';

      if (isLeadershipLibrary && currentContext !== 'leaderforge') {
        console.log(`[DynamicContextPage] TESTING: Switching context from ${currentContext} to leaderforge for Leadership Library`);

        setCurrentContext('leaderforge');
        await loadNavigationForContext('leaderforge');
        // Continue with navigation handling in new context
      }
    }

    // TODO: Replace with database-driven agent detection
    // In production: SELECT agent_id FROM nav_options WHERE id = navId
    // If agent_id IS NOT NULL, then requiresAgent = true

    // TESTING ONLY: Temporarily disable agent calls while agent service is being fixed
    const testingAgentRequiredNav = process.env.NODE_ENV === 'development' ? [
      // Temporarily disabled for testing: 'leadership-library', 'content-search', 'assessments', 'library', '3202016b-05fa-4db6-bbc7-c785ba898e2f'
    ] : [
      'leadership-library',
      'content-search',
      'assessments',
      'library',
      '3202016b-05fa-4db6-bbc7-c785ba898e2f'
    ];

    const requiresAgent = testingAgentRequiredNav.includes(navId);

    if (!requiresAgent) {
      console.log('[DynamicContextPage] Simple navigation - no agent needed:', navId);
      // Handle simple navigation without agent calls - just show placeholder content
      setAgentSchema({
        type: 'content_schema',
        content: {
          type: 'Container',
          props: {
            children: [
              {
                type: 'Text',
                props: {
                  children: `Content for ${navId} would be displayed here.`,
                  className: 'text-2xl font-bold p-6'
                }
              }
            ]
          }
        }
      });
      return;
    }

    try {
      setContentLoading(true); // Only content loads, not whole page

      // Call agent for dynamic content - use the potentially updated context
      const contextToUse = currentContext;
      const response = await fetch('/api/agent/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: session?.user?.id,
          contextKey: contextToUse,
          navOptionId: navId,
          intent: {
            type: 'navigation_click',
            navId: navId
          }
        })
      });

      if (response.ok) {
        const contentSchema = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicContextPage] Content schema received:', contentSchema);
        }

        // 🤖 AGENT-NATIVE: Use agent response as-is, no frontend transformation
        setAgentSchema(contentSchema);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[DynamicContextPage] Content API error:', response.status, errorData);
        setError(`Failed to load content: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[DynamicContextPage] Navigation update failed:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setContentLoading(false);
    }
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p>Invalid agent response - please refresh</p>
        </div>
      </div>
    );
  }

  // Handle different agent response types
  if (agentSchema.type === 'content_schema' && agentSchema.content) {
    console.log('[DynamicContextPage] Handling content_schema response');
    console.log('[DynamicContextPage] props.initialNavOptions type:', typeof props.initialNavOptions);
    console.log('[DynamicContextPage] props.initialNavOptions length:', Array.isArray(props.initialNavOptions) ? props.initialNavOptions.length : 'not array');

    // Content schema response (e.g., Leadership Library grid)
    const contentComponent = contentLoading ? (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    ) : (
      <div className="p-6">
        <ComponentSchemaRenderer schema={agentSchema.content as ComponentSchema} />
      </div>
    );

    // Use persistent navigation sections (loaded separately from entitlements)
    const getNavigationSections = () => {
      console.log('[DynamicContextPage] Using persistent navigation sections:', navSections.length);
      console.log('[DynamicContextPage] Props initialNavOptions:', Array.isArray(props.initialNavOptions) ? props.initialNavOptions.length : 'not array');

      // If we have no navSections but have initialNavOptions, use those as fallback
      if (navSections.length === 0 && Array.isArray(props.initialNavOptions) && props.initialNavOptions.length > 0) {
        console.log('[DynamicContextPage] Using initialNavOptions as fallback');

        // Transform initialNavOptions to sections format
        const sectionMap = new Map<string, Array<{ id: string; label: string; description?: string; icon?: string; }>>();

        props.initialNavOptions.forEach((nav: { id: string; label: string; description?: string; icon?: string; section?: string; }) => {
          const sectionKey = nav.section || 'default';
          if (!sectionMap.has(sectionKey)) {
            sectionMap.set(sectionKey, []);
          }
          sectionMap.get(sectionKey)!.push({
            id: nav.id,
            label: nav.label,
            description: nav.description,
            icon: nav.icon
          });
        });

        // Convert to sections array
        const sections = Array.from(sectionMap.entries()).map(([sectionKey, items]) => ({
          title: sectionKey === 'default' ? 'Navigation' : sectionKey,
          items
        }));

        return sections;
      }

      if (navSections.length === 0) {
        console.log('[DynamicContextPage] No navigation sections available yet - still loading');
        return [];
      }

      return navSections;
    };

    // Create nav component using transformed nav options
    const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
      return (
        <NavPanel
          navSchema={{
            type: "NavPanel" as const,
            props: {
              header: {
                greeting: "Welcome back"
              },
              sections: getNavigationSections(),
              footer: {
                actions: [{
                  label: 'Sign Out',
                  action: 'signOut',
                  icon: 'logout'
                }]
              }
            }
          }}
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
  if (!schema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p>Invalid agent response - please refresh</p>
        </div>
      </div>
    );
  }

  // 🤖 AGENT-NATIVE: Pure rendering - no frontend logic
  // Navigation structure comes directly from agent
  const navSchema = {
    type: "NavPanel" as const,
    props: {
      header: {
        greeting: "Welcome back"
      },
      sections: (schema.navigation as { title?: string; items: { id: string; label: string; icon?: string; href?: string; description?: string; position?: "bottom" }[] }[]) || [],
      footer: {
        actions: [{
          label: 'Sign Out',
          action: 'signOut',
          icon: 'logout'
        }]
      }
    }
  };

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

  // Create nav component
  const NavComponent = ({ isCollapsed, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) => {
    return (
      <NavPanel
        navSchema={navSchema}
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
