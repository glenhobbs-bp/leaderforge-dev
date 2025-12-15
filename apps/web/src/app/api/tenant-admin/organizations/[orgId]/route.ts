/**
 * File: src/app/api/tenant-admin/organizations/[orgId]/route.ts
 * Purpose: API routes for tenant admin to manage a specific organization
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tenant admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_tenant_admin, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.is_tenant_admin) {
      return NextResponse.json({ error: 'Forbidden - Tenant admin required' }, { status: 403 });
    }

    // Fetch organization (verify it belongs to this tenant)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get stats
    const { count: memberCount } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: activeMemberCount } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const { count: teamCount } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    return NextResponse.json({
      organization: {
        ...org,
        stats: {
          totalMembers: memberCount || 0,
          activeMembers: activeMemberCount || 0,
          teams: teamCount || 0,
        },
      },
    });

  } catch (error) {
    console.error('Error in organization GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tenant admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_tenant_admin, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.is_tenant_admin) {
      return NextResponse.json({ error: 'Forbidden - Tenant admin required' }, { status: 403 });
    }

    // Verify organization belongs to this tenant
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, tenant_id, branding, settings')
      .eq('id', orgId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, branding, settings, is_active } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 });
      }
      // Check for duplicate name (excluding this org)
      const { data: duplicate } = await supabase
        .from('organizations')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .ilike('name', name.trim())
        .neq('id', orgId)
        .single();

      if (duplicate) {
        return NextResponse.json({ error: 'An organization with this name already exists' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (branding !== undefined) {
      // Merge with existing branding
      updates.branding = { ...(existingOrg.branding || {}), ...branding };
    }

    if (settings !== undefined) {
      // Validate settings if provided
      if (settings.signoff_mode && !['self_certify', 'leader_approval'].includes(settings.signoff_mode)) {
        return NextResponse.json({ error: 'Invalid signoff mode' }, { status: 400 });
      }
      // Merge with existing settings
      updates.settings = { ...(existingOrg.settings || {}), ...settings };
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json({ organization: updatedOrg });

  } catch (error) {
    console.error('Error in organization PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete organization (soft delete by setting is_active = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is tenant admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_tenant_admin, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.is_tenant_admin) {
      return NextResponse.json({ error: 'Forbidden - Tenant admin required' }, { status: 403 });
    }

    // Verify organization belongs to this tenant
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, tenant_id')
      .eq('id', orgId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if org has active members
    const { count: activeMemberCount } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (activeMemberCount && activeMemberCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete organization with active members. Deactivate members first.' },
        { status: 400 }
      );
    }

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from('organizations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in organization DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
