/**
 * File: apps/web/app/CopilotKitProvider.tsx
 * Purpose: CopilotKit provider configuration for the application
 * Owner: Engineering Team
 * Tags: #copilotkit #provider #ai
 */

"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";
import { useSupabase } from "../components/SupabaseProvider";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { UniversalSchemaRenderer } from "../components/ai/UniversalSchemaRenderer";
import type { UniversalWidgetSchema } from "agent-core/types/UniversalWidgetSchema";
import { useRouter, usePathname } from "next/navigation";

// Admin actions component that renders forms using CopilotKit's Generative UI
function AdminActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [dashboardData, setDashboardData] = useState<{ lastRefresh?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Make current page context readable by the copilot
  useCopilotReadable({
    description: "Current page and navigation context",
    value: {
      currentPage: pathname,
      isOnDashboard: pathname === '/dashboard',
      isDashboardAvailable: dashboardData !== null
    }
  });

  // Make dashboard data readable if available
  if (dashboardData) {
    useCopilotReadable({
      description: "Dashboard data and statistics",
      value: dashboardData
    });
  }

  useCopilotAction({
    name: "performAdminTask",
    description: `Administrative actions for managing the platform. This includes:
      - Configuring user entitlements (e.g., "give user@example.com premium access")
      - Creating new tenants (e.g., "create a new tenant called Acme Corp")
      - Changing theme colors (e.g., "change the primary color to #FF6B6B")`,
    parameters: [
      {
        name: "intent",
        type: "string",
        description: "The admin task to perform",
        required: true,
      }
    ],
    render: (props) => {
      // Extract status and result from props
      const { status, args, result } = props;

      // This render function is called by CopilotKit to display the form
      if (result?.schema && result.needsRender) {
        const schema = result.schema as UniversalWidgetSchema;

        // Handle form submission
        const handleAction = async (action: { action: string; data?: unknown }) => {
          if (action.action === 'submit' && result?.taskId) {
            // Re-execute the action with the form data
            // In CopilotKit, we need to trigger a new message/action rather than calling handler directly
            // The form submission will be handled by sending a new message to the chat
            window.dispatchEvent(new CustomEvent('copilotkit:submit-form', {
              detail: {
                intent: args.intent,
                formData: action.data,
                taskId: result.taskId
              }
            }));
          }
        };

        return (
          <div className="copilotkit-form-container">
            <UniversalSchemaRenderer
              schema={schema}
              onAction={handleAction}
            />
          </div>
        );
      }

      // During processing, show loading state
      if (status === "executing" || isProcessing) {
        return (
          <div className="flex items-center space-x-2 p-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Processing your request...</span>
          </div>
        );
      }

      return null;
    },
    handler: async ({ intent }) => {
      setIsProcessing(true);
      try {
        const response = await fetch("/api/copilotkit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "admin",
            intent,
          }),
        });

        const data = await response.json();

        // If we get a refresh instruction, refresh the dashboard
        if (data.message?.includes("dashboard") && data.message?.includes("refresh")) {
          setDashboardData({ lastRefresh: new Date().toISOString() });

          // If we're on the dashboard, trigger a page refresh
          if (pathname === '/dashboard') {
            router.refresh();
          }
        }

        return data;
      } finally {
        setIsProcessing(false);
      }
    },
  });

  // Navigation action
  useCopilotAction({
    name: "navigateToPage",
    description: "Navigate to different pages in the application (dashboard, settings, etc.)",
    parameters: [
      {
        name: "page",
        type: "string",
        description: "The page to navigate to",
        required: true,
      }
    ],
    handler: async ({ page }) => {
      const pageMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'home': '/',
        'settings': '/settings',
        'admin': '/admin'
      };

      const route = pageMap[page.toLowerCase()] || `/${page}`;
      router.push(route);

      return { success: true, message: `Navigating to ${page}...` };
    },
  });

  return null;
}

export function CopilotKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSupabase();
  const [showCopilot, setShowCopilot] = useState(false);

  useEffect(() => {
    // Only show CopilotKit after authentication
    if (session?.user) {
      setShowCopilot(true);
    } else {
      setShowCopilot(false);
    }
  }, [session]);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
      {showCopilot && (
        <>
          <AdminActions />
          <CopilotPopup
            labels={{
              title: "LeaderForge Assistant",
              initial: "Hi! I'm your LeaderForge assistant. I can help you manage users, configure settings, and navigate the platform. What would you like to do today?",
              placeholder: "Ask me to configure entitlements, create tenants, or navigate...",
            }}
            defaultOpen={false}
            clickOutsideToClose={true}
            className="copilotkit-custom-popup"
          />
        </>
      )}
    </CopilotKit>
  );
}