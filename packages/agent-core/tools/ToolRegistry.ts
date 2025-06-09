import { isFeatureEnabled } from "../featureFlags";
import { UserProgressTool, SupabaseUserProgressRepository } from './UserProgressTool';

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

const userProgressToolInstance = new UserProgressTool(new SupabaseUserProgressRepository());

export const userProgressTool: AgentTool = {
  name: 'userProgress',
  description: 'Fetches user progress for content. Actions: getProgress, listProgressForContentIds, setProgress.',
  async run(input, context) {
    const { action, contentId, contentIds, progress } = input;
    if (!context.userId || !context.contextKey) throw new Error('userId and contextKey required');
    if (action === 'getProgress') {
      if (!contentId) throw new Error('contentId required');
      return await userProgressToolInstance.getProgress(context.userId, contentId, context.contextKey);
    }
    if (action === 'listProgressForContentIds') {
      if (!Array.isArray(contentIds)) throw new Error('contentIds array required');
      return await userProgressToolInstance.listProgressForContentIds(context.userId, contentIds, context.contextKey);
    }
    if (action === 'setProgress') {
      if (!contentId || !progress) throw new Error('contentId and progress required');
      return await userProgressToolInstance.setProgress(context.userId, contentId, context.contextKey, progress);
    }
    throw new Error('Unknown action');
  },
};

const allTools: AgentTool[] = [echoTool, userProgressTool];

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
