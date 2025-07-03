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
        message: "You don't have admin permissions. If you should have admin access, please contact your administrator."
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

    // Handle different response types
    if (response.error) {
      return {
        success: false,
        message: `Error: ${response.error}`
      };
    }

    if (response.completed) {
      return {
        success: true,
        message: "✅ Task completed successfully!",
        completed: true
      };
    }

    // If we have a schema (form to fill out), describe it to the user
    if (response.schema) {
      const schema = response.schema;
      let formDescription = "I need some information to complete this task:\n\n";

      // Extract form fields from the schema
      if (schema.type === 'Form' && schema.data) {
                const formData = schema.data as { jsonSchema?: { properties?: Record<string, unknown>; required?: string[] } };

        if (formData.jsonSchema?.properties) {
          const properties = formData.jsonSchema.properties;
          const required = formData.jsonSchema.required || [];

          for (const [field, config] of Object.entries(properties)) {
            const fieldConfig = config as { title?: string; description?: string; enum?: string[] };
            const isRequired = required.includes(field);

            formDescription += `• **${fieldConfig.title || field}**`;
            if (isRequired) formDescription += " (required)";
            formDescription += `: ${fieldConfig.description || 'Please provide this information'}\n`;

            if (fieldConfig.enum) {
              formDescription += `  Options: ${fieldConfig.enum.join(', ')}\n`;
            }
          }
        }
      }

      return {
        success: true,
        message: formDescription + "\nPlease provide the required information to proceed.",
        needsInput: true,
        taskId: response.taskId,
        formSchema: response.schema
      };
    }

    // Default response
    return {
      success: true,
      message: "Processing your request..."
    };

  } catch (error) {
    console.error('[CopilotKit] Admin action error:', error);
    return {
      success: false,
      message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
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
