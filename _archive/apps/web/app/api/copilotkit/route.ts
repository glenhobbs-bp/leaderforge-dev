import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
  langGraphPlatformEndpoint,
} from "@copilotkit/runtime";

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    langGraphPlatformEndpoint({
      deploymentUrl: "http://localhost:8000", // Local LangGraph dev server
      agents: [
        {
          name: "default",
          description: "A helpful LLM agent for development.",
        },
      ],
    }),
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
