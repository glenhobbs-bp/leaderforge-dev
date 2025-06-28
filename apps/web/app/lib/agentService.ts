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
   * Set authentication headers for server-side API calls
   */
  setAuthHeaders(authHeaders: Record<string, string>): void {
    this.authHeaders = authHeaders;
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
  private async enrichWithProgressData(content: any, userId: string): Promise<any> {
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

      // Batch fetch progress data directly from database (no server-to-server call)
      let progressMap: Record<string, any> = {};
      if (contentIds.length > 0) {
        console.log(`[AgentService] Batch fetching progress for ${contentIds.length} content items:`, contentIds);
        try {
          // Direct database query using authenticated Supabase client (more efficient)
          const { data: progressData, error: queryError } = await this.supabase
            .schema('core')
            .from('user_progress')
            .select('content_id, progress_percentage, metadata, last_viewed_at, completed_at, started_at')
            .eq('user_id', userId)
            .in('content_id', contentIds);

          if (queryError) {
            console.warn(`[AgentService] Progress query failed:`, queryError);
            progressMap = {};
          } else {
            // Transform to expected format
            progressData?.forEach((item) => {
              progressMap[item.content_id] = {
                progress_percentage: item.progress_percentage,
                metadata: item.metadata,
                last_viewed_at: item.last_viewed_at,
                completed_at: item.completed_at,
                started_at: item.started_at,
                lastUpdated: item.last_viewed_at
              };
            });
            console.log(`[AgentService] Successfully fetched progress for ${progressData?.length || 0} items`);
          }
        } catch (error) {
          console.warn(`[AgentService] Progress fetch failed:`, error);
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
   * Invoke LangGraph agent (unified for all deployments - Render service)
   */
  private async invokeLangGraphAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    const startTime = Date.now();
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      console.log(`[AgentService] Invoking langgraph agent: ${agent.id}`);
      console.log(`[AgentService] Attempting to connect to LangGraph service at: ${this.langGraphUrl}`);
    }

    try {
      // Health check first
      const healthResponse = await fetch(`${this.langGraphUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...this.authHeaders
        }
      });

      if (!healthResponse.ok) {
        throw new Error(`LangGraph service health check failed: ${healthResponse.status}`);
      }

      if (isDev) {
        console.log(`[AgentService] LangGraph service health check passed at ${this.langGraphUrl}`);
      }

      // Create a new thread for this run
      const threadId = `thread_${Date.now()}`;
      const runId = `run_${Date.now()}`;

      const requestBody = {
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
      };

      // Execute run directly (simplified pattern that works with our deployment)
      const runResponse = await fetch(`${this.langGraphUrl}/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.authHeaders
        },
        body: JSON.stringify(requestBody)
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`Failed to execute LangGraph run: ${runResponse.status} - ${errorText}`);
      }

      const runResult = await runResponse.json();
      const executionTime = Date.now() - parseInt(threadId.split('_')[1]);

      if (isDev) {
        console.log(`[AgentService] LangGraph execution completed in ${executionTime}ms:`, runResult.status);
      }

      if (runResult.status === 'success') {
        // Extract schema from result
        const responseData = runResult.result || runResult.values || {};
        const schema = responseData.schema;
        const agentName = responseData.agentName || agent.id;

        if (isDev) {
          console.log(`[AgentService] LangGraph completed successfully, final state:`, responseData);
          console.log(`[AgentService] Response format detected:`, runResult.result ? 'result' : runResult.values ? 'values' : 'unknown');
        }

        if (!schema) {
          console.warn(`[AgentService] No schema found in LangGraph response. Response structure:`, JSON.stringify(runResult, null, 2));
          throw new Error('LangGraph agent completed successfully but returned no schema');
        }

        // Enrich schema with user progress data
        const enrichedContent = await this.enrichWithProgressData(schema, request.userId);

        return {
          type: 'content_schema',
          content: enrichedContent,
          metadata: {
            threadId,
            runId: runResult.run_id || `run_${Date.now()}`,
            agentId: agent.id,
            agentName,
            executionTime,
            platform: 'langgraph-render',
            responseFormat: runResult.result ? 'result' : 'values'
          }
        };
      } else if (runResult.status === 'error') {
        throw new Error(`LangGraph run failed: ${runResult.error || 'Unknown error'}`);
      } else {
        throw new Error(`LangGraph run returned unexpected status: ${runResult.status}`);
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
    const enrichedContent = await this.enrichWithProgressData(fallbackContent, request.userId);

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

// Lazy singleton getter to avoid build-time environment variable access
let _agentServiceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!_agentServiceInstance) {
    // Add debug logging here before creating the service
    console.log('[AgentService] Creating singleton instance...');

    try {
      _agentServiceInstance = new AgentService(
        ENV.SUPABASE_URL,
        ENV.SUPABASE_SERVICE_ROLE_KEY,
        ENV.LANGGRAPH_API_URL
      );
      console.log('[AgentService] Singleton instance created successfully');
    } catch (error) {
      console.error('[AgentService] Failed to create singleton instance:', error);
      throw error;
    }
  }
  return _agentServiceInstance;
}

// Legacy export for backward compatibility - use getAgentService() instead
export const agentService = {
  get instance() {
    return getAgentService();
  }
};