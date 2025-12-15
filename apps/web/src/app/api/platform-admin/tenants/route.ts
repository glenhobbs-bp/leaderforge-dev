/**
 * File: src/app/api/platform-admin/tenants/route.ts
 * Purpose: API routes for platform admin to manage tenants
 * Owner: LeaderForge Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all tenants with stats
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden - Platform admin required' }, { status: 403 });
    }

    // Fetch all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('display_name');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }

    // Get stats for each tenant
    const tenantsWithStats = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // Organization count
        const { count: orgCount } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        // User count (via memberships)
        const { count: userCount } = await supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);

        return {
          ...tenant,
          stats: {
            organizations: orgCount || 0,
            users: userCount || 0,
          },
        };
      })
    );

    return NextResponse.json({ tenants: tenantsWithStats });

  } catch (error) {
    console.error('Error in tenants GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden - Platform admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_key, display_name, theme, settings } = body;

    // Validate required fields
    if (!tenant_key?.trim()) {
      return NextResponse.json({ error: 'Tenant key is required' }, { status: 400 });
    }
    if (!display_name?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // Validate tenant key format (lowercase, alphanumeric, hyphens)
    const keyRegex = /^[a-z0-9-]+$/;
    if (!keyRegex.test(tenant_key.trim())) {
      return NextResponse.json({ 
        error: 'Tenant key must be lowercase alphanumeric with hyphens only' 
      }, { status: 400 });
    }

    // Check for duplicate tenant key
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('tenant_key', tenant_key.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A tenant with this key already exists' }, { status: 400 });
    }

    // Default theme
    const defaultTheme = {
      primary: '#152557',
      secondary: '#00A9E0',
      accent: '#00A9E0',
      background: '#ffffff',
      surface: '#f8fafc',
      text_primary: '#152557',
      text_secondary: '#64748b',
      font_family: 'Inter',
      border_radius: '0.5rem',
      logo_url: null,
      logo_dark_url: null,
      logo_icon_url: null,
      favicon_url: null,
    };

    // Create tenant
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        tenant_key: tenant_key.trim().toLowerCase(),
        display_name: display_name.trim(),
        theme: { ...defaultTheme, ...(theme || {}) },
        settings: settings || {},
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating tenant:', createError);
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
    }

    return NextResponse.json({ tenant: newTenant }, { status: 201 });

  } catch (error) {
    console.error('Error in tenants POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
