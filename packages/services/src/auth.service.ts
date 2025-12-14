/**
 * File: packages/services/src/auth.service.ts
 * Purpose: Authentication service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceResult, UserContext } from './types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  invitationToken?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  session: {
    accessToken: string;
    expiresAt: number;
  };
}

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Login with email and password
   */
  async login({ email, password }: LoginParams): Promise<ServiceResult<AuthResponse>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email!,
          fullName: data.user.user_metadata?.full_name || null,
        },
        session: {
          accessToken: data.session.access_token,
          expiresAt: data.session.expires_at!,
        },
      },
    };
  }

  /**
   * Register a new user
   */
  async register({ email, password, fullName }: RegisterParams): Promise<ServiceResult<AuthResponse>> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: {
          code: 'EMAIL_CONFIRMATION_REQUIRED',
          message: 'Please check your email to confirm your account.',
        },
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user!.id,
          email: data.user!.email!,
          fullName,
        },
        session: {
          accessToken: data.session.access_token,
          expiresAt: data.session.expires_at!,
        },
      },
    };
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ServiceResult<void>> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Reset password with token
   */
  async resetPassword(newPassword: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: error.message,
        },
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Get current user context (tenant, org, role)
   */
  async getUserContext(userId: string): Promise<ServiceResult<UserContext>> {
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    const { data: membership, error: membershipError } = await this.supabase
      .from('memberships')
      .select('organization_id, team_id, role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return {
        success: false,
        error: {
          code: 'NO_MEMBERSHIP',
          message: 'User has no active membership',
        },
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        tenantId: user.tenant_id,
        organizationId: membership.organization_id,
        teamId: membership.team_id,
        role: membership.role,
      },
    };
  }
}

