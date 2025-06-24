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

// Note: This tool registry will be initialized with proper supabase client by the app
// For now, using placeholder - will be replaced in web app integration
const userProgressToolInstance = new UserProgressTool(new SupabaseUserProgressRepository(null as any));

export const universalProgressTool: AgentTool = {
  name: 'universalProgress',
  description: 'Universal progress tracking for all content types. Actions: trackVideoProgress, trackQuizCompletion, trackReadingProgress, trackProgressEvent, getProgress, getProgressSummary, getCompletionStats, checkMilestones, batchGetProgress, batchTrackProgress.',
  async run(input, context) {
    const { action } = input;
    if (!context.userId || !context.contextKey) throw new Error('userId and contextKey required');

    switch (action) {
      case 'trackVideoProgress': {
        const { contentId, watchTime, position, duration } = input;
        if (!contentId || watchTime === undefined || position === undefined) {
          throw new Error('contentId, watchTime, and position required');
        }
        return await userProgressToolInstance.trackVideoProgress(context.userId, contentId, context.contextKey, watchTime, position, duration);
      }

      case 'trackQuizCompletion': {
        const { contentId, score, totalQuestions, answeredQuestions } = input;
        if (!contentId || score === undefined || !totalQuestions || !answeredQuestions) {
          throw new Error('contentId, score, totalQuestions, and answeredQuestions required');
        }
        return await userProgressToolInstance.trackQuizCompletion(context.userId, contentId, context.contextKey, score, totalQuestions, answeredQuestions);
      }

      case 'trackReadingProgress': {
        const { contentId, scrollPosition, highlights } = input;
        if (!contentId || scrollPosition === undefined) {
          throw new Error('contentId and scrollPosition required');
        }
        return await userProgressToolInstance.trackReadingProgress(context.userId, contentId, context.contextKey, scrollPosition, highlights);
      }

      case 'trackProgressEvent': {
        const { progressEvent } = input;
        if (!progressEvent) throw new Error('progressEvent required');
        const fullEvent = { ...progressEvent, userId: context.userId, contextKey: context.contextKey };
        return await userProgressToolInstance.trackProgressEvent(fullEvent);
      }

      case 'getProgress': {
        const { contentId } = input;
        if (!contentId) throw new Error('contentId required');
        return await userProgressToolInstance.getProgress(context.userId, contentId, context.contextKey);
      }

      case 'listProgressForContentIds': {
        const { contentIds } = input;
        if (!Array.isArray(contentIds)) throw new Error('contentIds array required');
        return await userProgressToolInstance.listProgressForContentIds(context.userId, contentIds, context.contextKey);
      }

      case 'getProgressSummary': {
        return await userProgressToolInstance.getProgressSummary(context.userId, context.contextKey);
      }

      case 'getCompletionStats': {
        return await userProgressToolInstance.getCompletionStats(context.userId, context.contextKey);
      }

      case 'checkMilestones': {
        return await userProgressToolInstance.checkMilestones(context.userId, context.contextKey);
      }

      case 'batchGetProgress': {
        const { queries } = input;
        if (!Array.isArray(queries)) throw new Error('queries array required');
        return await userProgressToolInstance.batchGetProgress(queries);
      }

      case 'batchTrackProgress': {
        const { events } = input;
        if (!Array.isArray(events)) throw new Error('events array required');
        const fullEvents = events.map(event => ({ ...event, userId: context.userId, contextKey: context.contextKey }));
        return await userProgressToolInstance.batchTrackProgress(fullEvents);
      }

      // Legacy compatibility
      case 'setProgress': {
        const { contentId, progress } = input;
        if (!contentId || !progress) throw new Error('contentId and progress required');
        return await userProgressToolInstance.setProgress(context.userId, contentId, context.contextKey, progress);
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },
};

const allTools: AgentTool[] = [echoTool, universalProgressTool];

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
