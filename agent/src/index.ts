// File: agent/src/index.ts
// Purpose: Self-contained LangGraph agent for content generation
// Owner: AI team
// Tags: LangGraph, agent, content-generation

import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, AIMessage } from "@langchain/core/messages";

// Environment-aware web app URL configuration
function getWebAppUrl(): string {
  // Check if we're in production (Render deployment)
  const isProduction = process.env.NODE_ENV === 'production' ||
                      process.env.RENDER === 'true' ||
                      process.env.VERCEL_ENV === 'production';

  // Allow override via environment variable
  if (process.env.WEB_APP_URL) {
    return process.env.WEB_APP_URL;
  }

  // Production URL (Vercel deployment)
  if (isProduction) {
    return 'https://leaderforge-dev-web-l3u8.vercel.app';
  }

  // Development URL
  return 'http://localhost:3000';
}

// Simple content fetching tool
class TribeSocialContentTool {
  async getContentForContext(_tenantKey: string): Promise<any[]> {
    const webAppUrl = getWebAppUrl();
    const apiUrl = `${webAppUrl}/api/tribe/content/99735660`;

    console.log('[TribeSocialContentTool] Fetching from proxy:', apiUrl);
    console.log('[TribeSocialContentTool] Headers:', { Accept: 'application/json' });

    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Initialize tools
const tribeContentTool = new TribeSocialContentTool();

// Define the agent state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  userId: Annotation<string>(),
  tenantKey: Annotation<string>(),
  navOptionId: Annotation<string>(),
  agentConfig: Annotation<Record<string, unknown>>(),
  contentList: Annotation<any[]>(),
  progressMap: Annotation<Record<string, any>>(),
  agentParameters: Annotation<Record<string, unknown>>(),
  schema: Annotation<Record<string, unknown>>(),
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[ContentAgent] Error fetching content:', error);
    return {
      contentList: [],
      messages: [
        ...state.messages,
        new AIMessage(`Error fetching content: ${errorMessage}`)
      ]
    };
  }
}

async function fetchProgressData(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Progress fetching delegated to web server - agent does not access database directly');

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
    // Transform content items to Card format
    const cardItems = (state.contentList || []).map((content: Record<string, any>) => ({
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
        availableContent: state.contentList || []
      },
      config: {
        // Grid configuration
        title: 'Content Library',
        subtitle: 'Available content',
        layout: {
          type: 'grid',
          columns: 'auto-fill',
          minItemWidth: '300px',
          gap: '1rem'
        },
        displayMode: 'grid',
        interactions: [
          {
            trigger: 'item-click',
            action: 'openVideoModal',
            target: 'modal'
          }
        ]
      },
      version: '1.0'
    };

    return {
      schema: universalSchema,
      messages: [
        ...state.messages,
        new AIMessage(`Generated schema with ${cardItems.length} cards for ${state.tenantKey}`)
      ]
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[ContentAgent] Error generating schema:', error);

    // Return fallback schema
    const fallbackSchema = {
      type: 'Grid',
      id: `grid-fallback-${Date.now()}`,
      data: {
        items: [],
        availableContent: []
      },
      config: {
        title: 'Content Library',
        subtitle: 'No content available',
        layout: { type: 'grid', columns: 'auto-fill', minItemWidth: '300px', gap: '1rem' },
        displayMode: 'grid',
        interactions: []
      },
      version: '1.0'
    };

    return {
      schema: fallbackSchema,
      messages: [
        ...state.messages,
        new AIMessage(`Error generating schema: ${errorMessage}`)
      ]
    };
  }
}

// Create the graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("fetchContent", fetchContent)
  .addNode("fetchProgressData", fetchProgressData)
  .addNode("generateProgressSchema", generateProgressSchema)
  .addEdge("__start__", "fetchContent")
  .addEdge("fetchContent", "fetchProgressData")
  .addEdge("fetchProgressData", "generateProgressSchema")
  .addEdge("generateProgressSchema", "__end__");

const graph = workflow.compile();

console.log('[Agent] Initializing content agent with API-only access');

export default graph;
