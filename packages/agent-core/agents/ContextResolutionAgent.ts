/**
 * File: packages/agent-core/agents/ContextResolutionAgent.ts
 * Purpose: Agent for orchestrating user context resolution and preference management
 * Owner: Engineering Team
 * Tags: #agents #context #preferences #orchestration
 */

import { PromptContextResolver, ResolvedContext } from '../services/PromptContextResolver';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ContextResolutionRequest {
  userId: string;
  tenantKey: string;
  requestedContext?: string;
  userMessage?: string;
  includePreferences?: boolean;
}

export interface ContextResolutionResponse {
  type: 'context_resolution';
  resolvedContext: ResolvedContext;
  userPreferences: Array<{
    id: string;
    name: string;
    description: string;
    scope: string;
    priority: number;
    isEnabled: boolean;
    canEdit: boolean;
    requiresLicense: boolean;
  }>;
  appliedContexts: string[];
  systemInstructions: string;
  metadata: {
    userId: string;
    tenantKey: string;
    contextCount: number;
    enabledCount: number;
    resolvedAt: string;
    agentVersion: string;
  };
}

export interface PreferenceUpdateRequest {
  userId: string;
  contextId: string;
  isEnabled: boolean;
  tenantKey: string;
}

export interface BulkPreferenceUpdateRequest {
  userId: string;
  tenantKey: string;
  preferences: Array<{
    contextId: string;
    isEnabled: boolean;
  }>;
}

export class ContextResolutionAgent {
  private contextResolver: PromptContextResolver;
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.contextResolver = new PromptContextResolver(supabaseClient);
  }

  /**
   * Main orchestration method - resolves contexts and preferences for a user
   * PERFORMANCE OPTIMIZED: Reuses data from PromptContextResolver instead of duplicating queries
   */
  async resolveUserContexts(request: ContextResolutionRequest): Promise<ContextResolutionResponse> {
    const { userId, tenantKey, includePreferences = true } = request;

    try {
      // 1. Agent Decision: Resolve user's active contexts with preferences
      const resolvedContext = await this.contextResolver.resolveUserContexts(userId, tenantKey);

      // 2. OPTIMIZED: Build UI preferences from already-resolved data instead of re-querying
      let userPreferences: ContextResolutionResponse['userPreferences'] = [];
      if (includePreferences) {
        userPreferences = this.buildUserPreferencesFromResolvedContext(resolvedContext);
      }

      // 3. Agent Decision: Build system instructions
      const systemInstructions = this.buildSystemInstructions(resolvedContext);

      // 4. Agent Response: Return complete orchestration result
      return {
        type: 'context_resolution',
        resolvedContext,
        userPreferences,
        appliedContexts: resolvedContext.appliedContextIds,
        systemInstructions,
        metadata: {
          userId,
          tenantKey,
          contextCount: resolvedContext.contexts.length,
          enabledCount: resolvedContext.appliedContextIds.length,
          resolvedAt: new Date().toISOString(),
          agentVersion: '1.0.0'
        }
      };

    } catch (error) {
      console.error('[ContextResolutionAgent] Resolution failed:', error);

      // Agent Fallback: Return minimal working context
      return this.getFallbackResponse(userId, tenantKey);
    }
  }

  /**
   * Agent orchestration for single preference update
   */
  async updateUserPreference(request: PreferenceUpdateRequest): Promise<{
    success: boolean;
    updatedPreference?: {
      contextId: string;
      isEnabled: boolean;
    };
    error?: string;
  }> {
    try {
      const success = await this.contextResolver.updateUserContextPreference(
        request.userId,
        request.contextId,
        request.isEnabled,
        request.tenantKey
      );

      if (success) {
        return {
          success: true,
          updatedPreference: {
            contextId: request.contextId,
            isEnabled: request.isEnabled
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to update preference in database'
        };
      }
    } catch (error) {
      console.error('[ContextResolutionAgent] Preference update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Agent orchestration for bulk preference updates
   */
  async bulkUpdatePreferences(request: BulkPreferenceUpdateRequest): Promise<{
    success: boolean;
    updatedPreferences?: Array<{
      contextId: string;
      isEnabled: boolean;
      success: boolean;
    }>;
    error?: string;
  }> {
    try {
      const results = await Promise.allSettled(
        request.preferences.map(pref =>
          this.contextResolver.updateUserContextPreference(
            request.userId,
            pref.contextId,
            pref.isEnabled,
            request.tenantKey
          )
        )
      );

      const updatedPreferences = request.preferences.map((pref, index) => ({
        contextId: pref.contextId,
        isEnabled: pref.isEnabled,
        success: results[index].status === 'fulfilled' && results[index].value === true
      }));

      const allSuccessful = updatedPreferences.every(p => p.success);

      return {
        success: allSuccessful,
        updatedPreferences
      };

    } catch (error) {
      console.error('[ContextResolutionAgent] Bulk update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

    /**
   * PERFORMANCE OPTIMIZED: Build UI preferences from already-resolved context data
   * This eliminates redundant database queries by reusing data from PromptContextResolver
   */
  private buildUserPreferencesFromResolvedContext(
    resolvedContext: ResolvedContext
  ): ContextResolutionResponse['userPreferences'] {
    try {
      // Use the contexts that were already fetched by PromptContextResolver
      return resolvedContext.contexts.map(context => ({
        id: context.id,
        name: context.name,
        description: context.description,
        scope: context.context_type.charAt(0).toUpperCase() + context.context_type.slice(1),
        priority: context.priority,
        isEnabled: resolvedContext.appliedContextIds.includes(context.id), // If it's applied, it's enabled
        canEdit: true, // TODO: Check permissions
        requiresLicense: false // TODO: Check entitlements
      }));
    } catch (error) {
      console.error('[ContextResolutionAgent] Error building preferences from resolved context:', error);
      return [];
    }
  }

  /**
   * DEPRECATED: Get user preferences formatted for UI consumption
   * This method is kept for fallback but should not be used in normal flow
   */
  private async getUserPreferencesForUI(userId: string, tenantKey: string): Promise<ContextResolutionResponse['userPreferences']> {
    try {
      // Get all available contexts
      const { data: contexts, error: contextsError } = await this.supabase
        .schema('core')
        .from('prompt_contexts')
        .select('id, name, description, content, context_type, priority, tenant_key, created_by, is_active, template_variables')
        .eq('tenant_key', tenantKey)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (contextsError) {
        console.error('[ContextResolutionAgent] Error fetching contexts:', contextsError);
        return [];
      }

      // Get user preferences
      const { data: preferences, error: preferencesError } = await this.supabase
        .schema('core')
        .from('user_context_preferences')
        .select('context_id, is_enabled')
        .eq('user_id', userId)
        .eq('tenant_key', tenantKey);

      if (preferencesError) {
        console.error('[ContextResolutionAgent] Error fetching preferences:', preferencesError);
        return [];
      }

      // Create preference map
      const preferenceMap = new Map<string, boolean>();
      preferences?.forEach(pref => {
        preferenceMap.set(pref.context_id, pref.is_enabled);
      });

      // Combine contexts with preferences
      return contexts?.map(context => ({
        id: context.id,
        name: context.name,
        description: context.description,
        scope: context.context_type.charAt(0).toUpperCase() + context.context_type.slice(1), // Map context_type to scope with proper capitalization
        priority: context.priority,
        isEnabled: preferenceMap.get(context.id) ?? true, // Default enabled
        canEdit: true, // TODO: Check permissions
        requiresLicense: false // TODO: Check entitlements
      })) || [];

    } catch (error) {
      console.error('[ContextResolutionAgent] Error getting preferences for UI:', error);
      return [];
    }
  }

    /**
   * Agent decision logic for building system instructions
   * PERFORMANCE OPTIMIZED: Minimal logging
   */
  private buildSystemInstructions(resolvedContext: ResolvedContext): string {
    const baseInstructions = `You are a helpful assistant for LeaderForge, an AI-powered leadership development platform.`;

    console.log(`[ContextResolutionAgent] 📝 Building system instructions with ${resolvedContext.contexts.length} contexts`);

    if (resolvedContext.contexts.length === 0) {
      console.log('[ContextResolutionAgent] ⚠️ No contexts available, using base instructions only');
      return baseInstructions;
    }

    const contextInstructions = `\n\nAPPLIED CONTEXTS:\n${resolvedContext.contexts.map(c => `- ${c.name}: ${c.description}`).join('\n')}`;

    const finalInstructions = baseInstructions + contextInstructions + `\n\nSystem Context:\n${resolvedContext.systemMessage}`;

    console.log(`[ContextResolutionAgent] ✅ System instructions built: ${finalInstructions.length} chars`);

    return finalInstructions;
  }

  /**
   * Agent fallback for error conditions
   */
  private getFallbackResponse(userId: string, tenantKey: string): ContextResolutionResponse {
    return {
      type: 'context_resolution',
      resolvedContext: {
        contexts: [],
        systemMessage: 'You are a helpful AI assistant.',
        behaviorModifiers: {},
        appliedContextIds: [],
        hierarchyOrder: []
      },
      userPreferences: [],
      appliedContexts: [],
      systemInstructions: 'You are a helpful assistant for LeaderForge.',
      metadata: {
        userId,
        tenantKey,
        contextCount: 0,
        enabledCount: 0,
        resolvedAt: new Date().toISOString(),
        agentVersion: '1.0.0-fallback'
      }
    };
  }
}

export function createContextResolutionAgent(supabaseClient: SupabaseClient): ContextResolutionAgent {
  return new ContextResolutionAgent(supabaseClient);
}