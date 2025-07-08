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
import { useEffect, useState } from 'react';
import { EntitlementActions } from '../components/copilot/EntitlementActions';


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
    metadata?: {
      contextId?: string;
      [key: string]: unknown;
    };
  }

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);

  // Fetch agent-generated context and instructions
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAgentContext = async () => {
      try {
        setAgentLoading(true);

        const response = await fetch('/api/agent/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: 'Generate CopilotKit configuration',
            context: 'leaderforge'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAgentContext(data);
        } else {
          console.warn('[CopilotKitProvider] Failed to fetch agent context, using fallback');
        }
      } catch (error) {
        console.warn('[CopilotKitProvider] Agent context error, using fallback:', error);
      } finally {
        setAgentLoading(false);
      }
    };

    fetchAgentContext();
  }, [session?.user?.id]);

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
      console.log('[CopilotKitProvider] Sending user properties:', userProperties);
      console.log('[CopilotKitProvider] Using agent instructions:', !!agentContext?.systemInstructions);
    }
  }, [isReady, loading, agentLoading, userProperties, agentContext]);

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
      />
    </CopilotKit>
  );
}