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
      const formData = args.formData as { userId?: string; newEntitlements?: string[] };

      // Handle entitlement lookup (Step 1)
      if (args.taskId.startsWith('entitlements-') && formData.userId && !formData.newEntitlements) {
        // This is step 1 - user lookup, now show step 2 with current entitlements
        const agent = new AdminAgent();
        const agentContext: AdminAgentContext = {
          userId: session.user.id,
          tenantKey: 'leaderforge',
          isAdmin: true,
          intent: `configure entitlements for ${formData.userId}`,
          currentStep: 'show-modification-form',
          state: { targetUserId: formData.userId },
        };

        const agentResult = await agent.processIntent(agentContext);

        if (agentResult.schema) {
          return {
            needsRender: true,
            schema: agentResult.schema,
            taskId: agentResult.taskId
          };
        }
      }

      // Handle entitlement updates (Step 2)
      if (args.taskId.startsWith('entitlements-') && formData.newEntitlements) {
        const { EntitlementTool } = await import('agent-core/tools/EntitlementTool');

        const userId = formData.userId!;
        const entitlements = formData.newEntitlements || [];

        // Update the user's entitlements
        const success = await EntitlementTool.updateUserEntitlements(userId, entitlements);

        if (success) {
          return {
            success: true,
            message: `Successfully updated entitlements for ${userId}. The user now has ${entitlements.length} entitlement(s).`,
            taskCompleted: true
          };
        } else {
          return {
            success: false,
            message: `Failed to update entitlements for ${userId}. Please try again or check the logs.`
          };
        }
      }
    }

    // Initial admin action request
    // Create AdminAgent context
    const agent = new AdminAgent();
    const agentContext: AdminAgentContext = {
      userId: session.user.id,
      tenantKey: 'leaderforge',
      isAdmin: true,
      intent: args.intent,
      currentStep: args.currentStep,
      state: args.state as Record<string, unknown> || {},
    };

    try {
      const agentResult = await agent.processIntent(agentContext);

      if (agentResult.error) {
        return {
          success: false,
          message: agentResult.error
        };
      }

      if (agentResult.schema) {
        return {
          needsRender: true,
          schema: agentResult.schema,
          taskId: agentResult.taskId,
          nextStep: agentResult.nextStep
        };
      }

      return {
        success: false,
        message: "Unable to process the admin request. Please try again."
      };
    } catch (error) {
      console.error('[API/copilotkit] Admin agent error:', error);
      return {
        success: false,
        message: "An error occurred while processing the admin request."
      };
    }
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
      description: "Perform administrative tasks including managing entitlements, creating tenants, and changing themes",
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
    {
      name: "getCurrentEntitlements",
      description: "Get the current entitlements for a specific user by email or user ID",
      parameters: [
        {
          name: "userIdentifier",
          type: "string",
          description: "The user's email address or user ID",
          required: true,
        },
      ],
      handler: async ({ userIdentifier }) => {
        try {
          // Get session from cookies
          const cookieStore = await cookies();
          const { session, error: sessionError } = await restoreSession(cookieStore);

          if (sessionError || !session?.user) {
            return {
              success: false,
              message: "You need to be logged in to view entitlements."
            };
          }

          // Check admin status
          const isAdmin = session.user.user_metadata?.is_admin === true ||
                          (session.user as { raw_user_meta_data?: { is_admin?: boolean } })?.raw_user_meta_data?.is_admin === true;

          if (!isAdmin) {
            return {
              success: false,
              message: "You don't have permission to view user entitlements."
            };
          }

          const { EntitlementTool } = await import('agent-core/tools/EntitlementTool');

          // Check if userIdentifier is an email or user ID
          let userId = userIdentifier;
          if (userIdentifier.includes('@')) {
            // It's an email, look up the user ID
            const lookedUpUserId = await EntitlementTool.getUserIdByEmail(userIdentifier);
            if (!lookedUpUserId) {
              return {
                success: false,
                message: `No user found with email: ${userIdentifier}`
              };
            }
            userId = lookedUpUserId;
          }

          const entitlements = await EntitlementTool.getUserEntitlements(userId);
          const availableEntitlements = await EntitlementTool.getAvailableEntitlements();

          const formattedEntitlements = entitlements
            .map(id => {
              const ent = availableEntitlements.find(e => e.id === id);
              return ent ? ent.name : id;
            })
            .join(', ');

          if (formattedEntitlements.length === 0) {
            return {
              success: true,
              message: `${userId} currently has no entitlements assigned.`
            };
          }

          return {
            success: true,
            message: `${userId} currently has the following entitlements: ${formattedEntitlements || 'None'}`
          };
        } catch (error) {
          console.error('Error fetching entitlements:', error);
          return {
            success: false,
            message: "Failed to fetch entitlements. Please try again."
          };
        }
      },
    },
    {
      name: "listAvailableEntitlements",
      description: "List all available entitlements that can be assigned to users",
      handler: async () => {
        try {
          // Get session from cookies
          const cookieStore = await cookies();
          const { session, error: sessionError } = await restoreSession(cookieStore);

          if (sessionError || !session?.user) {
            return {
              success: false,
              message: "You need to be logged in to view entitlements."
            };
          }

          // Check admin status
          const isAdmin = session.user.user_metadata?.is_admin === true ||
                          (session.user as { raw_user_meta_data?: { is_admin?: boolean } })?.raw_user_meta_data?.is_admin === true;

          if (!isAdmin) {
            return {
              success: false,
              message: "You don't have permission to view entitlements."
            };
          }

          const { EntitlementTool } = await import('agent-core/tools/EntitlementTool');
          const availableEntitlements = await EntitlementTool.getAvailableEntitlements();

          if (availableEntitlements.length === 0) {
            return {
              success: false,
              message: `No entitlements are currently defined in the system. To create entitlements, you'll need to add them to the core.entitlements table in the database. Would you like me to help you understand what entitlements should be created?`
            };
          }

          const entitlementList = availableEntitlements
            .map(e => `- ${e.display_name} (${e.tenant_key}): ${e.description || 'No description'}`)
            .join('\n');

          return {
            success: true,
            message: `Here are all available entitlements in the system:\n\n${entitlementList}\n\nTo assign entitlements to a user, please let me know which ones you'd like to grant.`
          };
        } catch (error) {
          console.error('Error listing entitlements:', error);
          return {
            success: false,
            message: "Failed to list entitlements. Please try again."
          };
        }
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
