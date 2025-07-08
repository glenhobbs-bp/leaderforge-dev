/**
 * File: packages/agent-core/services/AnthropicContextService.ts
 * Purpose: Anthropic Claude API integration with context application
 * Owner: Engineering Team
 * Tags: #anthropic #context #api #claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { PromptContextResolver, ResolvedContext } from './PromptContextResolver';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AnthropicContextRequest {
  userId: string;
  userMessage: string;
  tenantKey?: string;
  additionalContexts?: string[]; // Additional context IDs to apply
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnthropicContextResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  appliedContexts: string[];
  resolvedSystemMessage: string;
  executionId: string;
}

export interface AnthropicModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export class AnthropicContextService {
  private anthropic: Anthropic;
  private contextResolver: PromptContextResolver;

  // Default model configurations
  private defaultConfig: AnthropicModelConfig = {
    model: 'claude-3-7-sonnet-20250219', // Latest Claude model
    maxTokens: 4000,
    temperature: 0.2
  };

  constructor(
    anthropicApiKey?: string,
    supabaseClient?: SupabaseClient,
    contextResolver?: PromptContextResolver
  ) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey || process.env.ANTHROPIC_API_KEY!
    });

    this.contextResolver = contextResolver || new PromptContextResolver(supabaseClient);
  }

  /**
   * Execute a user message with full context resolution and application
   */
  async executeWithContext(request: AnthropicContextRequest): Promise<AnthropicContextResponse> {
    const executionId = this.generateExecutionId();

    try {
      console.log(`[AnthropicContextService] Starting execution ${executionId} for user ${request.userId}`);

      // 1. Resolve user's active contexts
      const resolvedContext = await this.contextResolver.resolveUserContexts(
        request.userId,
        request.tenantKey || 'leaderforge'
      );

      // 2. Apply additional contexts if specified
      const finalContext = await this.applyAdditionalContexts(
        resolvedContext,
        request.additionalContexts || []
      );

      // 3. Build messages array for Anthropic API
      const messages = this.buildMessages(finalContext.systemMessage, request.userMessage);

      // 4. Get model configuration
      const config = this.getModelConfig(request);

      // 5. Call Anthropic API
      console.log(`[AnthropicContextService] Calling Claude with ${finalContext.appliedContextIds.length} contexts`);

      const response = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: messages
      });

      // 6. Process response
      const result = this.processResponse(response, finalContext, executionId, config.model);

      console.log(`[AnthropicContextService] Execution ${executionId} completed successfully`);
      return result;

    } catch (error) {
      console.error(`[AnthropicContextService] Execution ${executionId} failed:`, error);
      throw new Error(`Context-aware Anthropic execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preview what contexts would be applied for a user without executing
   */
  async previewContextApplication(
    userId: string,
    tenantKey: string = 'leaderforge'
  ): Promise<{
    resolvedContext: ResolvedContext;
    systemMessagePreview: string;
    contextCount: number;
    appliedContextNames: string[];
  }> {
    const resolvedContext = await this.contextResolver.resolveUserContexts(userId, tenantKey);

    return {
      resolvedContext,
      systemMessagePreview: resolvedContext.systemMessage,
      contextCount: resolvedContext.contexts.length,
      appliedContextNames: resolvedContext.contexts.map(ctx => ctx.name)
    };
  }

  /**
   * Apply additional contexts (e.g., from prompt library) to resolved user contexts
   */
  private async applyAdditionalContexts(
    baseContext: ResolvedContext,
    additionalContextIds: string[]
  ): Promise<ResolvedContext> {
    if (additionalContextIds.length === 0) {
      return baseContext;
    }

    // TODO: Fetch additional contexts from database and merge
    // For now, return base context as-is
    console.log(`[AnthropicContextService] Additional contexts requested but not yet implemented: ${additionalContextIds.join(', ')}`);
    return baseContext;
  }

  /**
   * Build Anthropic messages array with system message and user message
   */
  private buildMessages(systemMessage: string, userMessage: string): Anthropic.Messages.MessageParam[] {
    const messages: Anthropic.Messages.MessageParam[] = [];

    // Add system message first
    if (systemMessage && systemMessage.trim()) {
      messages.push({
        role: 'user',
        content: `<system>${systemMessage.trim()}</system>\n\n${userMessage}`
      });
    } else {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }

    return messages;
  }

  /**
   * Get model configuration (with future model routing capability)
   */
  private getModelConfig(request: AnthropicContextRequest): AnthropicModelConfig {
    return {
      model: request.model || this.defaultConfig.model,
      maxTokens: request.maxTokens || this.defaultConfig.maxTokens,
      temperature: request.temperature ?? this.defaultConfig.temperature
    };
  }

  /**
   * Process Anthropic API response into our standardized format
   */
  private processResponse(
    response: Anthropic.Messages.Message,
    context: ResolvedContext,
    executionId: string,
    model: string
  ): AnthropicContextResponse {
    // Extract text content from response
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.Messages.TextBlock).text)
      .join('\n');

    return {
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      },
      model,
      appliedContexts: context.appliedContextIds,
      resolvedSystemMessage: context.systemMessage,
      executionId
    };
  }

  /**
   * Generate unique execution ID for tracking and debugging
   */
  private generateExecutionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `anth_${timestamp}_${random}`;
  }

  /**
   * Update model configuration (for future model routing)
   */
  updateDefaultConfig(config: Partial<AnthropicModelConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get current model configuration
   */
  getDefaultConfig(): AnthropicModelConfig {
    return { ...this.defaultConfig };
  }
}

/**
 * Factory function for easy service creation
 */
export function createAnthropicContextService(
  anthropicApiKey?: string,
  supabaseClient?: SupabaseClient
): AnthropicContextService {
  return new AnthropicContextService(anthropicApiKey, supabaseClient);
}