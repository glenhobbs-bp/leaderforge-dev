/**
 * File: src/app/api/admin/organization/settings/route.ts
 * Purpose: API route to update organization settings
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
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
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { organizationId, settings } = body;

    // Verify the admin belongs to this org
    if (membership.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate settings
    if (settings.signoff_mode && !['self_certify', 'leader_approval'].includes(settings.signoff_mode)) {
      return NextResponse.json({ error: 'Invalid signoff mode' }, { status: 400 });
    }

    // Get current settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    // Merge new settings with existing
    const mergedSettings = {
      ...(currentOrg?.settings || {}),
      ...settings,
    };

    // Update organization settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization settings:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get organization settings
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', membership.organization_id)
      .single();

    return NextResponse.json({ 
      settings: org?.settings || { signoff_mode: 'self_certify' } 
    });

  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

