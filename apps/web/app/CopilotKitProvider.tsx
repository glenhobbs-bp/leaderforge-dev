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
import { useEffect, useState, useCallback } from "react";
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

  // Callback to refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    if (pathname === '/dashboard') {
      // Trigger a refresh of the dashboard
      router.refresh();
      setDashboardData(prev => ({ ...prev, lastRefresh: new Date().toISOString() }));
    }
  }, [pathname, router]);

  useCopilotAction({
    name: "performAdminTask",
    description: `Administrative actions for managing the platform. This includes:
      - Configuring user entitlements (e.g., "give user@example.com premium access")
      - Creating new tenants (e.g., "create a new tenant called Acme Corp")
      - Changing theme colors (e.g., "change the primary color to #FF6B6B")
      - Navigating to different pages (e.g., "take me to the dashboard")`,
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

      // This renders the form in the chat
      if (status === "complete" && result?.needsRender && result?.schema) {
        const schema = result.schema as UniversalWidgetSchema;

        // Handle form submission
        const handleAction = async (action: { action: string; data?: unknown }) => {
          if (action.action === 'submit' && result?.taskId) {
            setIsProcessing(true);

            // Submit the form data back to the server
            try {
              const response = await fetch('/api/copilotkit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'performAdminTask',
                  intent: args.intent,
                  formData: action.data,
                  taskId: result.taskId
                })
              });

              const data = await response.json();

              if (data.success) {
                // Refresh dashboard if we're on it
                await refreshDashboard();
              }
            } catch (error) {
              console.error('Error submitting form:', error);
            } finally {
              setIsProcessing(false);
            }
          }
        };

        return (
          <div className="w-full max-w-md">
            {isProcessing && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Processing your request...</p>
              </div>
            )}
            <UniversalSchemaRenderer
              schema={schema}
              onAction={handleAction}
            />
          </div>
        );
      }

      // Show success message if available
      if (status === "complete" && result?.message && !result?.needsRender) {
        // Check if we need to navigate
        if (result?.navigate) {
          router.push(result.navigate);
        }

        return (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
          </div>
        );
      }

      return null;
    },
    handler: async ({ intent }) => {
      const response = await fetch("/api/copilotkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "performAdminTask", intent }),
      });

      const result = await response.json();
      return result;
    },
  });

  // Navigation action
  useCopilotAction({
    name: "navigateToPage",
    description: "Navigate to different pages in the application",
    parameters: [
      {
        name: "page",
        type: "string",
        description: "The page to navigate to (dashboard, login, etc.)",
        required: true,
      }
    ],
    handler: async ({ page }) => {
      const pageMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'login': '/login',
        'admin': '/admin',
        'home': '/',
        'grant admin': '/dev/grant-admin'
      };

      const path = pageMap[page.toLowerCase()] || `/${page}`;
      router.push(path);

      return { success: true, message: `Navigating to ${page}...` };
    }
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
    setShowCopilot(!!session?.user);
  }, [session]);

  if (!showCopilot) {
    return <>{children}</>;
  }

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AdminActions />
      <CopilotSidebar
        defaultOpen={false}
        clickOutsideToClose={false}
        instructions={`You are an AI assistant for the LeaderForge platform. You can help with:
          - Managing user entitlements and permissions
          - Creating and configuring tenants
          - Customizing themes and branding
          - Navigating through the application
          - Answering questions about the platform

          When users ask to perform admin tasks, use the performAdminTask action.
          When users ask to navigate, use the navigateToPage action.
          Be helpful and conversational!`}
        labels={{
          title: "LeaderForge Assistant",
          initial: "Hi! I'm your LeaderForge assistant. I can help you manage users, configure settings, and navigate the platform. What would you like to do today?",
        }}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}