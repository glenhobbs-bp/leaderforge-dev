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
  async getProgress(_userId: string, _contentId: string, _tenantKey: string): Promise<UserProgress | null> {
    // For now, return null - the agent doesn't need direct progress access
    // Progress is handled by the web server via API calls
    return null;
  }

  async listProgressForContentIds(_userId: string, _contentIds: string[], _tenantKey: string): Promise<UserProgress[]> {
    // Return empty array - progress fetching handled by web server
    return [];
  }

  async setProgress(_userId: string, _contentId: string, _tenantKey: string, _progress: Partial<UserProgress>): Promise<UserProgress> {
    throw new Error('Agent should not update progress directly - use API endpoints');
  }

  async trackProgressEvent(_event: ProgressEvent): Promise<UserProgress> {
    throw new Error('Agent should not track events directly - use API endpoints');
  }

  async getProgressSummary(_userId: string, _tenantKey: string): Promise<ProgressSummary> {
    // Return empty summary - handled by web server
    return {
      userId: _userId,
      tenantKey: _tenantKey,
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      completionPercentage: 0,
      totalSessionTime: 0,
      lastActivity: new Date().toISOString(),
      progressByType: {}
    };
  }

  async getCompletionStats(_userId: string, _tenantKey: string): Promise<CompletionStats> {
    return {
      userId: _userId,
      tenantKey: _tenantKey,
      completionsByType: {},
      averageSessionTime: 0,
      streakDays: 0,
      milestones: []
    };
  }

  async checkMilestones(_userId: string, _tenantKey: string): Promise<Milestone[]> {
    return [];
  }

  async batchGetProgress(_queries: Array<{ userId: string; contentId: string; tenantKey: string }>): Promise<UserProgress[]> {
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
    if (!context.userId || !context.tenantKey) throw new Error('userId and tenantKey required');

    switch (action) {
      case 'getProgressSummary': {
        return await userProgressTool.getProgressSummary(context.userId, context.tenantKey);
      }

      case 'getCompletionStats': {
        return await userProgressTool.getCompletionStats(context.userId, context.tenantKey);
      }

      case 'checkMilestones': {
        return await userProgressTool.checkMilestones(context.userId, context.tenantKey);
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
  tenantKey: Annotation<string>(),
  navOptionId: Annotation<string>(),
  agentConfig: Annotation<any>(),
  contentList: Annotation<any[]>(),
  progressMap: Annotation<Record<string, any>>(),
  agentParameters: Annotation<any>(),
  schema: Annotation<any>(),
});

// Node functions
async function fetchContent(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Fetching content for tenant:', state.tenantKey);

  try {
    const content = await tribeContentTool.getContentForContext(state.tenantKey || 'leaderforge');
    console.log('[ContentAgent] Retrieved content count:', content.length);

    return {
      contentList: content,
      messages: [
        ...state.messages,
        new AIMessage(`Found ${content.length} content items for ${state.tenantKey}`)
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
  console.log('[ContentAgent] Progress fetching delegated to web server - agent does not access database directly');

  // ✅ ARCHITECTURE COMPLIANCE: Agents do not access databases directly
  // Progress data will be enriched by the AgentService after the agent response
  return {
    progressMap: {},
    messages: [
      ...state.messages,
      new AIMessage('Progress data will be handled by the web application')
    ]
  };
}

async function generateProgressSchema(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Generating Universal Widget Schema (ADR-0009 compliant)');

  try {
    // ✅ ARCHITECTURE COMPLIANCE: Agent generates Universal Widget Schema per ADR-0009
    // Web layer will enrich with real-time progress data

    // Transform content items to Card format
    const cardItems = (state.contentList || []).map((content: any) => ({
      type: 'Card',
      id: `card-${content.props?.id || content.id}-${Date.now()}`,
      data: {
        // Content data
        imageUrl: content.props?.image || content.props?.imageUrl || content.imageUrl,
        videoUrl: content.props?.videoUrl || content.videoUrl,
        description: content.props?.description || content.description,
        duration: content.props?.duration || content.duration,
        featuredImage: content.props?.featuredImage,
        coverImage: content.props?.coverImage,
        // Progress data (placeholder - will be enriched by web layer)
        progress: 0, // Will be replaced with real data by AgentService
        value: 0, // Will be replaced with real data by AgentService
        stats: {
          watched: false, // Will be replaced with real data by AgentService
          completed: false, // Will be replaced with real data by AgentService
          lastWatched: null // Will be replaced with real data by AgentService
        }
      },
      config: {
        // Display configuration
        title: content.props?.title || content.title,
        subtitle: content.props?.subtitle || content.subtitle || 'Learning Content',
        actions: [
          {
            action: 'openVideoModal',
            label: 'Watch Video',
            primary: true,
            parameters: {
              videoUrl: content.props?.videoUrl || content.videoUrl,
              title: content.props?.title || content.title,
              poster: content.props?.image || content.props?.imageUrl || content.imageUrl
            }
          },
          {
            action: 'openWorksheet',
            label: 'Worksheet',
            primary: false,
            parameters: {
              worksheetUrl: '#worksheet', // Placeholder
              contentId: content.props?.id || content.id
            }
          }
        ]
      },
      version: '1.0'
    }));

    // Generate Universal Widget Schema (ADR-0009)
    const universalSchema = {
      type: 'Grid',
      id: `grid-content-library-${Date.now()}`,
      data: {
        // Grid data content
        items: cardItems,
        availableContent: (state.contentList || []).map((content: any) => content.props?.id || content.id)
      },
      config: {
        // Grid display configuration
        title: 'Content Library',
        subtitle: 'Available content',
        layout: {
          columns: 3,
          gap: 'medium',
          direction: 'horizontal'
        },
        displayMode: 'grid',
        interactions: [
          {
            trigger: 'cardClick',
            action: 'openVideo',
            parameters: {}
          }
        ]
      },
      version: '1.0'
    };

    return {
      agentParameters: {
        completionThreshold: 0.9,
        resumeBuffer: 10,
        minimumWatchTime: 30
      },
      schema: universalSchema,
      messages: [
        ...state.messages,
        new AIMessage('Generated Universal Widget Schema (ADR-0009) - progress enrichment handled by web layer')
      ]
    };
  } catch (error) {
    console.log('[ContentAgent] Error generating schema:', error);

    // Fallback: create basic Universal Widget Schema
    const fallbackSchema = {
      type: 'Grid',
      id: `grid-fallback-${Date.now()}`,
      data: {
        items: (state.contentList || []).map((content: any) => ({
          type: 'Card',
          id: `card-fallback-${content.props?.id || content.id}`,
          data: {
            imageUrl: content.props?.image || content.props?.imageUrl || content.imageUrl,
            videoUrl: content.props?.videoUrl || content.videoUrl,
            description: content.props?.description || content.description,
            progress: 0
          },
          config: {
            title: content.props?.title || content.title,
            subtitle: content.props?.subtitle || content.subtitle
          },
          version: '1.0'
        })),
        availableContent: []
      },
      config: {
        title: 'Content Library',
        subtitle: 'Available content',
        layout: {
          columns: 3
        }
      },
      version: '1.0'
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
        new AIMessage('Generated fallback Universal Widget Schema')
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
