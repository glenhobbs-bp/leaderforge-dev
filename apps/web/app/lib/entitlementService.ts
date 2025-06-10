import { SupabaseClient } from '@supabase/supabase-js';
// import { Entitlement, Content } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for entitlement and access logic. All business rules and data access for entitlements live here.
 * All methods are robustly logged for observability.
 */
export const entitlementService = {
  /**
   * Get all active entitlements for a user (context/module aware via RLS).
   */
  async getUserEntitlements(supabase: SupabaseClient<any, any, any>, userId: string): Promise<any[]> {
    console.log(`[entitlementService] Fetching entitlements for user: ${userId}`);
    const { data, error } = await supabase
      .schema('core')
      .from('user_entitlements')
      .select('*, entitlement:entitlement_id(*)')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (error) {
      console.error(`[entitlementService] Error fetching user entitlements:`, error);
      throw error;
    }
    console.log(`[entitlementService] Found ${data?.length ?? 0} entitlements for user ${userId}`);
    return data || [];
  },

  /**
   * Get all active entitlements for an organization.
   */
  async getOrgEntitlements(supabase: SupabaseClient<any, any, any>, orgId: string): Promise<any[]> {
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
    return data || [];
  },

  /**
   * Check if a user can access a given content item (using entitlements and content access policies).
   */
  async canUserAccessContent(supabase: SupabaseClient<any, any, any>, userId: string, contentId: string): Promise<boolean> {
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
    const policy = policies[0];
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
  async getAccessibleContent(supabase: SupabaseClient<any, any, any>, userId: string, contextKey: string): Promise<any[]> {
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
    const accessible: any[] = [];
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