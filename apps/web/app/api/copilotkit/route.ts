import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { cookies } from 'next/headers';
import { restoreSession } from '../../lib/supabaseServerClient';
  import { AdminAgent, AdminAgentContext } from 'agent-core/agents/AdminAgent';
  import { EntitlementTool } from 'agent-core/tools/EntitlementTool';

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
    const getAdminLevel = (user: { user_metadata?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean }; raw_user_meta_data?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean } }) => {
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

    const adminLevel = getAdminLevel(session.user);
    const isAdmin = adminLevel !== 'none';

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
          adminLevel: adminLevel,
          intent: `configure entitlements for ${formData.userId}`,
          currentStep: 'show-modification-form',
          state: { targetUserId: formData.userId },
        };

        const agentResult = await agent.processIntent(agentContext);

        if (agentResult.schema) {
          // For CopilotKit, we need to return a simple text response instead of complex schemas
          // Get the entitlements data and format it as a selectable list
          const availableEntitlements = await EntitlementTool.getAvailableEntitlements();
          const currentEntitlements = await EntitlementTool.getUserEntitlements(formData.userId);

          const entitlementList = availableEntitlements.map(entitlement => {
            const isAssigned = currentEntitlements.includes(entitlement.id);
            return `${isAssigned ? '✅' : '☐'} ${entitlement.display_name} (${entitlement.id})`;
          }).join('\n');

          return {
            success: true,
            message: `Here are all available entitlements for ${formData.userId}:\n\n${entitlementList}\n\nTo modify entitlements, please tell me which ones to add or remove. For example: "Add leaderforge-premium and remove basic-access" or "Give them all admin entitlements".`,
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
      isAdmin: isAdmin,
      adminLevel: adminLevel,
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
        // For entitlement configuration, return a user-friendly message instead of complex schema
        if (args.intent.toLowerCase().includes('entitlement')) {
          return {
            success: true,
            message: "I can help you configure user entitlements. Please provide the user's email address or user ID, and I'll show you their current entitlements and available options.",
            taskId: agentResult.taskId
          };
        }

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
        console.log('[CopilotKit API] performAdminTask called with intent:', intent);
        return handleAdminAction({ intent });
      },
    },


    {
      name: "modifyUserEntitlements",
      description: "Add or remove specific entitlements for a user",
      parameters: [
        {
          name: "userIdentifier",
          type: "string",
          description: "The user's email address or user ID",
          required: true,
        },
        {
          name: "action",
          type: "string",
          description: "The action to perform: 'add', 'remove', or 'set'",
          required: true,
        },
        {
          name: "entitlements",
          type: "string",
          description: "Comma-separated list of entitlement IDs or names",
          required: true,
        },
      ],
      handler: async ({ userIdentifier, action, entitlements }) => {
        try {
          // Get session from cookies
          const cookieStore = await cookies();
          const { session, error: sessionError } = await restoreSession(cookieStore);

          if (sessionError || !session?.user) {
            return {
              success: false,
              message: "You need to be logged in to modify entitlements."
            };
          }

          // Check admin permissions
          const getAdminLevel = (user: { user_metadata?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean }; raw_user_meta_data?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean } }) => {
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

          const adminLevel = getAdminLevel(session.user);
          const isAdmin = adminLevel !== 'none';

          if (!isAdmin) {
            return {
              success: false,
              message: "You don't have permission to modify entitlements."
            };
          }

          // Get user ID
          let userId = userIdentifier;
          if (userIdentifier.includes('@')) {
            const lookedUpUserId = await EntitlementTool.getUserIdByEmail(userIdentifier);
            if (!lookedUpUserId) {
              return {
                success: false,
                message: `No user found with email: ${userIdentifier}`
              };
            }
            userId = lookedUpUserId;
          }

          // Parse entitlements
          const entitlementList = entitlements.split(',').map(e => e.trim());
          const availableEntitlements = await EntitlementTool.getAvailableEntitlements();
          const currentEntitlements = await EntitlementTool.getUserEntitlements(userId);

          // Resolve entitlement names to IDs
          const resolvedEntitlements = entitlementList.map(entitlement => {
            // Try to find by ID first
            let found = availableEntitlements.find(e => e.id === entitlement);
            if (!found) {
              // Try to find by display name
              found = availableEntitlements.find(e =>
                e.display_name.toLowerCase().includes(entitlement.toLowerCase()) ||
                e.name.toLowerCase().includes(entitlement.toLowerCase())
              );
            }
            return found ? found.id : null;
          }).filter(Boolean);

          if (resolvedEntitlements.length === 0) {
            return {
              success: false,
              message: `No matching entitlements found for: ${entitlements}. Please check the entitlement names and try again.`
            };
          }

          // Perform the action
          let newEntitlements = [...currentEntitlements];

          if (action === 'add') {
            resolvedEntitlements.forEach(entitlement => {
              if (!newEntitlements.includes(entitlement)) {
                newEntitlements.push(entitlement);
              }
            });
          } else if (action === 'remove') {
            newEntitlements = newEntitlements.filter(e => !resolvedEntitlements.includes(e));
          } else if (action === 'set') {
            newEntitlements = resolvedEntitlements;
          }

          // Update entitlements
          const success = await EntitlementTool.updateUserEntitlements(userId, newEntitlements);

          if (success) {
            const updatedEntitlementNames = newEntitlements.map(id => {
              const entitlement = availableEntitlements.find(e => e.id === id);
              return entitlement ? entitlement.display_name : id;
            });

            return {
              success: true,
              message: `Successfully updated entitlements for ${userIdentifier}. They now have ${newEntitlements.length} entitlement(s): ${updatedEntitlementNames.join(', ')}`
            };
          } else {
            return {
              success: false,
              message: `Failed to update entitlements for ${userIdentifier}. Please try again.`
            };
          }

        } catch (error) {
          console.error('[CopilotKit] Error modifying entitlements:', error);
          return {
            success: false,
            message: "Failed to modify entitlements. Please try again."
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
          const getAdminLevel = (user: { user_metadata?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean }; raw_user_meta_data?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean } }) => {
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

          const adminLevel = getAdminLevel(session.user);
          const isAdmin = adminLevel !== 'none';

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
  // Extract context from CopilotKit properties if available
  let userContext: {
    userId?: string;
    isAuthenticated?: boolean;
    adminLevel?: string;
    sessionState?: string;
    userEmail?: string;
    userName?: string;
  } | null = null;

  try {
    const body = await req.text();
    const requestData = JSON.parse(body);

    // CopilotKit might send properties in variables or other locations
    const possibleProperties = requestData.properties ||
                              requestData.variables?.properties ||
                              requestData.variables?.input?.properties ||
                              null;

    // Only log full request data if properties are missing (for debugging)
    if (!possibleProperties) {
      console.log('[CopilotKit API] No properties found, request structure:', {
        requestKeys: Object.keys(requestData || {}),
        hasVariables: !!requestData.variables,
        variablesKeys: requestData.variables ? Object.keys(requestData.variables) : null
      });
    }

    // Log summary of request structure
    console.log('[CopilotKit API] Request summary:', {
      hasProperties: !!possibleProperties,
      operationType: requestData.operationName || 'unknown'
    });

    // Extract user context from CopilotKit properties
    if (possibleProperties) {
      userContext = possibleProperties;
      console.log('[CopilotKit API] User context from properties:', {
        userId: userContext.userId,
        isAuthenticated: userContext.isAuthenticated,
        adminLevel: userContext.adminLevel,
        userName: userContext.userName
      });
    } else {
      console.log('[CopilotKit API] No properties found in request');
    }

    // Also get session from cookies as fallback
    const cookieStore = await cookies();
    const { session } = await restoreSession(cookieStore);

    if (session?.user) {
      console.log('[CopilotKit API] Session context:', {
        userId: session.user.id,
        email: session.user.email,
        isAuthenticated: true
      });
    }

    // Reconstruct the request with the body for CopilotKit
    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: body,
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: newReq.nextUrl.pathname,
    });

    return handleRequest(newReq);
  } catch (error) {
    console.error('[CopilotKit API] Error processing request:', error);

    // Fallback to original handling
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: req.nextUrl.pathname,
    });

    return handleRequest(req);
  }
};
