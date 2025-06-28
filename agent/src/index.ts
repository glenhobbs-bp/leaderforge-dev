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
  async getContentForContext(tenantKey: string): Promise<Record<string, unknown>[]> {
    const webAppUrl = getWebAppUrl();
    const apiUrl = `${webAppUrl}/api/tribe/content/99735660`;

    console.log('[TribeSocialContentTool] Fetching from proxy:', apiUrl);
    console.log('[TribeSocialContentTool] For tenant:', tenantKey);
    console.log('[TribeSocialContentTool] Headers:', { Accept: 'application/json' });

    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the Contents array from the collection response
    const contents = (data.Contents || []) as Record<string, unknown>[];
    console.log('[TribeSocialContentTool] Extracted contents count:', contents.length);

    // Process image URLs for each content item (restore original logic)
    const processedContents = contents.map((item: any) => {
      // Image selection logic (restored from original TribeSocialContentTool)
      let image: string | undefined = undefined;
      if (item.collectionBGImage) {
        image = `https://cdn.tribesocial.io/${item.collectionBGImage}`;
      } else if (item.featuredImage) {
        image = item.featuredImage.startsWith('http') ? item.featuredImage : `https://cdn.tribesocial.io/${item.featuredImage}`;
      } else if (item.coverImage) {
        image = item.coverImage.startsWith('http') ? item.coverImage : `https://cdn.tribesocial.io/${item.coverImage}`;
      } else if (item.imageUrl && typeof item.imageUrl === 'string') {
        image = item.imageUrl;
      }

      // Video URL logic (restored from original)
      let videoUrl = undefined;
      if (item.transcodingDataLP) {
        try {
          const transcoding = typeof item.transcodingDataLP === 'string' ? JSON.parse(item.transcodingDataLP) : item.transcodingDataLP;
          if (transcoding && transcoding.hls) {
            videoUrl = transcoding.hls.startsWith('http') ? transcoding.hls : `https://cdn.tribesocial.io/${transcoding.hls}`;
          }
        } catch {
          // Ignore transcoding parsing errors
        }
      } else if (item.video) {
        videoUrl = item.video.startsWith('http') ? item.video : `https://cdn.tribesocial.io/${item.video}`;
      }

      return {
        ...item,
        // Override with processed URLs
        processedImage: image,
        processedVideoUrl: videoUrl,
        // Keep original fields for fallback
        originalFeaturedImage: item.featuredImage,
        originalCoverImage: item.coverImage,
        originalImageUrl: item.imageUrl
      };
    });

    console.log('[TribeSocialContentTool] Processed image URLs for', processedContents.length, 'items');
    return processedContents;
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
  contentList: Annotation<Record<string, unknown>[]>(),
  progressMap: Annotation<Record<string, unknown>>(),
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
    // @ts-expect-error - Temporary disable for content item processing
    const cardItems = (state.contentList || []).map((content: any) => ({
        type: 'Card',
        id: `card-${content.props?.id || content.id}-${Date.now()}`,
        data: {
          // Content data - use processed URLs
          imageUrl: content.processedImage || content.props?.image || content.props?.imageUrl || content.imageUrl,
          videoUrl: content.processedVideoUrl || content.props?.videoUrl || content.videoUrl,
          description: content.props?.description || content.description || content.descriptionPlain,
          duration: content.props?.duration || content.duration,
          featuredImage: content.processedImage || content.props?.featuredImage || content.featuredImage,
          coverImage: content.processedImage || content.props?.coverImage || content.coverImage,
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
              videoUrl: content.processedVideoUrl || content.props?.videoUrl || content.videoUrl,
              title: content.props?.title || content.title,
              poster: content.processedImage || content.props?.image || content.props?.imageUrl || content.imageUrl
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
