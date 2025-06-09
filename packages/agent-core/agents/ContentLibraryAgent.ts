// NOTE: You may need to install 'langsmith' with `pnpm add langsmith` if not present.
// If running locally without LangSmith, replace LangSmithTracer with a mock/stub as needed.
import { StateGraph, START, END } from '@langchain/langgraph';
// @ts-ignore
// import { LangSmithTracer } from 'langsmith';
import { UserProgressTool, SupabaseUserProgressRepository } from '../tools/UserProgressTool';
import { TribeSocialContentTool } from '../tools/TribeSocialContentTool';
import type { UserProgress } from '../tools/UserProgressTool';

// Initialize tools
const userProgressTool = new UserProgressTool(new SupabaseUserProgressRepository());
const tribeContentTool = new TribeSocialContentTool();
// const tracer = new LangSmithTracer({ project: 'leaderforge-content-library' });

interface ContentLibraryState {
  userId: string;
  contextKey: string;
  intent?: {
    type: string;
    contentId?: string;
    progress?: Partial<UserProgress>;
  };
  contentList?: any[];
  progressMap?: Record<string, any>;
  schema?: any;
  updateResult?: any;
}

// TODO: If StateGraph typing is too strict, use StateGraph<any> for now and refine later.
export function createContentLibraryAgent() {
  return {
    invoke: async (input: any) => {
      const contextKey = input.contextKey || 'leaderforge';
      // Fetch content from TribeSocial
      const contentList = await tribeContentTool.getContentForContext(contextKey);
      // Wrap in Grid schema for content library
      const schema = {
        type: 'Grid',
        props: {
          columns: 3,
          items: (contentList || []).map((content: any) => ({
            type: 'Card',
            props: { ...content.props }
          }))
        }
      };
      return {
        userId: input.userId || '',
        contextKey,
        schema,
      };
    }
  };
}