/**
 * File: src/hooks/use-user.ts
 * Purpose: Hook for accessing current user context
 * Owner: Core Team
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface UserContext {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  tenantId: string;
  organizationId: string | null;
  teamId: string | null;
  role: 'member' | 'manager' | 'admin' | 'owner';
  tenant: {
    tenantKey: string;
    displayName: string;
    theme: Record<string, string>;
  } | null;
  organization: {
    id: string;
    name: string;
    branding: Record<string, unknown>;
  } | null;
}

async function fetchUserContext(): Promise<UserContext | null> {
  const supabase = createClient();

  // Get current session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user details with related data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      tenant_id,
      tenants:tenant_id (
        tenant_key,
        display_name,
        theme
      )
    `)
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.error('Failed to fetch user:', userError);
    return null;
  }

  // Fetch membership
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select(`
      organization_id,
      team_id,
      role,
      organizations:organization_id (
        id,
        name,
        branding
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError) {
    console.error('Failed to fetch membership:', membershipError);
  }

  // Type assertions - Supabase returns single objects for foreign key joins
  const tenant = userData.tenants as unknown as { tenant_key: string; display_name: string; theme: Record<string, string> } | null;
  const organization = membership?.organizations as unknown as { id: string; name: string; branding: Record<string, unknown> } | null;

  return {
    id: userData.id,
    email: userData.email,
    fullName: userData.full_name,
    avatarUrl: userData.avatar_url,
    tenantId: userData.tenant_id,
    organizationId: membership?.organization_id || null,
    teamId: membership?.team_id || null,
    role: membership?.role || 'member',
    tenant: tenant ? {
      tenantKey: tenant.tenant_key,
      displayName: tenant.display_name,
      theme: tenant.theme,
    } : null,
    organization: organization ? {
      id: organization.id,
      name: organization.name,
      branding: organization.branding,
    } : null,
  };
}

export function useUser() {
  return useQuery({
    queryKey: ['user-context'],
    queryFn: fetchUserContext,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Check if user has a specific role or higher
 */
export function hasRole(
  userRole: string,
  requiredRole: 'member' | 'manager' | 'admin' | 'owner'
): boolean {
  const roleHierarchy = {
    member: 0,
    manager: 1,
    admin: 2,
    owner: 3,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}

