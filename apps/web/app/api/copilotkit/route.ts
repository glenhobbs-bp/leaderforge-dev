/**
 * File: apps/web/app/api/copilotkit/route.ts
 * Purpose: CopilotKit API endpoint for admin actions
 * Owner: Engineering Team
 * Tags: #copilotkit #api #admin
 *
 * CRITICAL DISTINCTION: Two Types of Entitlements
 *
 * 1. ADMIN PERMISSIONS (Authorization)
 *    - Question: "Can the current user manage entitlements?"
 *    - Examples: is_super_admin, platform_admin, tenant_admin
 *    - Purpose: Controls WHO can access entitlement management features
 *    - Checked via: getAdminLevel() function
 *
 * 2. TARGET USER ENTITLEMENTS (Business Logic)
 *    - Question: "What entitlements does the target user have?"
 *    - Examples: leaderforge-premium, basic-access, content-library-access
 *    - Purpose: The actual business entitlements being granted/revoked
 *    - Managed via: EntitlementTool.getUserEntitlements()
 *
 * NEVER conflate these two concepts!
 */

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
