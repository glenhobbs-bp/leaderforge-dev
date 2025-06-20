import { SupabaseClient } from '@supabase/supabase-js';
import type { Entitlement, ContentAccessPolicy } from './types';

/**
 * In-memory cache for user entitlements to prevent redundant DB calls
 * within the same request context
 */
const entitlementCache = new Map<string, { data: Entitlement[]; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Service for entitlement and access logic. All business rules and data access for entitlements live here.
 * All methods are robustly logged for observability.
 */
export const entitlementService = {
  /**
   * Get all active entitlements for a user (context/module aware via RLS).
   * Includes in-memory caching to prevent redundant calls.
   */
  async getUserEntitlements(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Entitlement[]> {
    // Check cache first
    const cacheKey = userId;
    const cached = entitlementCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`[entitlementService] Using cached entitlements for user: ${userId}`);
      return cached.data;
    }

    console.log(`[entitlementService] Fetching entitlements for user: ${userId}`);
    const { data, error } = await supabase
      .schema('core')
      .from('user_entitlements')
      .select('*, entitlement:entitlement_id(*)')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (error) {
      console.error(`[entitlementService] Error fetching user entitlements:`, error);

      // If it's a permission error, return empty entitlements for now
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log(`[entitlementService] Permission denied - returning empty entitlements for user: ${userId}`);
        return [];
      }
      throw error;
    }

    const entitlements = (data || []) as Entitlement[];

    // Cache the result
    entitlementCache.set(cacheKey, { data: entitlements, timestamp: now });

    console.log(`[entitlementService] Found ${entitlements.length} entitlements for user ${userId}`);
    return entitlements;
  },

  /**
   * Clear cache for a specific user (useful for real-time updates)
   */
  clearUserCache(userId: string): void {
    entitlementCache.delete(userId);
  },

  /**
   * Clear all cached entitlements
   */
  clearAllCache(): void {
    entitlementCache.clear();
  },

  /**
   * Get all active entitlements for an organization.
   */
  async getOrgEntitlements(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<Entitlement[]> {
    console.log(`[entitlementService] Fetching entitlements for org: ${orgId}`);
    const { data, error } = await supabase
      .from('core.org_entitlements')
      .select('*, entitlement:entitlement_id(*)')
      .eq('org_id', orgId)
      .eq('status', 'active');
    if (error) {
      console.error(`[entitlementService] Error fetching org entitlements:`, error);
      throw error;
    }
    console.log(`[entitlementService] Found ${data?.length ?? 0} entitlements for org ${orgId}`);
    return (data || []) as Entitlement[];
  },

  /**
   * Check if a user can access a given content item (using entitlements and content access policies).
   */
  async canUserAccessContent(
    supabase: SupabaseClient,
    userId: string,
    contentId: string
  ): Promise<boolean> {
    console.log(`[entitlementService] Checking access for user ${userId} to content ${contentId}`);
    // 1. Get user entitlements
    const entitlements = await this.getUserEntitlements(supabase, userId);
    const entitlementIds = entitlements.map(e => e.entitlement_id);

    // 2. Get content access policy
    const { data: policies, error } = await supabase
      .schema('core')
      .from('content_access_policies')
      .select('*')
      .eq('content_id', contentId);
    if (error) {
      console.error(`[entitlementService] Error fetching content access policy:`, error);
      throw error;
    }
    if (!policies || policies.length === 0) {
      // No policy = open access
      console.log(`[entitlementService] No access policy for content ${contentId}, access granted.`);
      return true;
    }
    // Check if user meets any/all required entitlements (default: any)
    const policy = policies[0] as ContentAccessPolicy;
    const required = policy.required_entitlements || [];
    const mode = policy.access_mode || 'any';
    const hasAccess = mode === 'all'
      ? required.every((id: string) => entitlementIds.includes(id))
      : required.some((id: string) => entitlementIds.includes(id));
    console.log(`[entitlementService] User ${userId} access to content ${contentId}: ${hasAccess}`);
    return hasAccess;
  },

  /**
   * Get all content in a context the user is entitled to access.
   */
  async getAccessibleContent(
    supabase: SupabaseClient,
    userId: string,
    contextKey: string
  ): Promise<unknown[]> {
    console.log(`[entitlementService] Fetching accessible content for user ${userId} in context ${contextKey}`);
    // 1. Get all content for context
    const { data: allContent, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('context_key', contextKey);
    if (contentError) {
      console.error(`[entitlementService] Error fetching content for context:`, contentError);
      throw contentError;
    }
    // 2. Filter by access
    const accessible: unknown[] = [];
    for (const item of allContent || []) {
      try {
        if (await this.canUserAccessContent(supabase, userId, item.id)) {
          accessible.push(item);
        }
      } catch (err) {
        console.error(`[entitlementService] Error checking access for content ${item.id}:`, err);
      }
    }
    console.log(`[entitlementService] User ${userId} can access ${accessible.length} content items in context ${contextKey}`);
    return accessible;
  },
};