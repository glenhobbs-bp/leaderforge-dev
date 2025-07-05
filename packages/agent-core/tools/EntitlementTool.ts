/**
 * File: packages/agent-core/tools/EntitlementTool.ts
 * Purpose: Tool for fetching and managing entitlements from the database
 * Owner: Engineering Team
 * Tags: #tools #entitlements #database
 */

import { createClient } from '@supabase/supabase-js';

// TODO: This should be properly injected from the environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface Entitlement {
  id: string;
  name: string;
  display_name: string;
  description: string;
  tenant_key: string;
}

export class EntitlementTool {

  private static getSupabaseClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'core'
      }
    });
  }

  /**
   * Fetch all available entitlements from the database
   */
  static async getAvailableEntitlements(): Promise<Entitlement[]> {
    try {
      const supabase = this.getSupabaseClient();

      const { data, error } = await supabase
        .from('entitlements')
        .select('id, name, display_name, description, tenant_key')
        .order('name');

      if (error) {
        console.error('Error fetching entitlements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch entitlements:', error);
      return [];
    }
  }

  /**
   * Get entitlements for a specific user
   */
  static async getUserEntitlements(userId: string): Promise<string[]> {
    try {
      const supabase = this.getSupabaseClient();

      const { data, error } = await supabase
        .from('user_entitlements')
        .select('entitlement_id')
        .eq('user_id', userId)
        .is('revoked_at', null);

      if (error) {
        throw error;
      }

      const entitlementIds = data?.map(row => row.entitlement_id) || [];
      return entitlementIds;
    } catch (error) {
      console.error('Error fetching user entitlements:', error);
      return [];
    }
  }

  /**
   * Update user entitlements
   */
  static async updateUserEntitlements(userId: string, entitlementIds: string[]): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient();

      // First, revoke all existing entitlements
      const { error: revokeError } = await supabase
        .from('user_entitlements')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('revoked_at', null);

      if (revokeError) {
        console.error('Error revoking entitlements:', revokeError);
        return false;
      }

      // Then, grant new entitlements
      if (entitlementIds.length > 0) {
        const newEntitlements = entitlementIds.map(entitlementId => ({
          user_id: userId,
          entitlement_id: entitlementId,
          granted_by: userId, // TODO: Use actual admin user ID
          grant_reason: 'Admin grant via CopilotKit'
        }));

        const { error: grantError } = await supabase
          .from('user_entitlements')
          .insert(newEntitlements);

        if (grantError) {
          console.error('Error granting entitlements:', grantError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update user entitlements:', error);
      return false;
    }
  }

  /**
   * Look up user ID by email address
   */
  static async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const supabase = this.getSupabaseClient();

      console.log(`[EntitlementTool] Looking up user by email: ${email}`);

      const { data, error } = await supabase
        .from('users')  // ✅ Schema already set in client config
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching user by email:', error);
        throw error;
      }

      console.log(`[EntitlementTool] Found user ID: ${data?.id}`);
      return data?.id || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }
}