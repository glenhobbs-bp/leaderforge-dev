/**
 * File: packages/agent-core/services/PromptContextResolver.ts
 * Purpose: Resolves prompt contexts hierarchically with user preference respect
 * Owner: Engineering Team
 * Tags: #prompt-context #resolver #hierarchy #performance-optimized
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Simple in-memory cache for performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId?: string;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMs: number = 30000) { // 30 second TTL
    this.ttl = ttlMs;
  }

  get(key: string, userId?: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Check user isolation for security
    if (userId && entry.userId && entry.userId !== userId) {
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, userId?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      userId
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instances
const contextsCache = new SimpleCache<PromptContext[]>();
const preferencesCache = new SimpleCache<UserContextPreference[]>();

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
   * PERFORMANCE OPTIMIZED: Parallel queries + caching
   */
  async resolveUserContexts(userId: string, tenantKey: string = 'leaderforge'): Promise<ResolvedContext> {
    try {
      // OPTIMIZATION: Run context and preference queries in parallel instead of sequential
      const [availableContexts, allUserPreferences] = await Promise.all([
        this.getAvailableContexts(userId, tenantKey),
        this.getAllUserPreferences(userId, tenantKey)
      ]);

      // 2. Filter by user's toggle preferences (only enabled contexts)
      const enabledContexts = this.getEnabledUserContextsSync(userId, availableContexts, allUserPreferences);

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
   * PERFORMANCE OPTIMIZED: Added caching
   */
  private async getAvailableContexts(userId: string, tenantKey: string): Promise<PromptContext[]> {
    const cacheKey = `contexts:${tenantKey}`;

    // Check cache first
    const cached = contextsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

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

    const result = contexts || [];

    // Cache the result (not user-specific, so no userId)
    contextsCache.set(cacheKey, result);

    return result;
  }

  /**
   * Get ALL user preferences in one query for better performance
   * PERFORMANCE OPTIMIZED: Single query instead of multiple
   */
  private async getAllUserPreferences(userId: string, tenantKey: string): Promise<UserContextPreference[]> {
    const cacheKey = `prefs:${userId}:${tenantKey}`;

    // Check cache first
    const cached = preferencesCache.get(cacheKey, userId);
    if (cached) {
      return cached;
    }

    // Get ALL user preferences for this tenant in one query
    const { data: preferences, error } = await this.supabase
      .schema('core')
      .from('user_context_preferences')
      .select('context_id, is_enabled')
      .eq('user_id', userId)
      .eq('tenant_key', tenantKey);

    if (error) {
      console.error('[PromptContextResolver] Error fetching all preferences:', error);
      return [];
    }

    const result = preferences?.map(p => ({
      user_id: userId,
      context_id: p.context_id,
      is_enabled: p.is_enabled,
      tenant_key: tenantKey
    })) || [];

    // Cache with user isolation
    preferencesCache.set(cacheKey, result, userId);

    return result;
  }

  /**
   * Filter contexts by user's toggle preferences (enabled/disabled)
   * PERFORMANCE OPTIMIZED: Synchronous processing with pre-fetched data
   */
  private getEnabledUserContextsSync(
    userId: string,
    availableContexts: PromptContext[],
    userPreferences: UserContextPreference[]
  ): PromptContext[] {
    if (availableContexts.length === 0) return [];

    console.log(`[PromptContextResolver] 🔍 Filtering ${availableContexts.length} contexts for user: ${userId}`);

    // Create preference map for fast lookup
    const preferenceMap = new Map<string, boolean>();
    userPreferences.forEach(pref => {
      preferenceMap.set(pref.context_id, pref.is_enabled);
    });

    // Filter contexts: include if enabled explicitly, or if no preference set (default enabled)
    const enabledContexts = availableContexts.filter(context => {
      const isEnabled = preferenceMap.get(context.id);
      const shouldInclude = isEnabled !== false; // Include if true or undefined (default enabled)

      // Light logging only for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PromptContextResolver] 🎯 "${context.name}": ${shouldInclude ? 'enabled' : 'disabled'}`);
      }

      return shouldInclude;
    });

    console.log(`[PromptContextResolver] ✅ ${enabledContexts.length} contexts enabled`);

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
   * PERFORMANCE OPTIMIZED: Minimal logging
   */
  private mergeContexts(orderedContexts: PromptContext[]): {
    systemMessage: string;
    behaviorModifiers: Record<string, unknown>;
  } {
    console.log(`[PromptContextResolver] 🔄 Merging ${orderedContexts.length} contexts into system message`);

    // Build system message by concatenating all context content
    const systemParts = orderedContexts
      .filter(ctx => !!ctx.content?.trim())
      .map(ctx => ctx.content.trim());

    const systemMessage = systemParts.length > 0
      ? systemParts.join('\n\n')
      : 'You are a helpful AI assistant.';

    console.log(`[PromptContextResolver] ✅ System message built: ${systemMessage.length} chars from ${systemParts.length} contexts`);

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

      // PERFORMANCE: Clear cache when preferences are updated
      const cacheKey = `prefs:${userId}:${tenantKey}`;
      preferencesCache.set(cacheKey, [], userId); // Clear cache by setting empty array

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