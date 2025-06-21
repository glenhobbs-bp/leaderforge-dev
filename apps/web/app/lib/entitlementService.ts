import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import type { Entitlement } from './types';

/**
 * Service for entitlement logic. All business rules for user permissions live here.
 * Optimized for performance with minimal logging.
 */
export const entitlementService = {
  /**
   * Get all entitlements for a user.
   */
  async getUserEntitlements(supabase: any, userId: string): Promise<Entitlement[]> {
    // Check cache first
    const cacheKey = `entitlements:${userId}`;
    const cached = globalThis.entitlementCache?.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .schema('core')
        .from('user_entitlements')
        .select(`
          *,
          entitlement:entitlements (*)
        `)
        .eq('user_id', userId)
        .is('revoked_at', null);

      if (error) {
        console.error('[entitlementService] Permission denied - returning empty entitlements for user:', userId);
        return [];
      }

      const entitlements = (data || []) as Entitlement[];

      // Cache the result
      if (!globalThis.entitlementCache) {
        globalThis.entitlementCache = new Map();
      }
      globalThis.entitlementCache.set(cacheKey, {
        data: entitlements,
        timestamp: Date.now()
      });

      return entitlements;
    } catch (error) {
      console.error('[entitlementService] Error fetching entitlements:', error);
      return [];
    }
  },

  /**
   * Get all entitlements for an organization.
   */
  async getOrgEntitlements(supabase: any, orgId: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('org_entitlements')
      .select(`
        *,
        entitlement:entitlements (*)
      `)
      .eq('org_id', orgId);

    if (error) {
      console.error('[entitlementService] Error fetching org entitlements:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Check if a user has access to specific content.
   */
  async checkContentAccess(supabase: any, userId: string, contentId: string): Promise<boolean> {
    try {
      // First, get the content access policy
      const { data: policy, error: policyError } = await supabase
        .schema('core')
        .from('content_access_policies')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (policyError || !policy) {
        // No access policy means content is freely accessible
        return true;
      }

      // Get user entitlements
      const userEntitlements = await this.getUserEntitlements(supabase, userId);
      const userEntitlementIds = userEntitlements.map(e => e.entitlement_id);

      // Check if user has required entitlements
      const requiredEntitlements = policy.required_entitlements || [];
      const accessMode = policy.access_mode || 'any';

      let hasAccess = false;
      if (accessMode === 'any') {
        hasAccess = requiredEntitlements.some((entId: string) => userEntitlementIds.includes(entId));
      } else {
        hasAccess = requiredEntitlements.every((entId: string) => userEntitlementIds.includes(entId));
      }

      return hasAccess;
    } catch (error) {
      console.error('[entitlementService] Error checking content access:', error);
      return false;
    }
  },

  /**
   * Get all content accessible to a user in a given context.
   */
  async getAccessibleContent(supabase: any, userId: string, contextKey: string): Promise<any[]> {
    try {
      // Get all content for the context
      const { data: allContent, error: contentError } = await supabase
        .schema('core')
        .from('content')
        .select('*')
        .eq('context_key', contextKey);

      if (contentError) {
        console.error('[entitlementService] Error fetching content:', contentError);
        return [];
      }

      // Get user entitlements once
      const userEntitlements = await this.getUserEntitlements(supabase, userId);
      const userEntitlementIds = userEntitlements.map(e => e.entitlement_id);

      // Filter content based on access policies
      const accessible = [];
      for (const content of allContent || []) {
        if (!content.required_entitlements || content.required_entitlements.length === 0) {
          accessible.push(content);
        } else {
          const hasAccess = content.required_entitlements.every((entId: string) =>
            userEntitlementIds.includes(entId)
          );
          if (hasAccess) {
            accessible.push(content);
          }
        }
      }

      return accessible;
    } catch (error) {
      console.error('[entitlementService] Error getting accessible content:', error);
      return [];
    }
  }
};