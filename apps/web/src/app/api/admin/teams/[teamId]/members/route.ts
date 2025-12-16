/**
 * File: src/app/api/admin/teams/[teamId]/members/route.ts
 * Purpose: API route to add a member to a team
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type RouteParams = {
  params: Promise<{ teamId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
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

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get the target user's membership
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('id, organization_id')
      .eq('user_id', userId)
      .eq('organization_id', adminMembership.organization_id)
      .eq('is_active', true)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Update the user's team assignment
    const { error: updateError } = await supabase
      .from('memberships')
      .update({
        team_id: teamId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetMembership.id);

    if (updateError) {
      console.error('Error assigning member to team:', updateError);
      return NextResponse.json({ error: 'Failed to assign member' }, { status: 500 });
    }

    // Revalidate the teams page cache
    revalidatePath('/admin/teams');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

