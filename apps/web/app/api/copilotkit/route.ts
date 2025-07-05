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
  try {
    console.log('[CopilotKit API] POST request received');

    // Parse the request to understand its structure
    const requestBody = await req.text();
    console.log('[CopilotKit API] Raw request body length:', requestBody.length);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('[CopilotKit API] Request structure:', {
        requestKeys: Object.keys(parsedBody),
        hasVariables: !!parsedBody.variables,
        variablesKeys: parsedBody.variables ? Object.keys(parsedBody.variables) : []
      });
    } catch {
      console.log('[CopilotKit API] Failed to parse request body as JSON');
    }

    // Determine the type of operation
    let operationType = 'unknown';
    let hasProperties = false;

    if (parsedBody?.query?.includes('availableAgents')) {
      operationType = 'availableAgents';
    } else if (parsedBody?.query?.includes('generateCopilotResponse')) {
      operationType = 'generateCopilotResponse';
      hasProperties = !!(parsedBody?.variables?.properties);
    }

    console.log('[CopilotKit API] Request summary:', { hasProperties, operationType });

    // Extract user context from properties if available
    let userContext = null;
    if (parsedBody?.variables?.properties) {
      try {
        // Properties might be already parsed or a string
        const properties = typeof parsedBody.variables.properties === 'string'
          ? JSON.parse(parsedBody.variables.properties)
          : parsedBody.variables.properties;

        userContext = {
          userId: properties.userId,
          isAuthenticated: properties.isAuthenticated,
          adminLevel: properties.adminLevel,
          userName: properties.userName,
          userEmail: properties.userEmail,
          tenantKey: properties.tenantKey
        };
        console.log('[CopilotKit API] User context from properties:', userContext);
      } catch (error) {
        console.log('[CopilotKit API] Failed to parse properties:', error);
        console.log('[CopilotKit API] Properties value:', parsedBody.variables.properties);
      }
    } else {
      console.log('[CopilotKit API] No properties found in request');
    }

    // Get session for additional context
    const cookieStore = await cookies();
    const { session, error: sessionError } = await restoreSession(cookieStore);

    if (session?.user) {
      console.log('[CopilotKit API] Session context:', {
        userId: session.user.id,
        email: session.user.email,
        isAuthenticated: true
      });
    } else {
      console.log('[CopilotKit API] No valid session found:', sessionError);
    }

    // Create new request with the original body
    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: requestBody,
    });

    console.log('[CopilotKit API] Processing request with existing runtime and serviceAdapter');
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(newReq);
    console.log('[CopilotKit API] Response generated, status:', response.status);
    return response;

  } catch (error) {
    console.error('[CopilotKit API] Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
