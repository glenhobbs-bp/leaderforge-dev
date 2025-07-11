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
  content: string; // Maps to database 'content' column (contains system message)
  context_type: 'global' | 'organization' | 'team' | 'personal'; // Maps to database 'context_type' column
  priority: number;
  tenant_key: string;
  created_by?: string;
  is_active: boolean;
  template_variables?: Record<string, unknown>; // Maps to database 'template_variables' column
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
      .schema('core')
      .from('prompt_contexts')
      .select('id, name, description, content, context_type, priority, tenant_key, created_by, is_active, template_variables')
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
    console.log('[PromptContextResolver] 🔍 Filtering contexts for user:', userId);
    console.log('[PromptContextResolver] 📋 Available contexts:', availableContexts.map(ctx => ({ id: ctx.id, name: ctx.name, content_length: ctx.content?.length || 0 })));

    // Get user's preferences for these contexts
    const { data: preferences, error } = await this.supabase
      .schema('core')
      .from('user_context_preferences')
      .select('context_id, is_enabled')
      .eq('user_id', userId)
      .in('context_id', contextIds);

    if (error) {
      console.error('[PromptContextResolver] Error fetching preferences:', error);
      // Default to all contexts enabled if preference lookup fails
      return availableContexts;
    }

    console.log('[PromptContextResolver] 👤 User preferences found:', preferences);

    // Create preference map
    const preferenceMap = new Map<string, boolean>();
    preferences?.forEach(pref => {
      preferenceMap.set(pref.context_id, pref.is_enabled);
    });

    // Filter contexts: include if enabled explicitly, or if no preference set (default enabled)
    const enabledContexts = availableContexts.filter(context => {
      const isEnabled = preferenceMap.get(context.id);
      const shouldInclude = isEnabled !== false; // Include if true or undefined (default enabled)

      console.log(`[PromptContextResolver] 🎯 Context "${context.name}":`, {
        id: context.id,
        hasPreference: preferenceMap.has(context.id),
        preferenceValue: isEnabled,
        shouldInclude,
        hasContent: !!context.content?.trim(),
        contentLength: context.content?.length || 0
      });

      return shouldInclude;
    });

    console.log('[PromptContextResolver] ✅ Final enabled contexts:', enabledContexts.map(ctx => ({ name: ctx.name, id: ctx.id })));

    return enabledContexts;
  }

  /**
   * Apply hierarchical ordering: global → organization → team → personal
   */
  private applyHierarchicalOrdering(contexts: PromptContext[]): PromptContext[] {
    const scopeOrder = ['global', 'organization', 'team', 'personal'];

    return contexts.sort((a, b) => {
      // Primary sort: by context_type hierarchy
      const scopeA = scopeOrder.indexOf(a.context_type);
      const scopeB = scopeOrder.indexOf(b.context_type);

      if (scopeA !== scopeB) {
        return scopeA - scopeB;
      }

      // Secondary sort: by priority within same scope
      return b.priority - a.priority;
    });
  }

  /**
   * Merge contexts into final system message and template variables
   */
  private mergeContexts(orderedContexts: PromptContext[]): {
    systemMessage: string;
    behaviorModifiers: Record<string, unknown>;
  } {
    console.log('[PromptContextResolver] 🔄 Merging contexts into system message:', {
      totalContexts: orderedContexts.length,
      contexts: orderedContexts.map(ctx => ({
        name: ctx.name,
        hasContent: !!ctx.content?.trim(),
        contentLength: ctx.content?.length || 0,
        contentPreview: ctx.content?.substring(0, 50) + '...'
      }))
    });

    // Build system message by concatenating all context content
    const systemParts = orderedContexts
      .filter(ctx => {
        const hasContent = !!ctx.content?.trim();
        if (!hasContent) {
          console.log(`[PromptContextResolver] ⚠️ Skipping context "${ctx.name}" - no content`);
        }
        return hasContent;
      })
      .map(ctx => {
        console.log(`[PromptContextResolver] ✅ Including context "${ctx.name}" content (${ctx.content.trim().length} chars)`);
        return ctx.content.trim();
      });

    const systemMessage = systemParts.length > 0
      ? systemParts.join('\n\n')
      : 'You are a helpful AI assistant.';

    console.log('[PromptContextResolver] 📝 Final system message built:', {
      partsCount: systemParts.length,
      totalLength: systemMessage.length,
      includedContexts: orderedContexts.filter(ctx => !!ctx.content?.trim()).map(ctx => ctx.name)
    });

    // Merge template variables (later contexts override earlier ones)
    const behaviorModifiers: Record<string, unknown> = {};
    orderedContexts.forEach(ctx => {
      if (ctx.template_variables && typeof ctx.template_variables === 'object') {
        Object.assign(behaviorModifiers, ctx.template_variables);
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
      // First check if preference already exists
      const { data: existing, error: checkError } = await this.supabase
        .schema('core')
        .from('user_context_preferences')
        .select('user_id, context_id, tenant_key')
        .eq('user_id', userId)
        .eq('context_id', contextId)
        .eq('tenant_key', tenantKey)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is expected if no preference exists
        console.error('[PromptContextResolver] Error checking existing preference:', checkError);
        return false;
      }

      let result;
      if (existing) {
        // Update existing preference
        result = await this.supabase
          .schema('core')
          .from('user_context_preferences')
          .update({ is_enabled: isEnabled })
          .eq('user_id', userId)
          .eq('context_id', contextId)
          .eq('tenant_key', tenantKey);
      } else {
        // Insert new preference
        result = await this.supabase
          .schema('core')
          .from('user_context_preferences')
          .insert({
            user_id: userId,
            context_id: contextId,
            is_enabled: isEnabled,
            tenant_key: tenantKey
          });
      }

      if (result.error) {
        console.error('[PromptContextResolver] Error updating preference:', result.error);
        return false;
      }

      console.log(`[PromptContextResolver] ✅ Successfully ${existing ? 'updated' : 'created'} preference: ${contextId} = ${isEnabled}`);
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
        .schema('core')
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