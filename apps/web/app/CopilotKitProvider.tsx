/**
 * File: apps/web/app/CopilotKitProvider.tsx
 * Purpose: CopilotKit provider configuration for the application
 * Owner: Engineering Team
 * Tags: #copilotkit #provider #ai
 */

"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";
import { useSupabase } from "../components/SupabaseProvider";

export function CopilotKitProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { supabase } = useSupabase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
      {/* Only render CopilotSidebar if mounted and user is authenticated */}
      {mounted && isAuthenticated && (
        <CopilotSidebar
          labels={{
            title: "LeaderForge Assistant",
            initial: "Hello! I can help you with various tasks. If you're an admin, I can also help with:\n• Configuring user entitlements\n• Creating new tenants\n• Changing theme colors\n\nWhat would you like to do today?"
          }}
          defaultOpen={false}
          clickOutsideToClose={false}
        />
      )}
    </CopilotKit>
  );
}