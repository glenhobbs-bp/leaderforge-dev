import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { cookies } from 'next/headers';
import { restoreSession } from '../../lib/supabaseServerClient';
import { AdminAgent, AdminAgentContext } from 'agent-core/agents/AdminAgent';

// Admin action handler
async function handleAdminAction(args: {
  intent: string;
  currentStep?: string;
  state?: object;
  formData?: object;
  taskId?: string;
}) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const { session, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return {
        success: false,
        message: "You need to be logged in to perform admin actions. Please log in and try again."
      };
    }

    // Check admin status
    const isAdmin = session.user.user_metadata?.is_admin === true ||
                    (session.user as { raw_user_meta_data?: { is_admin?: boolean } })?.raw_user_meta_data?.is_admin === true;

    if (!isAdmin) {
      return {
        success: false,
        message: "You don't have permission to perform admin actions. Please contact your administrator."
      };
    }

    // If we have form data, process the submission
    if (args.formData && args.taskId) {
      const formData = args.formData as { userId: string; entitlements: string[] };

      // Handle entitlement updates
      if (args.taskId.startsWith('entitlements-')) {
        const { EntitlementTool } = await import('agent-core/tools/EntitlementTool');

        const userId = formData.userId;
        const entitlements = formData.entitlements || [];

        // Update the user's entitlements
        const success = await EntitlementTool.updateUserEntitlements(userId, entitlements);

        if (success) {
          return {
            success: true,
            message: `Successfully updated entitlements for ${userId}. The user now has ${entitlements.length} entitlement(s).`,
            refreshDashboard: true
          };
        } else {
          return {
            success: false,
            message: "Failed to update entitlements. Please check the logs and try again."
          };
        }
      }

      // Handle other form submissions...
      return {
        success: false,
        message: "Unknown form submission type"
      };
    }

    // Create AdminAgent context
    const agent = new AdminAgent();
    const agentContext: AdminAgentContext = {
      userId: session.user.id,
      tenantKey: 'leaderforge',
      isAdmin: true,
      intent: args.intent,
      currentStep: args.currentStep,
      state: (args.state || {}) as Record<string, unknown>,
    };

    // Process the intent
    const result = await agent.processIntent(agentContext);

    return result;
  } catch (error) {
    console.error('[CopilotKit API] Error:', error);
    return {
      success: false,
      message: "An error occurred while processing your request. Please try again."
    };
  }
}

// Use OpenAI adapter
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4",
});

// Create runtime and register the admin action
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "performAdminTask",
      description: `Administrative actions for managing the platform. This includes:
        - Configuring user entitlements (e.g., "give user@example.com premium access")
        - Creating new tenants (e.g., "create a new tenant called Acme Corp")
        - Changing theme colors (e.g., "change the primary color to #FF6B6B")

        You must be an admin to use these features.`,
      parameters: [
        {
          name: "intent",
          type: "string",
          description: "The admin task to perform",
          required: true,
        },
        {
          name: "currentStep",
          type: "string",
          description: "Current step in multi-step workflows",
          required: false,
        },
        {
          name: "state",
          type: "object",
          description: "Current state of the workflow",
          required: false,
        },
        {
          name: "formData",
          type: "object",
          description: "Form data submitted by the user",
          required: false,
        },
      ],
      handler: handleAdminAction,
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: req.nextUrl.pathname,
  });

  return handleRequest(req);
};
