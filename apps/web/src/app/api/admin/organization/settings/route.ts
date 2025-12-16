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
    const { organizationId, settings, branding } = body;

    // Verify the admin belongs to this org
    if (membership.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current org data
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('settings, branding')
      .eq('id', organizationId)
      .single();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle settings update
    if (settings) {
      // Validate settings
      if (settings.signoff_mode && !['self_certify', 'leader_approval'].includes(settings.signoff_mode)) {
        return NextResponse.json({ error: 'Invalid signoff mode' }, { status: 400 });
      }

      // Merge new settings with existing
      updateData.settings = {
        ...(currentOrg?.settings || {}),
        ...settings,
      };
    }

    // Handle branding update
    if (branding) {
      // Validate primary color if provided
      if (branding.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(branding.primary_color)) {
        return NextResponse.json({ error: 'Invalid primary color format' }, { status: 400 });
      }

      // Validate logo URL if provided
      if (branding.logo_url) {
        try {
          new URL(branding.logo_url);
        } catch {
          return NextResponse.json({ error: 'Invalid logo URL' }, { status: 400 });
        }
      }

      // Merge new branding with existing
      updateData.branding = {
        ...(currentOrg?.branding || {}),
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        display_name: branding.display_name,
        use_tenant_theme: branding.use_tenant_theme,
      };
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
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

