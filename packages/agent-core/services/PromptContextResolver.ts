/**
 * File: packages/agent-core/services/PromptContextResolver.ts
 * Purpose: Resolves prompt contexts hierarchically with user preference respect
 * Owner: Engineering Team
 * Tags: #prompt-context #resolver #hierarchy
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface PromptContext {
  id: string;
  name: string;
  description: string;
  system_message: string;
  behavior_modifiers: Record<string, unknown>;
  scope: 'global' | 'organization' | 'team' | 'personal';
  priority: number;
  tenant_key: string;
  created_by?: string;
  is_active: boolean;
}

export interface ResolvedContext {
  contexts: PromptContext[];
  systemMessage: string;
  behaviorModifiers: Record<string, unknown>;
  appliedContextIds: string[];
  hierarchyOrder: string[];
}

export interface UserContextPreference {
  user_id: string;
  context_id: string;
  is_enabled: boolean;
  tenant_key: string;
}

export class PromptContextResolver {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Main method: Resolve all active contexts for a user with hierarchy and toggles
   */
  async resolveUserContexts(userId: string, tenantKey: string = 'leaderforge'): Promise<ResolvedContext> {
    try {
      // 1. Get all available contexts for this user (based on permissions)
      const availableContexts = await this.getAvailableContexts(userId, tenantKey);

      // 2. Filter by user's toggle preferences (only enabled contexts)
      const enabledContexts = await this.getEnabledUserContexts(userId, availableContexts);

      // 3. Apply hierarchical ordering (global → org → team → personal)
      const orderedContexts = this.applyHierarchicalOrdering(enabledContexts);

      // 4. Merge contexts into final system message and behavior modifiers
      const mergedResult = this.mergeContexts(orderedContexts);

      return {
        contexts: orderedContexts,
        systemMessage: mergedResult.systemMessage,
        behaviorModifiers: mergedResult.behaviorModifiers,
        appliedContextIds: orderedContexts.map(ctx => ctx.id),
        hierarchyOrder: ['global', 'organization', 'team', 'personal']
      };
    } catch (error) {
      console.error('[PromptContextResolver] Error resolving contexts:', error);

      // Return minimal fallback context
      return {
        contexts: [],
        systemMessage: 'You are a helpful AI assistant.',
        behaviorModifiers: {},
        appliedContextIds: [],
        hierarchyOrder: []
      };
    }
  }

  /**
   * Get all contexts available to a user based on their permissions and entitlements
   */
  private async getAvailableContexts(userId: string, tenantKey: string): Promise<PromptContext[]> {
    // TODO: Add entitlement checking - for now get all active contexts
    const { data: contexts, error } = await this.supabase
      .from('prompt_contexts')
      .select('*')
      .eq('tenant_key', tenantKey)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('[PromptContextResolver] Error fetching contexts:', error);
      return [];
    }

    return contexts || [];
  }

  /**
   * Filter contexts by user's toggle preferences (enabled/disabled)
   */
  private async getEnabledUserContexts(
    userId: string,
    availableContexts: PromptContext[]
  ): Promise<PromptContext[]> {
    if (availableContexts.length === 0) return [];

    const contextIds = availableContexts.map(ctx => ctx.id);

    // Get user's preferences for these contexts
    const { data: preferences, error } = await this.supabase
      .from('user_context_preferences')
      .select('context_id, is_enabled')
      .eq('user_id', userId)
      .in('context_id', contextIds);

    if (error) {
      console.error('[PromptContextResolver] Error fetching preferences:', error);
      // Default to all contexts enabled if preference lookup fails
      return availableContexts;
    }

    // Create preference map
    const preferenceMap = new Map<string, boolean>();
    preferences?.forEach(pref => {
      preferenceMap.set(pref.context_id, pref.is_enabled);
    });

    // Filter contexts: include if enabled explicitly, or if no preference set (default enabled)
    return availableContexts.filter(context => {
      const isEnabled = preferenceMap.get(context.id);
      return isEnabled !== false; // Include if true or undefined (default enabled)
    });
  }

  /**
   * Apply hierarchical ordering: global → organization → team → personal
   */
  private applyHierarchicalOrdering(contexts: PromptContext[]): PromptContext[] {
    const scopeOrder = ['global', 'organization', 'team', 'personal'];

    return contexts.sort((a, b) => {
      // Primary sort: by scope hierarchy
      const scopeA = scopeOrder.indexOf(a.scope);
      const scopeB = scopeOrder.indexOf(b.scope);

      if (scopeA !== scopeB) {
        return scopeA - scopeB;
      }

      // Secondary sort: by priority within same scope
      return b.priority - a.priority;
    });
  }

  /**
   * Merge contexts into final system message and behavior modifiers
   */
  private mergeContexts(orderedContexts: PromptContext[]): {
    systemMessage: string;
    behaviorModifiers: Record<string, unknown>;
  } {
    // Build system message by concatenating all context system messages
    const systemParts = orderedContexts
      .filter(ctx => ctx.system_message?.trim())
      .map(ctx => ctx.system_message.trim());

    const systemMessage = systemParts.length > 0
      ? systemParts.join('\n\n')
      : 'You are a helpful AI assistant.';

    // Merge behavior modifiers (later contexts override earlier ones)
    const behaviorModifiers: Record<string, unknown> = {};
    orderedContexts.forEach(ctx => {
      if (ctx.behavior_modifiers && typeof ctx.behavior_modifiers === 'object') {
        Object.assign(behaviorModifiers, ctx.behavior_modifiers);
      }
    });

    return { systemMessage, behaviorModifiers };
  }

  /**
   * Update user's context preference (enable/disable toggle)
   */
  async updateUserContextPreference(
    userId: string,
    contextId: string,
    isEnabled: boolean,
    tenantKey: string = 'leaderforge'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_context_preferences')
        .upsert({
          user_id: userId,
          context_id: contextId,
          is_enabled: isEnabled,
          tenant_key: tenantKey
        });

      if (error) {
        console.error('[PromptContextResolver] Error updating preference:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PromptContextResolver] Exception updating preference:', error);
      return false;
    }
  }

  /**
   * Get user's current context preferences for UI display
   */
  async getUserContextPreferences(userId: string, tenantKey: string = 'leaderforge'): Promise<UserContextPreference[]> {
    try {
      const { data: preferences, error } = await this.supabase
        .from('user_context_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_key', tenantKey);

      if (error) {
        console.error('[PromptContextResolver] Error fetching user preferences:', error);
        return [];
      }

      return preferences || [];
    } catch (error) {
      console.error('[PromptContextResolver] Exception fetching preferences:', error);
      return [];
    }
  }
}