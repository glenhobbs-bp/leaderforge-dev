// File: agent/src/index.ts
// Purpose: LangGraph HTTP API agent for LeaderForge content library
// Owner: AI team
// Tags: LangGraph, agent, content library, TribeSocial integration

import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { TribeSocialContentTool } from '../../packages/agent-core/tools/TribeSocialContentTool';
import { UserProgressTool, UserProgressRepository, UserProgress, ProgressEvent, ProgressSummary, CompletionStats, Milestone } from '../../packages/agent-core/tools/UserProgressTool';
import { ProgressAwareAgent } from '../../packages/agent-core/agents/ProgressAwareAgent';

// Agent should not access database directly - only make API calls to web server
console.log('[Agent] Initializing content agent with API-only access');

// API-based repository that makes HTTP calls to the web server instead of direct database access
class ApiUserProgressRepository implements UserProgressRepository {
  async getProgress(_userId: string, _contentId: string, _contextKey: string): Promise<UserProgress | null> {
    // For now, return null - the agent doesn't need direct progress access
    // Progress is handled by the web server via API calls
    return null;
  }

  async listProgressForContentIds(_userId: string, _contentIds: string[], _contextKey: string): Promise<UserProgress[]> {
    // Return empty array - progress fetching handled by web server
    return [];
  }

  async setProgress(_userId: string, _contentId: string, _contextKey: string, _progress: Partial<UserProgress>): Promise<UserProgress> {
    throw new Error('Agent should not update progress directly - use API endpoints');
  }

  async trackProgressEvent(_event: ProgressEvent): Promise<UserProgress> {
    throw new Error('Agent should not track events directly - use API endpoints');
  }

  async getProgressSummary(_userId: string, _contextKey: string): Promise<ProgressSummary> {
    // Return empty summary - handled by web server
    return {
      userId: _userId,
      contextKey: _contextKey,
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      completionPercentage: 0,
      totalSessionTime: 0,
      lastActivity: new Date().toISOString(),
      progressByType: {}
    };
  }

  async getCompletionStats(_userId: string, _contextKey: string): Promise<CompletionStats> {
    return {
      userId: _userId,
      contextKey: _contextKey,
      completionsByType: {},
      averageSessionTime: 0,
      streakDays: 0,
      milestones: []
    };
  }

  async checkMilestones(_userId: string, _contextKey: string): Promise<Milestone[]> {
    return [];
  }

  async batchGetProgress(_queries: Array<{ userId: string; contentId: string; contextKey: string }>): Promise<UserProgress[]> {
    return [];
  }

  async batchTrackProgress(_events: ProgressEvent[]): Promise<UserProgress[]> {
    throw new Error('Agent should not track progress directly - use API endpoints');
  }
}

// Initialize tools with API-based repository
const tribeContentTool = new TribeSocialContentTool();
const apiProgressRepository = new ApiUserProgressRepository();
const userProgressTool = new UserProgressTool(apiProgressRepository);

// Create a custom universalProgressTool for the agent that uses API-based repository
const agentUniversalProgressTool = {
  name: 'universalProgress',
  description: 'Universal progress tracking for all content types',
  async run(input: any, context: any): Promise<any> {
    const { action } = input;
    if (!context.userId || !context.contextKey) throw new Error('userId and contextKey required');

    switch (action) {
      case 'getProgressSummary': {
        return await userProgressTool.getProgressSummary(context.userId, context.contextKey);
      }

      case 'getCompletionStats': {
        return await userProgressTool.getCompletionStats(context.userId, context.contextKey);
      }

      case 'checkMilestones': {
        return await userProgressTool.checkMilestones(context.userId, context.contextKey);
      }

      case 'batchGetProgress': {
        const { queries } = input;
        if (!Array.isArray(queries)) throw new Error('queries array required');
        return await userProgressTool.batchGetProgress(queries);
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },
};

const progressAwareAgent = new ProgressAwareAgent(agentUniversalProgressTool);

// Define the agent state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  userId: Annotation<string>(),
  contextKey: Annotation<string>(),
  navOptionId: Annotation<string>(),
  agentConfig: Annotation<any>(),
  contentList: Annotation<any[]>(),
  progressMap: Annotation<Record<string, any>>(),
  agentParameters: Annotation<any>(),
  schema: Annotation<any>(),
});

// Node functions
async function fetchContent(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Fetching content for context:', state.contextKey);

  try {
    const content = await tribeContentTool.getContentForContext(state.contextKey || 'leaderforge');
    console.log('[ContentAgent] Retrieved content count:', content.length);

    return {
      contentList: content,
      messages: [
        ...state.messages,
        new AIMessage(`Found ${content.length} content items for ${state.contextKey}`)
      ]
    };
  } catch (error) {
    console.log('[ContentAgent] Error fetching content:', error);
    return {
      contentList: [],
      messages: [
        ...state.messages,
        new AIMessage(`Error fetching content: ${error.message}`)
      ]
    };
  }
}

async function fetchProgressData(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Fetching progress data for user:', state.userId);

  // Skip progress fetching if no userId (agent doesn't access database directly)
  if (!state.userId) {
    console.log('[ContentAgent] No userId provided - skipping progress fetch');
    return {
      progressMap: {},
      messages: [
        ...state.messages,
        new AIMessage('Progress data will be handled by the web application')
      ]
    };
  }

  console.log('[ContentAgent] Progress fetching delegated to web server');
  return {
    progressMap: {},
    messages: [
      ...state.messages,
      new AIMessage('Progress data handled by web application')
    ]
  };
}

async function generateProgressSchema(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Generating progress-aware schema');

  try {
    // Use default agent parameters if not provided
    const defaultParameters = {
      completionThreshold: 0.9,
      resumeBuffer: 10,
      minimumWatchTime: 30
    };

    // Create base schema
    const baseSchema = {
      type: 'Grid',
      props: {
        columns: 3,
        items: (state.contentList || []).map((content: any) => ({
          type: 'Card',
          props: {
            id: content.props?.id || content.id,
            title: content.props?.title || content.title,
            subtitle: content.props?.subtitle || content.subtitle,
            description: content.props?.description || content.description,
            imageUrl: content.props?.image || content.props?.imageUrl || content.imageUrl,
            videoUrl: content.props?.videoUrl || content.videoUrl,
            duration: content.props?.duration || content.duration,
            progress: 0
          }
        })),
        title: 'Content Library',
        subtitle: 'Available content',
        availableContent: (state.contentList || []).map((content: any) => content.props?.id || content.id)
      }
    };

    // Create progress context
    const progressContext = {
      userId: state.userId || 'anonymous',
      contextKey: state.contextKey || 'default'
    };

    // Generate schema with progress awareness
    const schema = await progressAwareAgent.generateProgressSchema(progressContext, baseSchema);

    return {
      agentParameters: defaultParameters,
      schema,
      messages: [
        ...state.messages,
        new AIMessage('Generated progress-aware content schema')
      ]
    };
  } catch (error) {
    console.log('[ContentAgent] Error generating schema:', error);

    // Fallback: create basic grid schema
    const fallbackSchema = {
      type: 'Grid',
      props: {
        columns: 3,
        items: (state.contentList || []).map((content: any) => ({
          type: 'Card',
          props: {
            id: content.props?.id || content.id,
            title: content.props?.title || content.title,
            subtitle: content.props?.subtitle || content.subtitle,
            description: content.props?.description || content.description,
            imageUrl: content.props?.image || content.props?.imageUrl || content.imageUrl,
            videoUrl: content.props?.videoUrl || content.videoUrl,
            duration: content.props?.duration || content.duration,
            progress: 0
          }
        })),
        title: 'Content Library',
        subtitle: 'Available content'
      }
    };

    return {
      agentParameters: {
        completionThreshold: 0.9,
        resumeBuffer: 10,
        minimumWatchTime: 30
      },
      schema: fallbackSchema,
      messages: [
        ...state.messages,
        new AIMessage('Generated fallback content schema')
      ]
    };
  }
}

// Create the workflow
const workflow = new StateGraph(StateAnnotation)
  .addNode("fetchContent", fetchContent)
  .addNode("fetchProgressData", fetchProgressData)
  .addNode("generateProgressSchema", generateProgressSchema)
  .addEdge("__start__", "fetchContent")
  .addEdge("fetchContent", "fetchProgressData")
  .addEdge("fetchProgressData", "generateProgressSchema")
  .addEdge("generateProgressSchema", "__end__");

// Compile the graph
const app = workflow.compile();

// Export the compiled graph as default
export default app;
