import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../../../packages/env';

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
  tenantKey: string;
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
  private authHeaders?: Record<string, string>;

  constructor(supabaseUrl: string, supabaseKey: string, langGraphUrl: string = 'http://localhost:8000', authHeaders?: Record<string, string>) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.langGraphUrl = langGraphUrl;
    this.authHeaders = authHeaders;
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
   * Enrich content with progress data from database
   */
  private async enrichWithProgressData(content: any, userId: string, tenantKey: string): Promise<any> {
    try {
      // First, extract all content IDs from the schema
      const contentIds: string[] = [];

      const collectContentIds = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(collectContentIds);
        } else if (obj && typeof obj === 'object') {
          if (obj.type === 'Card' && obj.config?.title) {
            contentIds.push(obj.config.title);
          }
          Object.values(obj).forEach(collectContentIds);
        }
      };

      collectContentIds(content);

      // Batch fetch progress data if we have content IDs
      let progressMap: Record<string, any> = {};
      if (contentIds.length > 0) {
        console.log(`[AgentService] Batch fetching progress for ${contentIds.length} content items:`, contentIds);
        try {
          // Use new optimized batch progress API (reduces 19 queries to 1)
          // Fix: Use absolute URL for server-side fetch calls
          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NODE_ENV === 'production'
              ? 'https://leaderforge.vercel.app'
              : 'http://localhost:3000';

          // Prepare headers including authentication
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          // Forward authentication headers if available
          if (this.authHeaders) {
            Object.assign(headers, this.authHeaders);
          }

          const response = await fetch(`${baseUrl}/api/user/${userId}/progress-batch`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              contentIds,
              contextKey: tenantKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            progressMap = data.progress || {};
            console.log(`[AgentService] Successfully fetched progress for ${Object.keys(progressMap).length} items`);
          } else {
            console.warn(`[AgentService] Batch progress API failed:`, response.status);
            progressMap = {};
          }
        } catch (error) {
          console.warn(`[AgentService] Batch progress fetch failed:`, error);
          // Continue with empty progress map - don't fail the entire enrichment
          progressMap = {};
        }
      }

      // Helper function to enrich a single card with progress
      const enrichCard = (card: any) => {
        // Updated for Universal Widget Schema format
        if (card.type === 'Card' && card.config?.title && card.data?.videoUrl) {
          const progressData = progressMap[card.config.title];
          return {
            ...card,
            data: {
              ...card.data,
              // Replace random/placeholder progress with real data
              progress: progressData?.progress_percentage || 0,
              value: progressData?.progress_percentage || 0,
              stats: {
                ...card.data.stats,
                watched: (progressData?.progress_percentage || 0) >= 90,
                // Fix: Worksheet completion should not be tied to video progress
                // Worksheets are not implemented yet, so always false
                completed: false, // TODO: Implement actual worksheet tracking
                lastWatched: progressData?.last_viewed_at || null
              }
            }
          };
        }
        return card;
      };

      // Recursively enrich content structure
      const enrichContent = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(enrichContent);
        }

        if (obj && typeof obj === 'object') {
          if (obj.type === 'Card') {
            return enrichCard(obj);
          }

          // Handle Grid components with items (Universal Widget Schema format)
          if (obj.type === 'Grid' && obj.data?.items) {
            return {
              ...obj,
              data: {
                ...obj.data,
                items: obj.data.items.map(enrichContent)
              }
            };
          }

          // Recursively process other object properties
          const enrichedObj: any = {};
          for (const [key, value] of Object.entries(obj)) {
            enrichedObj[key] = enrichContent(value);
          }
          return enrichedObj;
        }

        return obj;
      };

      return enrichContent(content);
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
      // Detect if using LangGraph Cloud or local server
      const isCloudDeployment = this.langGraphUrl.includes('langchain.app');

      if (isCloudDeployment) {
        return this.invokeLangGraphCloud(agent, request, startTime);
      } else {
        return this.invokeLangGraphLocal(agent, request, startTime);
      }

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[AgentService] LangGraph invocation error after ${totalTime}ms:`, error);

      // Try fallback content if LangGraph fails
      console.warn(`[AgentService] LangGraph failed, attempting fallback for agent: ${agent.name}`);
      return this.getLangGraphFallbackContent(agent, request);
    }
  }

  /**
   * Invoke LangGraph Cloud deployment
   */
  private async invokeLangGraphCloud(
    agent: Agent,
    request: AgentInvocationRequest,
    startTime: number
  ): Promise<AgentInvocationResponse> {
    const apiKey = process.env.LANGCHAIN_API_KEY || process.env.LANGSMITH_API_KEY;

    if (!apiKey) {
      throw new Error('LANGCHAIN_API_KEY or LANGSMITH_API_KEY required for LangGraph Cloud');
    }

    // LangGraph Cloud uses the SDK pattern
    const runResponse = await fetch(`${this.langGraphUrl}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        assistant_id: 'content_agent', // From langgraph.json
        input: {
          messages: [{
            role: 'user',
            content: request.message
          }],
          userId: request.userId,
          tenantKey: request.tenantKey,
          navOptionId: request.navOptionId,
          agentConfig: agent.config
        }
      })
    });

    if (!runResponse.ok) {
      throw new Error(`LangGraph Cloud invocation failed: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    console.log(`[AgentService] Created LangGraph Cloud run: ${runId}, waiting for completion...`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 20;
    let pollInterval = 500; // Cloud might be slower than local

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${this.langGraphUrl}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }

      const runStatus = await statusResponse.json();
      console.log(`[AgentService] Cloud run ${runId} status: ${runStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);

      if (runStatus.status === 'success') {
        const totalTime = Date.now() - startTime;
        console.log(`[AgentService] LangGraph Cloud completed successfully in ${totalTime}ms`);

        // Extract the result from the Cloud response
        const finalResult = runStatus.output || runStatus.data;
        const enrichedContent = await this.enrichWithProgressData(finalResult, request.userId, request.tenantKey);

        return {
          type: 'content_schema',
          content: enrichedContent,
          metadata: {
            runId: runId,
            agentId: agent.id,
            agentName: agent.name,
            executionTime: totalTime,
            platform: 'langgraph-cloud'
          }
        };
      } else if (runStatus.status === 'error') {
        throw new Error(`LangGraph Cloud run failed: ${runStatus.error || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }

    throw new Error(`LangGraph Cloud run timed out after ${maxAttempts} attempts`);
  }

  /**
   * Invoke local LangGraph server (for development)
   */
  private async invokeLangGraphLocal(
    agent: Agent,
    request: AgentInvocationRequest,
    startTime: number
  ): Promise<AgentInvocationResponse> {
    // Check if LangGraph service is available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const healthCheck = await fetch(`${this.langGraphUrl}/`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() => null).finally(() => clearTimeout(timeoutId));

    if (!healthCheck || !healthCheck.ok) {
      console.warn(`[AgentService] LangGraph service unavailable at ${this.langGraphUrl}, using fallback content`);
      throw new Error('Local LangGraph service unavailable');
    }

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
          tenantKey: request.tenantKey,
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
    const maxAttempts = 20;
    let pollInterval = 200;
    const maxPollInterval = 2000;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${this.langGraphUrl}/threads/${thread.thread_id}/runs/${runId}`);

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }

      const runStatus = await statusResponse.json();
      console.log(`[AgentService] Run ${runId} status: ${runStatus.status} (attempt ${attempts + 1}/${maxAttempts})`);

      if (runStatus.status === 'success') {
        const stateResponse = await fetch(`${this.langGraphUrl}/threads/${thread.thread_id}/state`);

        if (!stateResponse.ok) {
          throw new Error(`Failed to get thread state: ${stateResponse.statusText}`);
        }

        const state = await stateResponse.json();
        const totalTime = Date.now() - startTime;
        console.log(`[AgentService] LangGraph completed successfully in ${totalTime}ms, final state:`, state);

        const finalResult = state.values?.schema || state.values?.messages?.[state.values.messages?.length - 1] || state.values;
        const enrichedContent = await this.enrichWithProgressData(finalResult, request.userId, request.tenantKey);

        return {
          type: 'content_schema',
          content: enrichedContent,
          metadata: {
            threadId: thread.thread_id,
            runId: runId,
            agentId: agent.id,
            agentName: agent.name,
            executionTime: totalTime,
            platform: 'langgraph-local'
          }
        };
      } else if (runStatus.status === 'error') {
        throw new Error(`LangGraph run failed: ${runStatus.error || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval + Math.random() * 100));
      pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
      attempts++;
    }

    const totalTime = Date.now() - startTime;
    throw new Error(`LangGraph run timed out after ${totalTime}ms (${maxAttempts} attempts)`);
  }

  /**
   * Get fallback content when LangGraph service is unavailable
   */
  private async getLangGraphFallbackContent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    console.log(`[AgentService] Generating fallback content for agent: ${agent.name}`);

    // Generate appropriate fallback content based on tenant and nav context
    const tenantConfig = {
      leaderforge: {
        name: 'LeaderForge',
        primaryColor: '#667eea',
        description: 'Leadership development content',
      },
      brilliant: {
        name: 'Brilliant Perspectives',
        primaryColor: '#764ba2',
        description: 'Strategic insights and analysis',
      }
    };

    const config = tenantConfig[request.tenantKey as keyof typeof tenantConfig] || tenantConfig.leaderforge;

    const fallbackContent = {
      type: 'content_schema',
      data: {
        components: [
          {
            type: 'Grid',
            config: {
              columns: { default: 1, md: 2, lg: 3 },
              gap: 6
            },
            data: {
              items: [
                {
                  type: 'Card',
                  config: {
                    title: 'Service Temporarily Unavailable',
                    variant: 'elevated',
                    maxWidth: '400px'
                  },
                  data: {
                    description: `The ${config.name} content service is currently being prepared for you.`,
                    action: {
                      label: 'Try Again',
                      variant: 'primary',
                      onClick: 'reload'
                    },
                    stats: {
                      status: 'pending',
                      message: 'Content service initializing...'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };

    // Return the fallback content with enrichment
    const enrichedContent = await this.enrichWithProgressData(fallbackContent, request.userId, request.tenantKey);

    return {
      type: 'content_schema',
      content: enrichedContent,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        fallback: true,
        reason: 'LangGraph service unavailable'
      }
    };
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
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  ENV.LANGGRAPH_API_URL
);