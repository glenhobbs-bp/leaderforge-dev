/**
 * File: src/app/api/admin/teams/route.ts
 * Purpose: API route to create a new team
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
    const { name, description, organizationId, tenantId } = body;

    // Validate request
    if (!name || !organizationId || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the admin belongs to this org
    if (membership.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 });
    }

    // Create team
    const { data: team, error: createError } = await supabase
      .from('teams')
      .insert({
        tenant_id: tenantId,
        organization_id: organizationId,
        name: name.trim(),
        description: description || null,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating team:', createError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Revalidate the teams page cache
    revalidatePath('/admin/teams');

    return NextResponse.json({ success: true, team });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

