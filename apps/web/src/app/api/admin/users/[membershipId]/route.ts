/**
 * File: src/app/api/admin/users/[membershipId]/route.ts
 * Purpose: API route to update user membership details
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{ membershipId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { membershipId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminMembership } = await supabase
      .from('memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminMembership || !['admin', 'owner'].includes(adminMembership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the target membership
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('id, organization_id, user_id')
      .eq('id', membershipId)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Verify admin is in the same org
    if (targetMembership.organization_id !== adminMembership.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent editing yourself
    if (targetMembership.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot edit your own membership' }, { status: 400 });
    }

    const body = await request.json();
    const { role, teamId, managerId } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) {
      updates.role = role;
    }
    if (teamId !== undefined) {
      updates.team_id = teamId || null;
    }
    if (managerId !== undefined) {
      updates.manager_id = managerId || null;
    }

    // Update membership
    const { error: updateError } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', membershipId);

    if (updateError) {
      console.error('Error updating membership:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

