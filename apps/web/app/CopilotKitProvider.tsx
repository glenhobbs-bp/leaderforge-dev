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

  // Determine user context with proper admin level detection (matching API route logic)
  const getAdminLevel = (user: { user_metadata?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean }; raw_user_meta_data?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean } } | null) => {
    if (!user) return 'none';

    const metadata = user.user_metadata || {};
    const rawMetadata = user.raw_user_meta_data || {};

    if (metadata.is_super_admin === true || rawMetadata.is_super_admin === true) {
      return 'i49_super_admin';
    }

    if (metadata.is_admin === true || rawMetadata.is_admin === true) {
      return 'platform_admin';
    }

    if (metadata.tenant_admin || rawMetadata.tenant_admin) {
      return 'tenant_admin';
    }

    if (metadata.account_admin || rawMetadata.account_admin) {
      return 'account_admin';
    }

    return 'none';
  };

  const userId = session?.user?.id || 'anonymous';
  const adminLevel = getAdminLevel(session?.user);
  const userName = session?.user?.user_metadata?.full_name ||
                   session?.user?.user_metadata?.name ||
                   session?.user?.email?.split('@')[0] ||
                   'User';
  const userEmail = session?.user?.email || '';

  const userProperties = {
    userId,
    adminLevel,
    userName,
    userEmail,
    isAuthenticated: !!session,
    isAdmin: adminLevel !== 'none',
    tenantKey: 'leaderforge', // Add tenant context
  };

  // Log the properties being sent
  useEffect(() => {
    if (isReady && !loading) {
      console.log('[CopilotKitProvider] Sending user properties:', userProperties);
    }
  }, [isReady, loading, userId, adminLevel, userName, session]);

  // Only render CopilotKit after ready and session is stable
  if (!isReady || loading) {
    return <>{children}</>;
  }

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      properties={userProperties}
      key={`copilot-${userId}`} // Force re-render when user changes
    >
      {children}
      <EntitlementActions />
      <CopilotPopup
        instructions="You are a helpful assistant for LeaderForge, an AI-powered leadership development platform. Help users navigate the platform, understand content, and achieve their leadership goals."
        labels={{
          title: "LeaderForge Assistant",
          initial: "Hi! I'm your LeaderForge assistant. How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}