import { isFeatureEnabled } from "../featureFlags";

export interface AgentTool {
  name: string;
  description: string;
  run(input: any, context: ToolContext): Promise<any>;
  featureFlag?: string;
  requiredEntitlements?: string[];
}

export interface ToolContext {
  userId: string;
  contextKey?: string;
  entitlements?: string[];
}

export const echoTool: AgentTool = {
  name: "echo",
  description: "Echoes the input text.",
  async run(input) {
    return { echo: input };
  },
};

const allTools: AgentTool[] = [echoTool];

export async function getAvailableTools(
  ctx: ToolContext,
): Promise<AgentTool[]> {
  return (
    await Promise.all(
      allTools.map(async (tool) => {
        if (tool.featureFlag) {
          const enabled = await isFeatureEnabled(
            tool.featureFlag,
            ctx.userId,
            ctx.contextKey,
          );
          if (!enabled) return null;
        }
        if (
          tool.requiredEntitlements &&
          (!ctx.entitlements ||
            !tool.requiredEntitlements.some((e) =>
              ctx.entitlements!.includes(e),
            ))
        ) {
          return null;
        }
        return tool;
      }),
    )
  ).filter(Boolean) as AgentTool[];
}
