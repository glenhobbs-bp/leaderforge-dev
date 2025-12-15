/**
 * File: src/app/api/platform-admin/tenants/[tenantId]/route.ts
 * Purpose: API routes for platform admin to manage a specific tenant
 * Owner: LeaderForge Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to verify platform admin
async function verifyPlatformAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    return { error: 'Forbidden - Platform admin required', status: 403 };
  }

  return { user };
}

// GET - Get tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get stats
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: userCount } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Get organizations list
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('name');

    return NextResponse.json({
      tenant: {
        ...tenant,
        stats: {
          organizations: orgCount || 0,
          users: userCount || 0,
        },
        organizations: organizations || [],
      },
    });

  } catch (error) {
    console.error('Error in tenant GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify tenant exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id, theme, settings')
      .eq('id', tenantId)
      .single();

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { display_name, theme, settings, is_active } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) {
      if (!display_name?.trim()) {
        return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 });
      }
      updates.display_name = display_name.trim();
    }

    if (theme !== undefined) {
      // Validate theme colors
      const colorFields = ['primary', 'secondary', 'accent', 'background', 'surface', 'text_primary', 'text_secondary'];
      for (const field of colorFields) {
        if (theme[field] && !/^#[0-9A-Fa-f]{6}$/.test(theme[field])) {
          return NextResponse.json({ 
            error: `Invalid color format for ${field}. Use hex format like #FFFFFF` 
          }, { status: 400 });
        }
      }
      updates.theme = { ...(existingTenant.theme || {}), ...theme };
    }

    if (settings !== undefined) {
      updates.settings = { ...(existingTenant.settings || {}), ...settings };
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Update tenant
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
    }

    return NextResponse.json({ tenant: updatedTenant });

  } catch (error) {
    console.error('Error in tenant PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Suspend tenant (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify tenant exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id, tenant_key')
      .eq('id', tenantId)
      .single();

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Prevent deletion of the leaderforge tenant
    if (existingTenant.tenant_key === 'leaderforge') {
      return NextResponse.json({ 
        error: 'Cannot suspend the LeaderForge platform tenant' 
      }, { status: 400 });
    }

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from('tenants')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (deleteError) {
      console.error('Error suspending tenant:', deleteError);
      return NextResponse.json({ error: 'Failed to suspend tenant' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Tenant suspended' });

  } catch (error) {
    console.error('Error in tenant DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
