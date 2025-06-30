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

  constructor(supabase: any, langGraphUrl: string = 'http://localhost:8000', authHeaders?: Record<string, string>) {
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
   * Enrich content with progress data from database
   */
  private async enrichWithProgressData(content: any, userId: string): Promise<any> {
    try {
      // First, extract all content IDs from the schema
      const contentIds: string[] = [];
      const videoIdToTitleMap: Record<string, string> = {}; // Map video IDs to content titles

      const collectContentIds = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(collectContentIds);
        } else if (obj && typeof obj === 'object') {
          if (obj.type === 'Card' && obj.config?.title) {
            const title = obj.config.title;
            contentIds.push(title);

            // Extract video ID from card data for worksheet matching
            if (obj.data?.videoUrl) {
              // Try to extract video ID from videoUrl
              const videoUrl = obj.data.videoUrl;
              let videoId = null;

              // Extract from various URL patterns
              if (typeof videoUrl === 'string') {
                // Pattern 1: Direct video ID
                if (!videoUrl.includes('/') && !videoUrl.includes('http')) {
                  videoId = videoUrl;
                }
                // Pattern 2: URL with ID parameter
                else if (videoUrl.includes('?id=')) {
                  const match = videoUrl.match(/[?&]id=([^&]+)/);
                  if (match) videoId = match[1];
                }
                // Pattern 3: URL with video ID at end
                else {
                  const urlParts = videoUrl.split('/');
                  const lastPart = urlParts[urlParts.length - 1];
                  if (lastPart && lastPart !== '' && !lastPart.includes('.')) {
                    videoId = lastPart.split('?')[0]; // Remove query params
                  }
                }
              }

              // Also check if there's a direct videoId field
              if (!videoId && obj.data.videoId) {
                videoId = obj.data.videoId;
              }

              if (videoId) {
                videoIdToTitleMap[videoId] = title;
                console.log(`[AgentService] Mapped video ID "${videoId}" to title "${title}"`);
              }
            }
          }
          Object.values(obj).forEach(collectContentIds);
        }
      };

      collectContentIds(content);

      // Batch fetch both progress data and worksheet completions in parallel
      let progressMap: Record<string, any> = {};
      let worksheetMap: Record<string, boolean> = {};

      if (contentIds.length > 0) {
        console.log(`[AgentService] Batch fetching progress and worksheet completions for ${contentIds.length} content items:`, contentIds);

        try {
          // Fetch video progress and worksheet completions in parallel
          const [progressResult, worksheetResult] = await Promise.all([
            // Video progress from user_progress table
            this.supabase
              .schema('core')
              .from('user_progress')
              .select('content_id, progress_percentage, metadata, last_viewed_at, completed_at, started_at')
              .eq('user_id', userId)
              .in('content_id', contentIds),

            // Query for worksheet completions for all content IDs
            this.supabase
              .schema('core')
              .from('universal_inputs')
              .select('input_data, source_context')
              .eq('user_id', userId)
              .eq('input_type', 'form')
              .like('source_context', 'worksheet:video-reflection:%')
              .eq('status', 'completed')
          ]);

          // Process video progress data
          if (progressResult.error) {
            console.warn(`[AgentService] Progress query failed:`, progressResult.error);
            progressMap = {};
          } else {
            progressResult.data?.forEach((item) => {
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
            worksheetMap = {};
          } else {
            // Create a map of videoId -> completed status
            const completedVideoIds = new Set();

            worksheetResult.data?.forEach((submission) => {
              // Method 1: Extract video ID from input_data (FormWidget stores it here)
              const videoIdFromData = submission.input_data?.video_id ||
                                     submission.input_data?.video_context?.id;

              // Method 2: Extract video ID from source_context pattern
              // source_context format: "worksheet:video-reflection:VIDEO_ID:TEMPLATE_ID"
              let videoIdFromContext;
              if (submission.source_context) {
                const parts = submission.source_context.split(':');
                if (parts.length >= 3) {
                  videoIdFromContext = parts[2]; // Third element is the video ID
                }
              }

              // Add both potential video IDs to our set
              if (videoIdFromData) completedVideoIds.add(videoIdFromData);
              if (videoIdFromContext) completedVideoIds.add(videoIdFromContext);

              console.log(`[AgentService] Found worksheet submission:`, {
                videoIdFromData,
                videoIdFromContext,
                source_context: submission.source_context
              });
            });

            // Map content titles to worksheet completion status using video IDs
            contentIds.forEach(contentTitle => {
              // First check if we have a direct video ID mapping for this content
              const videoIdForThisContent = Object.keys(videoIdToTitleMap).find(
                videoId => videoIdToTitleMap[videoId] === contentTitle
              );

              let hasWorksheet = false;

              if (videoIdForThisContent) {
                // Direct match using the mapped video ID
                hasWorksheet = completedVideoIds.has(videoIdForThisContent);
                if (hasWorksheet) {
                  console.log(`[AgentService] Found worksheet for "${contentTitle}" via video ID: ${videoIdForThisContent}`);
                }
              }

              // Fallback: Check if any worksheet submission matches content patterns
              if (!hasWorksheet) {
                hasWorksheet = completedVideoIds.has(contentTitle) ||
                               Array.from(completedVideoIds).some(id =>
                                 typeof id === 'string' &&
                                 (id.includes(contentTitle.toLowerCase().replace(/\s+/g, '-')) ||
                                  contentTitle.toLowerCase().replace(/\s+/g, '-').includes(id.toLowerCase()) ||
                                  id.toLowerCase().includes(contentTitle.toLowerCase()))
                               );
              }

              worksheetMap[contentTitle] = hasWorksheet;
            });

            console.log(`[AgentService] Successfully checked worksheet completions for ${worksheetResult.data?.length || 0} submissions`);
            console.log(`[AgentService] Completed video IDs found:`, Array.from(completedVideoIds));
            console.log(`[AgentService] Worksheet completion map:`, worksheetMap);
          }
        } catch (error) {
          console.warn(`[AgentService] Progress/worksheet fetch failed:`, error);
          // Continue with empty maps - don't fail the entire enrichment
          progressMap = {};
          worksheetMap = {};
        }
      }

      // Helper function to enrich a single card with progress and worksheet data
      const enrichCard = (card: any) => {
        // Updated for Universal Widget Schema format
        if (card.type === 'Card' && card.config?.title && card.data?.videoUrl) {
          const progressData = progressMap[card.config.title];
          const worksheetCompleted = worksheetMap[card.config.title] || false;

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
                // Real worksheet completion status from Universal Input System
                completed: worksheetCompleted,
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