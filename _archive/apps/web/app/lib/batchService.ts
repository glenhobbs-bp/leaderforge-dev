import { SupabaseClient } from '@supabase/supabase-js';
import { entitlementService } from './entitlementService';
import { navService } from './navService';
import { contentService } from './contentService';
import { tenantService } from './tenantService';
import type { NavOption, Content, Entitlement, ContextConfig } from './types';

/**
 * Batch service for optimized data fetching with shared entitlements
 * and parallelized operations to minimize database calls and response times.
 */
export const batchService = {
  /**
   * Fetch context configuration, navigation options, and content in an optimized way.
   * This method shares entitlements across all operations and parallelizes what can be done in parallel.
   */
  async getContextDataBundle(
    supabase: SupabaseClient,
    contextKey: string,
    userId: string
  ): Promise<{
    contextConfig: ContextConfig | null;
    navOptions: NavOption[];
    content: Content[];
    userEntitlements: Entitlement[];
  }> {
    console.log(`[batchService] Fetching complete context data bundle for: ${contextKey}, user: ${userId}`);

    // Step 1: Fetch user entitlements ONCE (cached)
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);

    // Step 2: Parallelize the remaining operations that don't depend on each other
    const [contextConfig, navOptions, content] = await Promise.all([
      // Context config doesn't need entitlements
      tenantService.getTenantConfig(supabase, contextKey),

      // Nav options with pre-fetched entitlements
      navService.getNavOptionsWithEntitlements(supabase, contextKey, userEntitlements),

      // Content with pre-fetched entitlements
      contentService.getContentForContextWithEntitlements(supabase, contextKey, userEntitlements)
    ]);

    console.log(`[batchService] Context data bundle complete - config: ${!!contextConfig}, nav: ${navOptions.length}, content: ${content.length}`);

    return {
      contextConfig,
      navOptions,
      content,
      userEntitlements
    };
  },

  /**
   * Fetch navigation and content data efficiently for a context.
   * Optimized for cases where you don't need the full context config.
   */
  async getNavAndContentBundle(
    supabase: SupabaseClient,
    contextKey: string,
    userId: string
  ): Promise<{
    navOptions: NavOption[];
    content: Content[];
    userEntitlements: Entitlement[];
  }> {
    console.log(`[batchService] Fetching nav and content bundle for: ${contextKey}, user: ${userId}`);

    // Step 1: Fetch user entitlements ONCE (cached)
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);

    // Step 2: Parallelize nav and content fetches
    const [navOptions, content] = await Promise.all([
      navService.getNavOptionsWithEntitlements(supabase, contextKey, userEntitlements),
      contentService.getContentForContextWithEntitlements(supabase, contextKey, userEntitlements)
    ]);

    console.log(`[batchService] Nav and content bundle complete - nav: ${navOptions.length}, content: ${content.length}`);

    return {
      navOptions,
      content,
      userEntitlements
    };
  },

  /**
   * Batch fetch data for multiple contexts efficiently.
   * Useful for pre-loading or comparative analysis.
   */
  async getMultiContextBundle(
    supabase: SupabaseClient,
    contextKeys: string[],
    userId: string
  ): Promise<Record<string, {
    navOptions: NavOption[];
    content: Content[];
  }>> {
    console.log(`[batchService] Fetching multi-context bundle for: ${contextKeys.join(', ')}, user: ${userId}`);

    // Step 1: Fetch user entitlements ONCE for all contexts
    const userEntitlements = await entitlementService.getUserEntitlements(supabase, userId);

    // Step 2: Parallelize fetches for all contexts
    const contextPromises = contextKeys.map(async (contextKey) => {
      const [navOptions, content] = await Promise.all([
        navService.getNavOptionsWithEntitlements(supabase, contextKey, userEntitlements),
        contentService.getContentForContextWithEntitlements(supabase, contextKey, userEntitlements)
      ]);

      return {
        contextKey,
        navOptions,
        content
      };
    });

    const results = await Promise.all(contextPromises);

    // Convert to object for easy access
    const bundle: Record<string, { navOptions: NavOption[]; content: Content[] }> = {};
    for (const result of results) {
      bundle[result.contextKey] = {
        navOptions: result.navOptions,
        content: result.content
      };
    }

    console.log(`[batchService] Multi-context bundle complete for ${contextKeys.length} contexts`);
    return bundle;
  },

  /**
   * Get comprehensive data needed for context rendering, batch all operations together.
   * Fetches context config, nav options, and content in optimized sequence.
   */
  async getBatchDataForContext(
    supabase: SupabaseClient,
    contextKey: string,
    userId: string
  ): Promise<{
    contextConfig: ContextConfig | null;
    navOptions: NavOption[];
    contentList: Content[];
  }> {
    console.log(`[batchService] Fetching batch data for context: ${contextKey}, user: ${userId}`);

    try {
      // Execute the most critical operations in parallel
      const [contextConfig, navOptions] = await Promise.all([
        tenantService.getTenantConfig(supabase, contextKey),
        navService.getNavOptions(supabase, contextKey, userId)
      ]);

      // Then fetch content (may depend on context config)
      const contentList = await contentService.getContentForContext(supabase, contextKey, userId);

      console.log(`[batchService] Batch operation completed - Config: ${!!contextConfig}, Nav: ${navOptions.length}, Content: ${contentList.length}`);

      return {
        contextConfig,
        navOptions,
        contentList
      };
    } catch (error) {
      console.error('[batchService] Error in getBatchDataForContext:', error);
      return {
        contextConfig: null,
        navOptions: [],
        contentList: []
      };
    }
  }
};