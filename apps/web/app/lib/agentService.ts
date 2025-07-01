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
  type: 'llm' | 'langgraph' | 'tool' | 'workflow' | 'mockup';
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

  constructor(supabase: any, langGraphUrl: string = ENV.LANGGRAPH_API_URL, authHeaders?: Record<string, string>) {
    this.supabase = supabase; // ✅ Accept user-authenticated client, not service role
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

      case 'mockup':
        return this.invokeMockupAgent(agent, request);

      default:
        throw new Error(`Unsupported agent type: ${agent.type}`);
    }
  }

  /**
   * Enrich content with progress data from database using content_id (ADR-0011 Phase 1)
   */
  private async enrichWithProgressData(content: any, userId: string): Promise<any> {
    try {
      // Step 1: Extract content_ids for batch processing
      const contentIds: string[] = [];

      const collectContentIds = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(collectContentIds);
        } else if (obj && typeof obj === 'object') {
          if (obj.type === 'Card' && obj.config?.content_id) {
            contentIds.push(obj.config.content_id);
          }
          Object.values(obj).forEach(collectContentIds);
        }
      };

      collectContentIds(content);

      if (contentIds.length === 0) {
        return content;
      }

      console.log(`[AgentService] Batch fetching progress and worksheet completions for ${contentIds.length} content items:`, contentIds);

      // Step 2: Fetch progress and worksheet data in parallel using content_id
      let progressMap: Record<string, any> = {};
      let worksheetMap: Record<string, boolean> = {};

      try {
        const [progressResult, worksheetResult] = await Promise.all([
          // Video progress using content_id (direct content_id matching)
          this.supabase
            .schema('core')
            .from('user_progress')
            .select('content_id, progress_percentage, metadata, last_viewed_at, completed_at, started_at')
            .eq('user_id', userId)
            .in('content_id', contentIds),

          // Worksheet completions using content_id (Phase 1 approach)
          this.supabase
            .schema('core')
            .from('universal_inputs')
            .select('content_id, input_data, source_context')
            .eq('user_id', userId)
            .eq('input_type', 'form')
            .eq('status', 'completed')
            .not('content_id', 'is', null)
        ]);

        // Process video progress data
        if (progressResult.error) {
          console.warn(`[AgentService] Progress query failed:`, progressResult.error);
        } else if (progressResult.data) {
          progressResult.data.forEach((item) => {
            progressMap[item.content_id] = {
              progress_percentage: item.progress_percentage,
              metadata: item.metadata,
              last_viewed_at: item.last_viewed_at,
              completed_at: item.completed_at,
              started_at: item.started_at,
              lastUpdated: item.last_viewed_at
            };
          });
          console.log(`[AgentService] Successfully fetched progress for ${progressResult.data?.length || 0} items`);
        }

        // Process worksheet completion data
        if (worksheetResult.error) {
          console.warn(`[AgentService] Worksheet query failed:`, worksheetResult.error);
        } else if (worksheetResult.data) {
          // Debug worksheet data
          worksheetResult.data.forEach(item => {
            const videoIdFromData = item.input_data?.video_id;
            const videoIdFromContext = item.source_context?.match(/video-reflection:([^:]+)/)?.[1];

            console.log(`[AgentService] Found worksheet submission:`, {
              videoIdFromData,
              videoIdFromContext,
              source_context: item.source_context
            });
          });

          // Collect all completed content_ids
          const completedContentIds = new Set(
            worksheetResult.data
              .map(item => item.content_id)
              .filter(Boolean)
          );

          console.log(`[AgentService] Successfully checked worksheet completions for ${worksheetResult.data?.length || 0} submissions`);
          console.log(`[AgentService] Completed content IDs found:`, Array.from(completedContentIds));

          // Map worksheet completions by content_id
          contentIds.forEach(contentId => {
            worksheetMap[contentId] = completedContentIds.has(contentId);
          });
        }
      } catch (error) {
        console.warn(`[AgentService] Progress/worksheet fetch failed:`, error);
        progressMap = {};
        worksheetMap = {};
      }

      console.log(`[AgentService] Worksheet completion map:`, worksheetMap);

      // Step 3: Enrich content with progress and worksheet data
      const enrichCard = (card: any) => {
        if (card.type === 'Card') {
          // Extract content_id from config or action parameters (fallback)
          let contentId = card.config?.content_id;

          // If content_id is missing from config, try to extract from action parameters
          if (!contentId && card.config?.actions) {
            for (const action of card.config.actions) {
              if (action.parameters?.contentId) {
                contentId = action.parameters.contentId;
                break;
              }
            }
          }

          if (contentId) {
            const progressData = progressMap[contentId];
            const worksheetCompleted = worksheetMap[contentId] || false;

            return {
              ...card,
              config: {
                ...card.config,
                content_id: contentId, // Ensure content_id is in config
              },
              data: {
                ...card.data,
                // Real progress data using content_id (Phase 1)
                progress: progressData?.progress_percentage || 0,
                value: progressData?.progress_percentage || 0,
                stats: {
                  ...card.data.stats,
                  watched: (progressData?.progress_percentage || 0) >= 90,
                  // Real worksheet completion status using content_id correlation
                  completed: worksheetCompleted,
                  lastWatched: progressData?.last_viewed_at || null
                }
              }
            };
          }
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
   * ✅ GRACEFUL FALLBACK: Returns informative content instead of crashing
   */
  private async invokeLLMAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    console.log(`[AgentService] LLM agent type not yet implemented for agent: ${agent.name}`);

    return this.createNotImplementedResponse(agent, request, 'LLM',
      'Direct LLM agents will provide single-step AI interactions using prompts and tools.');
  }

  /**
   * Invoke tool agent (direct tool execution)
   * ✅ GRACEFUL FALLBACK: Returns informative content instead of crashing
   */
  private async invokeToolAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    console.log(`[AgentService] Tool agent type not yet implemented for agent: ${agent.name}`);

    return this.createNotImplementedResponse(agent, request, 'Tool',
      'Tool agents will execute specific functions directly without LLM orchestration.');
  }

  /**
   * Invoke workflow agent (custom workflow)
   * ✅ GRACEFUL FALLBACK: Returns informative content instead of crashing
   */
  private async invokeWorkflowAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    console.log(`[AgentService] Workflow agent type not yet implemented for agent: ${agent.name}`);

    return this.createNotImplementedResponse(agent, request, 'Workflow',
      'Workflow agents will handle complex multi-step business processes and automations.');
  }

  /**
   * Invoke mockup agent - returns schema for rendering JSX mockup components
   * ✅ AGENT-NATIVE MOCKUPS: Renders mockup components through ContentPanel
   */
  private async invokeMockupAgent(
    agent: Agent,
    request: AgentInvocationRequest
  ): Promise<AgentInvocationResponse> {
    console.log(`[AgentService] Invoking mockup agent: ${agent.name}`);

    // Extract component name from agent config
    const componentName = agent.config?.component;
    if (!componentName) {
      throw new Error(`Mockup agent ${agent.name} missing component config`);
    }

    // Return schema that tells the frontend to render the mockup component
    return {
      type: 'mockup',
      content: {
        component: componentName,
        title: `Mockup: ${agent.name}`,
        subtitle: 'Interactive prototype for UX validation',
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          componentName,
          timestamp: new Date().toISOString()
        }
      },
      metadata: {
        agentType: 'mockup',
        executionTime: Date.now(),
        userId: request.userId,
        tenantKey: request.tenantKey
      }
    };
  }

  /**
   * Create a user-friendly "not implemented" response
   * ✅ GRACEFUL DEGRADATION: Informative UI instead of error crashes
   */
  private async createNotImplementedResponse(
    agent: Agent,
    request: AgentInvocationRequest,
    agentType: string,
    description: string
  ): Promise<AgentInvocationResponse> {
    const fallbackContent = {
      type: 'content_schema',
      data: {
        components: [
          {
            type: 'Grid',
            config: {
              columns: { default: 1 },
              gap: 4
            },
            data: {
              items: [
                {
                  type: 'Card',
                  config: {
                    title: `${agentType} Agent - Coming Soon`,
                    variant: 'outlined',
                    maxWidth: '600px'
                  },
                  data: {
                    description: `The ${agent.display_name || agent.name} agent uses the ${agentType.toLowerCase()} type, which is planned but not yet implemented.`,
                    content: [
                      {
                        type: 'text',
                        content: description
                      },
                      {
                        type: 'text',
                        content: `Agent: ${agent.name} (${agentType} type)`
                      }
                    ],
                    action: {
                      label: 'Notify When Ready',
                      variant: 'secondary',
                      disabled: true
                    },
                    stats: {
                      status: 'planned',
                      message: `${agentType} agents are in development`
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };

    // Apply progress enrichment even to fallback content
    const enrichedContent = await this.enrichWithProgressData(fallbackContent, request.userId);

    return {
      type: 'content_schema',
      content: enrichedContent,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        agentType,
        implemented: false,
        plannedFeature: true,
        message: `${agentType} agent type is planned but not yet implemented`
      }
    };
  }
}

// Lazy singleton getter to avoid build-time environment variable access
let _agentServiceInstance: AgentService | null = null;

// ❌ REMOVED: This pattern violated SSR architecture by using service role
// AgentService now requires a user-authenticated Supabase client
// Use createAgentService(supabase) instead where supabase is from SSR auth

export function createAgentService(supabase: any): AgentService {
  return new AgentService(
    supabase, // ✅ User-authenticated client from SSR
    ENV.LANGGRAPH_API_URL
  );
}

// ❌ REMOVED: Legacy singleton pattern violated SSR architecture
// Use createAgentService(supabase) instead with user-authenticated client