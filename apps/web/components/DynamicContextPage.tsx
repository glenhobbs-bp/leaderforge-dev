"use client";
// File: apps/web/components/DynamicContextPage.tsx
// Purpose: Agent-native 3-panel layout. Fetches complete UI schema from agents, renders dynamic content based on user entitlements.
import { useState, useEffect, useRef } from "react";
import ThreePanelLayout from "./ui/ThreePanelLayout";
import NavPanel from "./ui/NavPanel";
import { useSessionContext } from '@supabase/auth-helpers-react';
import React from "react";

// Diagnostic: Track module load
console.log('[DynamicContextPage] Module loaded - Agent-native mode');

// Basic types for agent schema
interface AgentSchema {
  type: string;
  schema: {
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
    navigation: Array<{
      id: string;
      label: string;
      icon?: string;
      description?: string;
      route?: string;
    }> | Array<{
      title?: string;
      items: Array<{
        id: string;
        label: string;
        icon?: string;
        description?: string;
        href?: string;
        route?: string;
      }>;
    }>;
    content: {
      recommendations: Array<{
        type: string;
        title: string;
        description: string;
        action?: string;
      }>;
    };
    chat: {
      heading: string;
      message: string;
    };
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

  // Auth context
  const { session } = useSessionContext();

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
      // Wait for authentication
      if (!session?.user?.id) {
        setLoading(true);
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
            userId: session?.user?.id, // Pass user ID explicitly to bypass auth issues
            context: currentContext // Pass the current context
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch agent schema');
        }

        const agentResponse = await response.json();

        if (process.env.NODE_ENV === 'development') {
          console.log('[DynamicContextPage] Agent schema received:', agentResponse);
        }

        setAgentSchema(agentResponse);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DynamicContextPage] Agent schema fetch failed:', errorMessage);
        setError(errorMessage);

        // Fallback: Use default schema if agent fails
        setAgentSchema({
          type: 'context_schema',
          schema: {
            contextKey: 'default',
            contextName: 'Welcome',
            theme: {
              primary: '#667eea',
              secondary: '#764ba2',
              accent: '#4ecdc4',
              bg_light: '#f8f9ff',
              bg_neutral: '#e8f4f8',
              text_primary: '#333333'
            },
            navigation: [{
              id: 'support',
              label: 'Support',
              icon: '/icons/support.svg',
              description: 'Get help',
              route: '/support'
            }],
            content: {
              recommendations: [{
                type: 'welcome',
                title: 'Welcome',
                description: 'Please check your connection and try again.',
                action: 'Retry'
              }]
            },
            chat: {
              heading: 'Assistant',
              message: 'How can I help you today?'
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgentSchema();
  }, [session?.user?.id, currentContext]); // Re-fetch when user or context changes

  // Handle context change
  const handleContextChange = (contextKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicContextPage] Context changed to:', contextKey);
    }
    setCurrentContext(contextKey);
  };

  // Handle navigation selection
  const handleNavSelect = async (navId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicContextPage] Navigation selected:', navId);
    }

    // 🤖 AGENT-NATIVE: Ask agent for updated schema based on navigation
    try {
      setLoading(true);
      const response = await fetch('/api/agent/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: `I want to access ${navId}`,
          context: currentContext
        })
      });

      if (response.ok) {
        const updatedSchema = await response.json();
        setAgentSchema(updatedSchema);
      }
    } catch (err) {
      console.error('[DynamicContextPage] Navigation update failed:', err);
    } finally {
      setLoading(false);
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

  // Show error state
  if (error && !agentSchema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Experience</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Extract schema data
  const schema = agentSchema?.schema;
  if (!schema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Invalid agent response - please refresh</div>
      </div>
    );
  }

    // 🎨 RENDER AGENT-GENERATED SCHEMA
  // Convert agent navigation to NavPanel schema format
  // Handle both new sections format and legacy flat navigation format
  let sections;

  // Type guard to check if it's the new sections format
  const isSectionsFormat = (nav: any): nav is Array<{ title?: string; items: Array<any> }> => {
    return Array.isArray(nav) && nav.length > 0 && nav[0] && typeof nav[0] === 'object' && 'items' in nav[0];
  };

  // Type guard to check if it's the legacy flat format
  const isLegacyFormat = (nav: any): nav is Array<{ id: string; label: string; icon?: string; description?: string; route?: string; }> => {
    return Array.isArray(nav) && nav.length > 0 && nav[0] && typeof nav[0] === 'object' && 'id' in nav[0] && !('items' in nav[0]);
  };

  if (isSectionsFormat(schema.navigation)) {
    // New sections format - use directly
    sections = schema.navigation.map(section => ({
      title: section.title,
      items: section.items.map(navItem => ({
        id: navItem.id,
        label: navItem.label,
        icon: navItem.icon?.replace('/icons/', '').replace('.svg', '') || 'folder',
        href: navItem.href || navItem.route || `/${navItem.id}`,
        description: navItem.description || ''
      }))
    }));
  } else if (isLegacyFormat(schema.navigation)) {
    // Legacy flat navigation format - convert to single section
    sections = [{
      title: null,
      items: schema.navigation.map(navItem => ({
        id: navItem.id,
        label: navItem.label,
        icon: navItem.icon?.replace('/icons/', '').replace('.svg', '') || 'folder',
        href: navItem.route || `/${navItem.id}`,
        description: navItem.description || ''
      }))
    }];
  } else {
    // Fallback
    sections = [{
      title: null,
      items: []
    }];
  }

  const navSchema = {
    type: "NavPanel" as const,
    props: {
      header: {
        greeting: "Welcome back"
      },
      sections,
      footer: {
        actions: [{
          label: 'Sign Out',
          action: 'signOut',
          icon: 'logout'
        }]
      }
    }
  };

  // Context options for context selector (using all available contexts)
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

    // Create proper nav component that accepts isCollapsed and onToggleCollapse props
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

  const contentComponent = (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {schema.content.recommendations[0]?.title || 'Welcome'}
      </h1>
      <p className="text-gray-600 mb-6">
        {schema.content.recommendations[0]?.description || ''}
      </p>
      <div className="space-y-4">
        {schema.content.recommendations.map((rec, index: number) => (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{rec.title}</h3>
            <p className="text-sm text-gray-600">{rec.description}</p>
            {rec.action && (
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {rec.action}
              </button>
            )}
          </div>
        ))}
      </div>
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
