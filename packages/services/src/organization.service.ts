/**
 * File: packages/services/src/organization.service.ts
 * Purpose: Organization management service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Organization, OrgBranding } from '@leaderforge/database';
import type { ServiceResult, UserContext } from './types';

export interface UpdateOrganizationParams {
  name?: string;
  branding?: Partial<OrgBranding>;
  settings?: Record<string, unknown>;
}

export class OrganizationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get organization by ID
   */
  async getOrganization(
    context: UserContext,
    organizationId: string
  ): Promise<ServiceResult<Organization>> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('tenant_id', context.tenantId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization not found',
        },
      };
    }

    return { success: true, data: data as Organization };
  }

  /**
   * Update organization (admin/owner only)
   */
  async updateOrganization(
    context: UserContext,
    organizationId: string,
    params: UpdateOrganizationParams
  ): Promise<ServiceResult<Organization>> {
    // Check permission
    if (!['admin', 'owner'].includes(context.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this organization',
        },
      };
    }

    const updateData: Record<string, unknown> = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.branding !== undefined) updateData.branding = params.branding;
    if (params.settings !== undefined) updateData.settings = params.settings;

    const { data, error } = await this.supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .eq('tenant_id', context.tenantId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: data as Organization };
  }

  /**
   * Get organization stats
   */
  async getOrganizationStats(
    context: UserContext,
    organizationId: string
  ): Promise<ServiceResult<{ userCount: number; teamCount: number }>> {
    const [usersResult, teamsResult] = await Promise.all([
      this.supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true),
      this.supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true),
    ]);

    return {
      success: true,
      data: {
        userCount: usersResult.count || 0,
        teamCount: teamsResult.count || 0,
      },
    };
  }
}

