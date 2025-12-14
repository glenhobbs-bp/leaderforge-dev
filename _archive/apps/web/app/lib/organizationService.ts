import { supabase } from './supabaseClient';
import type { Organization, User, ProvisioningModel } from './types';

/**
 * Service for organization and membership logic. All business rules and data access for organizations live here.
 * All methods are robustly logged for observability.
 */
export const organizationService = {
  /**
   * Get a single organization by ID.
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    console.log(`[organizationService] Fetching organization: ${orgId}`);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (error) {
      console.error(`[organizationService] Error fetching organization:`, error);
      throw error;
    }
    console.log(`[organizationService] Found organization: ${data?.id ?? 'none'}`);
    return data as Organization || null;
  },

  /**
   * Get all organizations a user belongs to.
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    console.log(`[organizationService] Fetching organizations for user: ${userId}`);
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*, organization:org_id(*)')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (error) {
      console.error(`[organizationService] Error fetching user organizations:`, error);
      throw error;
    }
    const orgs = (data || []).map((row: { organization: Organization }) => row.organization).filter(Boolean);
    console.log(`[organizationService] User ${userId} belongs to ${orgs.length} organizations`);
    return orgs;
  },

  /**
   * Get all members of an organization.
   */
  async getOrgMembers(orgId: string): Promise<User[]> {
    console.log(`[organizationService] Fetching members for org: ${orgId}`);
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*, user:user_id(*)')
      .eq('org_id', orgId)
      .eq('status', 'active');
    if (error) {
      console.error(`[organizationService] Error fetching org members:`, error);
      throw error;
    }
    const users = (data || []).map((row: { user: User }) => row.user).filter(Boolean);
    console.log(`[organizationService] Org ${orgId} has ${users.length} active members`);
    return users;
  },

  /**
   * Get the provisioning model for a module.
   */
  async getProvisioningModel(moduleId: string): Promise<ProvisioningModel | null> {
    console.log(`[organizationService] Fetching provisioning model for module: ${moduleId}`);
    const { data, error } = await supabase
      .from('provisioning_models')
      .select('*')
      .eq('module_id', moduleId)
      .single();
    if (error) {
      console.error(`[organizationService] Error fetching provisioning model:`, error);
      throw error;
    }
    console.log(`[organizationService] Found provisioning model: ${data?.model_type ?? 'none'}`);
    return data as ProvisioningModel || null;
  },
};