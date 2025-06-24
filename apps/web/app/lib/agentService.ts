import { createClient } from '@supabase/supabase-js';
import { UserProgressTool, SupabaseUserProgressRepository } from '../../../../packages/agent-core/tools/UserProgressTool';

/**
 * AgentService - Central service for invoking agents based on type
 * Follows the agent-native architecture where agents are registered in core.agents table
 * and invoked based on their type (llm, langgraph, tool, workflow)
 */

export interface Agent {
  id: string;
  name: string;
  display_name: string | null;
  type: 'llm' | 'langgraph' | 'tool' | 'workflow';
  prompt: string | null;
  tools: string[] | null;
  model: string | null;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AgentInvocationRequest {
  message: string;
  userId: string;
  contextKey: string;
  navOptionId?: string;
  metadata?: Record<string, any>;
}

export interface AgentInvocationResponse {
  type: string;
  content: any;
  metadata?: Record<string, any>;
}

export class AgentService {
  private supabase: any; // Using any to avoid schema typing issues
  private langGraphUrl: string;

  constructor(supabaseUrl: string, supabaseKey: string, langGraphUrl: string = 'http://localhost:8000') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.langGraphUrl = langGraphUrl;
  }

  /**
   * Get agent by ID from database
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('[AgentService] Error fetching agent:', error);
      return null;
    }

    return data as Agent;
  }

  /**
   * Invoke agent based on its type
   */
  async invokeAgent(
    agentId: string,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    const agent = await this.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    console.log(`[AgentService] Invoking ${agent.type} agent: ${agent.name}`);

    switch (agent.type) {
      case 'langgraph':
        return this.invokeLangGraphAgent(agent, request);

      case 'llm':
        return this.invokeLLMAgent(agent, request);

      case 'tool':
        return this.invokeToolAgent(agent, request);

      case 'workflow':
        return this.invokeWorkflowAgent(agent, request);

      default:
        throw new Error(`Unsupported agent type: ${agent.type}`);
    }
  }

  /**
   * Enrich agent response content with user progress data
   */
  private async enrichWithProgressData(content: any, userId: string, contextKey: string): Promise<any> {
    if (!content || typeof content !== 'object') {
      return content;
    }

    try {
      const progressRepository = new SupabaseUserProgressRepository(this.supabase);
      const progressTool = new UserProgressTool(progressRepository);

      // Helper function to enrich a single card with progress
      const enrichCard = async (card: any) => {
        if (card.type === 'Card' && card.props?.title && card.props?.videoUrl) {
          try {
            const progressData = await progressTool.getProgress(userId, card.props.title, contextKey);
            return {
              ...card,
              props: {
                ...card.props,
                progress: progressData?.progress_percentage || 0,
                videoWatched: (progressData?.progress_percentage || 0) >= 90
              }
            };
          } catch (error) {
            console.warn(`[AgentService] Failed to fetch progress for ${card.props.title}:`, error);
            return card; // Return original card on error
          }
        }
        return card;
      };

      // Recursively enrich content structure
      const enrichContent = async (obj: any): Promise<any> => {
        if (Array.isArray(obj)) {
          return Promise.all(obj.map(enrichContent));
        }

        if (obj && typeof obj === 'object') {
          if (obj.type === 'Card') {
            return enrichCard(obj);
          }

          // Handle Grid components with items
          if (obj.type === 'Grid' && obj.props?.items) {
            return {
              ...obj,
              props: {
                ...obj.props,
                items: await Promise.all(obj.props.items.map(enrichContent))
              }
            };
          }

          // Recursively process other object properties
          const enrichedObj: any = {};
          for (const [key, value] of Object.entries(obj)) {
            enrichedObj[key] = await enrichContent(value);
          }
          return enrichedObj;
        }

        return obj;
      };

      return await enrichContent(content);
    } catch (error) {
      console.error('[AgentService] Error enriching with progress data:', error);
      return content; // Return original content on error
    }
  }

  /**
   * Invoke LangGraph agent via HTTP API
   */
  private async invokeLangGraphAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    const startTime = Date.now();

    try {
      // Create thread
      const threadResponse = await fetch(`${this.langGraphUrl}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${threadResponse.statusText}`);
      }

      const thread = await threadResponse.json();

      // Send message to LangGraph
      const invokeResponse = await fetch(`${this.langGraphUrl}/threads/${thread.thread_id}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: 'default', // LangGraph graph ID
          input: {
            messages: [{
              role: 'user',
              content: request.message
            }],
            // Flatten context to root level for easier access in agent
            userId: request.userId,
            contextKey: request.contextKey,
            navOptionId: request.navOptionId,
            agentConfig: agent.config
          }
        })
      });

      if (!invokeResponse.ok) {
        throw new Error(`LangGraph invocation failed: ${invokeResponse.statusText}`);
      }

      const runResponse = await invokeResponse.json();
      const runId = runResponse.run_id;

      console.log(`[AgentService] Created LangGraph run: ${runId}, waiting for completion...`);

      // Optimized polling with exponential backoff
      let attempts = 0;
      const maxAttempts = 20; // Reduced from 30
      let pollInterval = 200; // Start with 200ms
      const maxPollInterval = 2000; // Max 2 seconds

      while (attempts < maxAttempts) {
        // Check run status
        const statusResponse = await fetch(`${this.langGraphUrl}/threads/${thread.thread_id}/runs/${runId}`);

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const runStatus = await statusResponse.json();
        console.log(`[AgentService] Run ${runId} status: ${runStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (runStatus.status === 'success') {
          // Get the final state
          const stateResponse = await fetch(`${this.langGraphUrl}/threads/${thread.thread_id}/state`);

          if (!stateResponse.ok) {
            throw new Error(`Failed to get thread state: ${stateResponse.statusText}`);
          }

          const state = await stateResponse.json();
          const totalTime = Date.now() - startTime;
          console.log(`[AgentService] LangGraph completed successfully in ${totalTime}ms, final state:`, state);

          // Extract the schema from the final state
          const finalResult = state.values?.schema || state.values?.messages?.[state.values.messages?.length - 1] || state.values;

          const enrichedContent = await this.enrichWithProgressData(finalResult, request.userId, request.contextKey);

          return {
            type: 'content_schema',
            content: enrichedContent,
            metadata: {
              threadId: thread.thread_id,
              runId: runId,
              agentId: agent.id,
              agentName: agent.name,
              executionTime: totalTime
            }
          };
        } else if (runStatus.status === 'error') {
          throw new Error(`LangGraph run failed: ${runStatus.error || 'Unknown error'}`);
        }

        // Exponential backoff with jitter
        await new Promise(resolve => setTimeout(resolve, pollInterval + Math.random() * 100));
        pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
        attempts++;
      }

      const totalTime = Date.now() - startTime;
      throw new Error(`LangGraph run timed out after ${totalTime}ms (${maxAttempts} attempts)`);

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[AgentService] LangGraph invocation error after ${totalTime}ms:`, error);
      throw new Error(`LangGraph agent failed: ${error.message}`);
    }
  }

  /**
   * Invoke simple LLM agent (single prompt + tools)
   */
  private async invokeLLMAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    // TODO: Implement direct LLM invocation with prompt and tools
    // This would use Claude/OpenAI directly with the agent's prompt and tools
    throw new Error('LLM agent type not yet implemented');
  }

  /**
   * Invoke tool agent (direct tool execution)
   */
  private async invokeToolAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    // TODO: Implement direct tool invocation
    // This would execute tools directly without LLM orchestration
    throw new Error('Tool agent type not yet implemented');
  }

  /**
   * Invoke workflow agent (custom workflow)
   */
  private async invokeWorkflowAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    // TODO: Implement custom workflow execution
    // This would handle complex multi-step workflows
    throw new Error('Workflow agent type not yet implemented');
  }
}

// Singleton instance for the application
export const agentService = new AgentService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.LANGGRAPH_URL || 'http://localhost:8000'
);