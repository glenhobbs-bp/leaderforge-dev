/**
 * File: packages/services/src/user.service.ts
 * Purpose: User management service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, UserPreferences } from '@leaderforge/database';
import type { ServiceResult, PaginatedResult, PaginationParams, UserContext } from './types';

export interface GetUsersParams extends PaginationParams {
  organizationId: string;
  teamId?: string;
  role?: string;
  search?: string;
}

export interface UpdateUserParams {
  fullName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export class UserService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get users in organization
   */
  async getUsers(
    context: UserContext,
    params: GetUsersParams
  ): Promise<ServiceResult<PaginatedResult<User>>> {
    const { page = 1, limit = 20, organizationId, teamId, search } = params;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('users')
      .select('*, memberships!inner(*)', { count: 'exact' })
      .eq('memberships.organization_id', organizationId)
      .eq('memberships.is_active', true)
      .eq('tenant_id', context.tenantId)
      .range(offset, offset + limit - 1);

    if (teamId) {
      query = query.eq('memberships.team_id', teamId);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

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
        items: data as User[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUser(context: UserContext, userId: string): Promise<ServiceResult<User>> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', context.tenantId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    return { success: true, data: data as User };
  }

  /**
   * Update user
   */
  async updateUser(
    context: UserContext,
    userId: string,
    params: UpdateUserParams
  ): Promise<ServiceResult<User>> {
    // Only allow self-update or admin update
    if (userId !== context.userId && !['admin', 'owner'].includes(context.role)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this user',
        },
      };
    }

    const updateData: Record<string, unknown> = {};
    if (params.fullName !== undefined) updateData.full_name = params.fullName;
    if (params.avatarUrl !== undefined) updateData.avatar_url = params.avatarUrl;
    if (params.preferences !== undefined) updateData.preferences = params.preferences;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
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

    return { success: true, data: data as User };
  }
}

