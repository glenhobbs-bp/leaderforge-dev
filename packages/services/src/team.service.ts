/**
 * File: packages/services/src/team.service.ts
 * Purpose: Team management service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Team } from '@leaderforge/database';
import type { ServiceResult, PaginatedResult, PaginationParams, UserContext } from './types';

export interface GetTeamsParams extends PaginationParams {
  organizationId: string;
}

export interface CreateTeamParams {
  organizationId: string;
  name: string;
  description?: string;
}

export interface UpdateTeamParams {
  name?: string;
  description?: string;
}

export class TeamService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get teams in organization
   */
  async getTeams(
    context: UserContext,
    params: GetTeamsParams
  ): Promise<ServiceResult<PaginatedResult<Team>>> {
    const { page = 1, limit = 20, organizationId } = params;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('teams')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        items: data as Team[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      },
    };
  }

  /**
   * Create a new team
   */
  async createTeam(
    context: UserContext,
    params: CreateTeamParams
  ): Promise<ServiceResult<Team>> {
    // Check permission
    if (!['admin', 'owner'].includes(context.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to create teams',
        },
      };
    }

    const { data, error } = await this.supabase
      .from('teams')
      .insert({
        tenant_id: context.tenantId,
        organization_id: params.organizationId,
        name: params.name,
        description: params.description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: data as Team };
  }

  /**
   * Update team
   */
  async updateTeam(
    context: UserContext,
    teamId: string,
    params: UpdateTeamParams
  ): Promise<ServiceResult<Team>> {
    // Check permission
    if (!['manager', 'admin', 'owner'].includes(context.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this team',
        },
      };
    }

    const updateData: Record<string, unknown> = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.description !== undefined) updateData.description = params.description;

    const { data, error } = await this.supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
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

    return { success: true, data: data as Team };
  }

  /**
   * Delete (deactivate) team
   */
  async deleteTeam(context: UserContext, teamId: string): Promise<ServiceResult<void>> {
    // Check permission
    if (!['admin', 'owner'].includes(context.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this team',
        },
      };
    }

    const { error } = await this.supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', teamId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: undefined };
  }
}

