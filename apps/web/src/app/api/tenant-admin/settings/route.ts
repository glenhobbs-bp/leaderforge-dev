/**
 * File: src/app/api/tenant-admin/settings/route.ts
 * Purpose: API routes for tenant admin to manage tenant settings and theming
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get tenant settings
export async function GET() {
  try {
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

    // Fetch tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', userData.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });

  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update tenant settings
export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { display_name, theme, settings } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update display name
    if (display_name !== undefined) {
      if (!display_name?.trim()) {
        return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 });
      }
      updates.display_name = display_name.trim();
    }

    // Update theme
    if (theme !== undefined) {
      // Get current theme to merge
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('theme')
        .eq('id', userData.tenant_id)
        .single();

      // Validate theme colors (basic hex validation)
      const colorFields = ['primary', 'secondary', 'accent', 'background', 'surface', 'text_primary', 'text_secondary'];
      for (const field of colorFields) {
        if (theme[field] && !/^#[0-9A-Fa-f]{6}$/.test(theme[field])) {
          return NextResponse.json({ error: `Invalid color format for ${field}. Use hex format like #FFFFFF` }, { status: 400 });
        }
      }

      // Merge with existing theme
      updates.theme = {
        ...(currentTenant?.theme || {}),
        ...theme,
      };
    }

    // Update settings
    if (settings !== undefined) {
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', userData.tenant_id)
        .single();

      updates.settings = {
        ...(currentTenant?.settings || {}),
        ...settings,
      };
    }

    // Update tenant
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', userData.tenant_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 });
    }

    return NextResponse.json({ tenant: updatedTenant });

  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
