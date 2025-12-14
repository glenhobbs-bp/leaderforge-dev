import { supabase } from './supabaseClient';
import type { ProvisioningAuditLogEntry } from './types';
// import { ProvisioningAuditLogEntry } from '@/types'; // Uncomment and adjust as needed

/**
 * Service for provisioning users, orgs, and entitlements. All business rules and data access for provisioning live here.
 * All methods are robustly logged for observability.
 */
export const provisioningService = {
  /**
   * Provision a user to an organization with a specific role.
   */
  async provisionUserToOrg(userId: string, orgId: string, role: string): Promise<boolean> {
    console.log(`[provisioningService] Provisioning user ${userId} to org ${orgId} as ${role}`);
    const { error } = await supabase
      .from('user_organizations')
      .insert([{ user_id: userId, org_id: orgId, role }]);
    if (error) {
      console.error(`[provisioningService] Error provisioning user to org:`, error);
      return false;
    }
    console.log(`[provisioningService] User ${userId} provisioned to org ${orgId}`);
    return true;
  },

  /**
   * Provision an entitlement directly to a user.
   */
  async provisionEntitlementToUser(userId: string, entitlementId: string): Promise<boolean> {
    console.log(`[provisioningService] Provisioning entitlement ${entitlementId} to user ${userId}`);
    const { error } = await supabase
      .from('core.user_entitlements')
      .insert([{ user_id: userId, entitlement_id: entitlementId }]);
    if (error) {
      console.error(`[provisioningService] Error provisioning entitlement to user:`, error);
      return false;
    }
    console.log(`[provisioningService] Entitlement ${entitlementId} provisioned to user ${userId}`);
    return true;
  },

  /**
   * Provision an entitlement to an organization (optionally with seat count).
   */
  async provisionEntitlementToOrg(orgId: string, entitlementId: string, seatCount?: number): Promise<boolean> {
    console.log(`[provisioningService] Provisioning entitlement ${entitlementId} to org ${orgId} (seats: ${seatCount ?? 'unlimited'})`);
    const { error } = await supabase
      .from('org_entitlements')
      .insert([{ org_id: orgId, entitlement_id: entitlementId, seat_count: seatCount }]);
    if (error) {
      console.error(`[provisioningService] Error provisioning entitlement to org:`, error);
      return false;
    }
    console.log(`[provisioningService] Entitlement ${entitlementId} provisioned to org ${orgId}`);
    return true;
  },

  /**
   * Get the provisioning audit log (optionally filtered).
   */
  async getProvisioningAuditLog(filters?: Partial<ProvisioningAuditLogEntry>): Promise<ProvisioningAuditLogEntry[]> {
    console.log(`[provisioningService] Fetching provisioning audit log`, filters);
    let query = supabase.from('provisioning_audit_log').select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    const { data, error } = await query;
    if (error) {
      console.error(`[provisioningService] Error fetching audit log:`, error);
      throw error;
    }
    console.log(`[provisioningService] Found ${data?.length ?? 0} audit log entries`);
    return (data || []) as ProvisioningAuditLogEntry[];
  },
};