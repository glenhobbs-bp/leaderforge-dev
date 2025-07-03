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
        message: "You don't have permission to perform admin actions."
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
            shouldRefreshDashboard: true
          };
        } else {
          return {
            success: false,
            message: "Failed to update entitlements. Please check the logs for details."
          };
        }
      }
    }

    // Create AdminAgent context
    const agent = new AdminAgent();
    const agentContext: AdminAgentContext = {
      userId: session.user.id,
      tenantKey: 'leaderforge',
      isAdmin: true,
      intent: args.intent,
      currentStep: args.currentStep,
      state: args.state as Record<string, unknown>,
    };

    // Process the intent
    const result = await agent.processIntent(agentContext);

    if (result.error) {
      return {
        success: false,
        message: result.error
      };
    }

    // If we have a schema, we need to render it
    if (result.schema) {
      return {
        success: true,
        needsRender: true,
        schema: result.schema,
        taskId: result.taskId || `task-${Date.now()}`
      };
    }

    // Otherwise, return a success message
    return {
      success: true,
      message: "Action completed successfully"
    };
  } catch (error) {
    console.error('Admin action error:', error);
    return {
      success: false,
      message: "An error occurred while processing your request."
    };
  }
}

const serviceAdapter = new OpenAIAdapter({ model: "gpt-4o" });

const runtime = new CopilotRuntime({
  actions: [
    {
      name: "performAdminTask",
      description: "Perform administrative tasks",
      parameters: [
        {
          name: "intent",
          type: "string",
          description: "The admin task to perform",
          required: true,
        },
      ],
      handler: async ({ intent }) => {
        return handleAdminAction({ intent });
      },
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
