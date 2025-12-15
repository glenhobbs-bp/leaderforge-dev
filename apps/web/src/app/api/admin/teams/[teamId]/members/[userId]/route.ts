/**
 * File: src/app/api/admin/teams/[teamId]/members/[userId]/route.ts
 * Purpose: API route to remove a member from a team
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{ teamId: string; userId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, userId } = await params;
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

    // Get the team
    const { data: team } = await supabase
      .from('teams')
      .select('id, organization_id')
      .eq('id', teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify admin is in the same org
    if (team.organization_id !== adminMembership.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the target user's membership
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('id, team_id')
      .eq('user_id', userId)
      .eq('organization_id', adminMembership.organization_id)
      .eq('is_active', true)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Verify user is in the team
    if (targetMembership.team_id !== teamId) {
      return NextResponse.json({ error: 'User not in this team' }, { status: 400 });
    }

    // Remove team assignment
    const { error: updateError } = await supabase
      .from('memberships')
      .update({
        team_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetMembership.id);

    if (updateError) {
      console.error('Error removing member from team:', updateError);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

