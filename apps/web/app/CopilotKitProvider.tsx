/**
 * File: apps/web/app/CopilotKitProvider.tsx
 * Purpose: CopilotKit provider configuration for the application
 * Owner: Engineering Team
 * Tags: #copilotkit #provider #ai
 */

"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useSupabase } from '../components/SupabaseProvider';
import { useEffect, useState, useCallback } from 'react';
import { EntitlementActions } from '../components/copilot/EntitlementActions';
import { ResizableWindow } from '../components/copilot/ResizableWindow';


export function CopilotKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useSupabase();
  const [isReady, setIsReady] = useState(false);

  // Simple readiness check - wait for session to stabilize
  useEffect(() => {
    // Small delay to ensure session is fully loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('[CopilotKitProvider] State:', {
      loading,
      hasSession: !!session,
      userId: session?.user?.id,
      isReady,
      shouldRender: isReady && !loading,
      sessionUser: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null
    });
  }, [session, loading, isReady]);

  interface AgentContext {
    systemInstructions: string;
    appliedContexts?: Array<{
      id: string;
      name: string;
      scope: string;
      enabled: boolean;
    }>;
    userPreferences?: Array<{
      contextId: string;
      enabled: boolean;
    }>;
    metadata?: {
      contextId?: string;
      [key: string]: unknown;
    };
  }

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);

  // Fetch agent-generated context and instructions
  const fetchAgentContext = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setAgentLoading(true);
      console.log('[CopilotKitProvider] 🔄 Fetching agent context for user:', session.user.id);

      const response = await fetch('/api/agent/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: session.user.id,
          tenantKey: 'leaderforge'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.context) {
          // Update both state and ref
          setAgentContext(data.context);
          console.log('[CopilotKitProvider] ✅ Agent context loaded successfully');
        } else {
          console.warn('[CopilotKitProvider] ⚠️ No context returned from agent');
          setAgentContext(null);
        }
      } else {
        console.error('[CopilotKitProvider] ❌ Failed to fetch agent context:', response.status);
        setAgentContext(null);
      }
    } catch (error) {
      console.error('[CopilotKitProvider] ❌ Error fetching agent context:', error);
      setAgentContext(null);
    } finally {
      setAgentLoading(false);
    }
  }, [session?.user?.id]);

  // Initial context fetch when component mounts or user changes
  useEffect(() => {
    fetchAgentContext();
  }, [fetchAgentContext]);

  // Prepare data before any conditional rendering (all hooks must come before early returns)
  const fullInstructions = agentContext?.systemInstructions ||
    `You are a helpful assistant for LeaderForge, an AI-powered leadership development platform.`;

  const userName = session?.user?.user_metadata?.full_name ||
                   session?.user?.user_metadata?.name ||
                   session?.user?.email?.split('@')[0] ||
                   'User';

  const userProperties = {
    userId: session?.user?.id || 'anonymous',
    userName,
    userEmail: session?.user?.email || '',
    isAuthenticated: !!session,
    tenantKey: 'leaderforge',
    agentContextId: agentContext?.metadata?.contextId || null
  };

  // Log the properties being sent - this hook must come before any early returns
  useEffect(() => {
    if (isReady && !loading && !agentLoading) {
      console.log('[CopilotKitProvider] 🚀 CopilotKit Configuration:', {
        userId: userProperties.userId,
        userName: userProperties.userName,
        hasAgentContext: !!agentContext,
        usingAgentInstructions: !!agentContext?.systemInstructions,
        instructionsSource: agentContext?.systemInstructions ? 'agent-generated' : 'fallback',
        instructionsLength: fullInstructions.length,
        appliedContextsCount: agentContext?.appliedContexts?.length || 0
      });
      console.log('[CopilotKitProvider] 📋 Final Instructions Being Passed to CopilotKit:');
      console.log('[CopilotKitProvider] 📝 Instructions Preview:', fullInstructions.substring(0, 300) + '...');

      if (agentContext?.appliedContexts?.length > 0) {
        console.log('[CopilotKitProvider] 🎯 Applied Contexts:', agentContext.appliedContexts);
      } else {
        console.log('[CopilotKitProvider] ⚠️ No contexts applied - using fallback instructions only');
      }
    }
  }, [isReady, loading, agentLoading, userProperties, agentContext, fullInstructions]);

  // Only render CopilotKit after ready and session is stable
  if (!isReady || loading || agentLoading) {
    return <>{children}</>;
  }

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      properties={userProperties}
      key={`copilot-${userProperties.userId}`} // Force re-render when user changes
    >
      {children}
      <EntitlementActions />
      <CopilotPopup
        instructions={fullInstructions}
        labels={{
          title: "LeaderForge Assistant",
          initial: `Hi ${userName}! I'm your LeaderForge assistant. How can I help you today?`,
        }}
        defaultOpen={false}
        clickOutsideToClose={true}
        Window={ResizableWindow}
      />
    </CopilotKit>
  );
}