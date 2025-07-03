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
}) {
  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const { session, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return {
        error: "Unauthorized - Please log in",
        success: false
      };
    }

    // Check admin status
    const isAdmin = session.user.user_metadata?.is_admin === true ||
                    session.user.raw_user_meta_data?.is_admin === true;

    if (!isAdmin) {
      return {
        error: "Forbidden - Admin access required",
        success: false
      };
    }

    // Create AdminAgent context
    const agent = new AdminAgent();
    const context: AdminAgentContext = {
      userId: session.user.id,
      tenantKey: 'leaderforge', // You may want to get this from user metadata
      isAdmin: true,
      intent: args.intent || '',
      currentStep: args.currentStep,
      state: args.state as Record<string, unknown>,
    };

    // Execute agent
    const response = await agent.processIntent(context);
    return response;

  } catch (error) {
    console.error('[CopilotKit] Admin action error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

// Use OpenAI adapter configured for admin tasks
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4",
});

// Create runtime and register the admin action
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "performAdminTask",
      description: `Administrative actions for managing the platform. This includes:
        - Configuring user entitlements (e.g., "configure entitlements for user abc@example.com")
        - Creating new tenants (e.g., "create a new tenant named CompanyX")
        - Changing theme colors (e.g., "change the primary color to blue")`,
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
