import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { cookies } from 'next/headers';
import { restoreSession } from '../../lib/supabaseServerClient';
import { AdminAgent, AdminAgentContext } from 'agent-core/agents/AdminAgent';

interface AdminActionArgs {
  intent: string;
  currentStep?: string;
  state?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

// Admin action handler
async function handleAdminAction(args: AdminActionArgs) {
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
    const isAdmin = session.user.user_metadata?.is_admin === true;
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
      state: args.state,
    };

    // Execute agent
    const response = await agent.processIntent(context);
    return response;
  } catch (error) {
    console.error('Admin action error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

// Use OpenAI adapter (which works with Anthropic format)
const serviceAdapter = new OpenAIAdapter();

const runtime = new CopilotRuntime({
  actions: [
    {
      name: "adminAction",
      description: "Handle admin operations like entitlements, tenants, and themes",
      parameters: [
        {
          name: "intent",
          type: "string",
          description: "The admin intent/command",
          required: true,
        },
        {
          name: "currentStep",
          type: "string",
          description: "Current step in multi-step operations",
          required: false,
        },
        {
          name: "state",
          type: "object",
          description: "Current state of the operation",
          required: false,
        },
        {
          name: "formData",
          type: "object",
          description: "Form data submitted by user",
          required: false,
        }
      ],
      handler: handleAdminAction,
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
