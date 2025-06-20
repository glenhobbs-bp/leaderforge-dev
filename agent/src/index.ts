import "dotenv/config";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { TribeSocialContentTool } from "../../packages/agent-core/tools/TribeSocialContentTool";

// Initialize tools
const tribeContentTool = new TribeSocialContentTool();

// Define the agent state
const ContentAgentState = Annotation.Root({
  userId: Annotation<string>(),
  contextKey: Annotation<string>(),
  navOptionId: Annotation<string>(),
  intent: Annotation<any>(),
  contentList: Annotation<any[]>(),
  schema: Annotation<any>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

type ContentState = typeof ContentAgentState.State;

// Content fetching node
async function fetchContent(state: ContentState): Promise<Partial<ContentState>> {
  console.log('[ContentAgent] Fetching content for context:', state.contextKey);

  try {
    // Use TribeSocialContentTool to get real content
    const contentList = await tribeContentTool.getContentForContext(state.contextKey || 'leaderforge');

    console.log('[ContentAgent] Retrieved content count:', contentList?.length || 0);

    // Transform to proper ComponentSchema Grid format
    const schema = {
      type: 'Grid',
      props: {
        columns: 3,
        items: (contentList || []).map((content: any) => {
          // Extract props from TribeSocialContentTool response structure
          const props = content.props || content;

          return {
            type: 'Card',
            props: {
              title: props.title || props.name || 'Untitled',
              description: props.description || props.shortDescription || '',
              image: props.image || props.thumbnail || props.featuredImage || '/placeholder.png',
              videoUrl: props.videoUrl || props.url || props.link,
              publishedDate: props.publishedDate || props.createdAt,
              duration: props.duration,
              progress: props.progress || 0,
              actions: [{
                action: 'openVideoModal',
                label: 'Watch Video',
                videoUrl: props.videoUrl || props.url || props.link,
                title: props.title || props.name || 'Untitled'
              }]
            }
          };
        })
      }
    };

    return {
      contentList,
      schema
    };
  } catch (error) {
    console.error('[ContentAgent] Error fetching content:', error);

    // Return fallback schema on error
    return {
      contentList: [],
      schema: {
        type: 'Grid',
        props: {
          columns: 3,
          items: []
        }
      }
    };
  }
}

// Create the content library agent graph
const graph = new StateGraph(ContentAgentState)
  .addNode("fetchContent", fetchContent)
  .addEdge(START, "fetchContent")
  .addEdge("fetchContent", END)
  .compile();

// Export as default for LangGraph CLI
export default graph;
