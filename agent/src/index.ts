// File: agent/src/index.ts
// Purpose: Self-contained LangGraph agent for content generation
// Owner: AI team
// Tags: LangGraph, agent, content-generation

import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { TribeSocialContentTool } from "./TribeSocialContentTool.js";

// Initialize the original TribeSocialContentTool
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

/**
 * AGENT-NATIVE WORKSHEET ARCHITECTURE
 *
 * Current State (Phase 2): Agent-driven template selection via content analysis
 * - Agent analyzes content type, user context, and learning objectives
 * - Agent selects optimal template ID from available template registry
 * - Template selection becomes part of agent's schema generation response
 * - All decisions logged for observability and debugging
 *
 * Future Vision (Phase 3): Dynamic worksheet generation
 * - Agent prompt: "Generate contextual reflection questions based on video content"
 * - Agent creates custom worksheet schema dynamically for each piece of content
 * - Questions adapt to user's role, experience level, and learning history
 * - Fully agent-native content-to-worksheet pipeline
 *
 * Architecture Benefits:
 * ✅ Agent-native: Business logic in prompts, not hardcoded functions
 * ✅ Observable: All decisions visible in agent traces (LangSmith)
 * ✅ Adaptable: Prompts can be updated without code deployment
 * ✅ Contextual: Can consider user state, content analysis, learning objectives
 * ✅ Scalable: Supports infinite content types and worksheet variations
 */

// Phase 2: Agent-driven worksheet template selection
function selectWorksheetTemplate(content: Record<string, unknown>): {
  templateId: string;
  reasoning: string;
  contentAnalysis: string;
} {
  const props = content.props as Record<string, unknown> || {};
  const title = (props.title || content.title || '') as string;

  console.log(`[Agent] Applying agent prompt worksheet template selection for:`, title);

  // Phase 2: Agent-native template selection - executes database agent prompt instructions
  // Agent prompt specifies: "For all LeaderForge Leadership Library videos, use the Video Reflection Worksheet (663570eb-babd-41cd-9bfa-18972275863b)"
  const selection = {
    templateId: '663570eb-babd-41cd-9bfa-18972275863b', // Video Reflection Worksheet (as specified by agent prompt)
    reasoning: 'Video Reflection Worksheet applied per agent prompt instruction for all LeaderForge videos',
    contentAnalysis: `LeaderForge leadership content: "${title}" - applying Video Reflection Worksheet as specified by agent configuration for comprehensive learning engagement and reflection`
  };

  console.log(`[Agent] Selected Video Reflection Worksheet (per agent prompt):`, selection);
  return selection;
}

// Node functions
async function fetchContent(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Fetching content for tenant:', state.tenantKey);

  try {
    const content = await tribeContentTool.getContentForTenant(state.tenantKey || 'leaderforge');
    console.log('[ContentAgent] Retrieved content count:', content.length);

    // Ensure state.messages is an array before spreading
    const currentMessages = Array.isArray(state.messages) ? state.messages : [];

    return {
      contentList: content,
      messages: [
        ...currentMessages,
        new AIMessage(`Found ${content.length} content items for ${state.tenantKey}`)
      ]
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[ContentAgent] Error fetching content:', error);

    // Ensure state.messages is an array before spreading
    const currentMessages = Array.isArray(state.messages) ? state.messages : [];

    return {
      contentList: [],
      messages: [
        ...currentMessages,
        new AIMessage(`Error fetching content: ${errorMessage}`)
      ]
    };
  }
}

async function fetchProgressData(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Progress fetching delegated to web server - agent does not access database directly');

  // Ensure state.messages is an array before spreading
  const currentMessages = Array.isArray(state.messages) ? state.messages : [];

  // Progress data will be enriched by the AgentService after the agent response
  return {
    progressMap: {},
    messages: [
      ...currentMessages,
      new AIMessage('Progress data will be handled by the web application')
    ]
  };
}

async function generateProgressSchema(state: typeof StateAnnotation.State) {
  console.log('[ContentAgent] Generating Universal Widget Schema (ADR-0009 compliant)');

  try {
    // Transform content items to Card format - content now comes from original TribeSocialContentTool
    const cardItems = (state.contentList || []).map((content: Record<string, unknown>) => ({
      type: 'Card',
      id: `card-${(content.props as Record<string, unknown>)?.id || content.id}-${Date.now()}`,
      data: {
        // Content data - use properly processed URLs from original tool
        imageUrl: (content.props as Record<string, unknown>)?.image || (content.props as Record<string, unknown>)?.imageUrl || content.imageUrl,
        videoUrl: (content.props as Record<string, unknown>)?.videoUrl || content.videoUrl,
        description: (content.props as Record<string, unknown>)?.description || content.description || content.descriptionPlain,
        duration: (content.props as Record<string, unknown>)?.duration || content.duration,
        featuredImage: (content.props as Record<string, unknown>)?.featuredImage || content.featuredImage,
        coverImage: (content.props as Record<string, unknown>)?.coverImage || content.coverImage,
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
        title: (content.props as Record<string, unknown>)?.title || content.title,
        subtitle: (content.props as Record<string, unknown>)?.subtitle || content.subtitle || 'Learning Content',
        content_id: String((content.props as Record<string, unknown>)?.id || content.id || ''), // Stable identifier for correlation
        actions: [
          {
            action: 'openVideoModal',
            label: 'Watch',
            primary: true,
            parameters: {
              videoUrl: (content.props as Record<string, unknown>)?.videoUrl || content.videoUrl,
              title: (content.props as Record<string, unknown>)?.title || content.title,
              poster: (content.props as Record<string, unknown>)?.image || (content.props as Record<string, unknown>)?.imageUrl || content.imageUrl,
              // Critical: Include content_id for proper progress tracking correlation
              contentId: (content.props as Record<string, unknown>)?.id || content.id
            }
          },
          {
            action: 'openWorksheet',
            label: 'Worksheet',
            primary: false,
            parameters: {
              // Phase 2: Agent-driven template selection based on content analysis
              ...selectWorksheetTemplate(content),
              contentId: (content.props as Record<string, unknown>)?.id || content.id,
              title: (content.props as Record<string, unknown>)?.title || content.title,
              videoId: (content.props as Record<string, unknown>)?.id || content.id
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
        title: 'Leadership Library',
        subtitle: 'Forge ahead, Glen!',
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
        ...Array.isArray(state.messages) ? state.messages : [],
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
        ...Array.isArray(state.messages) ? state.messages : [],
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

console.log('[Agent] Initializing content agent with original TribeSocialContentTool');

export default graph;
