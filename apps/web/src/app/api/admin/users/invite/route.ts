/**
 * File: src/app/api/admin/users/invite/route.ts
 * Purpose: API route to invite a new user to an organization
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id, tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, teamId, organizationId, tenantId } = body;

    // Validate request
    if (!email || !organizationId || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the admin belongs to this org
    if (membership.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Check if already a member of this org
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organizationId)
        .single();

      if (existingMembership) {
        return NextResponse.json({ 
          error: 'User is already a member of this organization' 
        }, { status: 400 });
      }

      // Add existing user to organization
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          user_id: existingUser.id,
          organization_id: organizationId,
          team_id: teamId || null,
          role: role || 'member',
          is_active: true,
        });

      if (membershipError) {
        console.error('Error creating membership:', membershipError);
        return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User added to organization' 
      });
    }

    // For new users, we'll need to use Supabase Auth to invite
    // For MVP, we'll create a placeholder user record and send magic link
    
    // Use Supabase Admin API to invite user (requires service role)
    // For now, create a pending invitation record
    
    // TODO: Implement proper email invitation with Supabase Auth
    // This would typically use supabase.auth.admin.inviteUserByEmail()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent (placeholder - email integration pending)',
      note: 'In production, this would send an email invitation'
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

