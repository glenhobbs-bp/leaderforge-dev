/**
 * File: src/app/api/admin/users/[membershipId]/status/route.ts
 * Purpose: API route to activate/deactivate a user
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

    // Prevent deactivating yourself
    if (targetMembership.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    // Update membership status
    const { error: updateError } = await supabase
      .from('memberships')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membershipId);

    if (updateError) {
      console.error('Error updating membership status:', updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

