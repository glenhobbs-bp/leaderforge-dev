/**
 * File: src/app/api/tenant-admin/organizations/route.ts
 * Purpose: API routes for tenant admin to manage organizations
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all organizations for tenant
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

    // Fetch organizations for this tenant with stats
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('name');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Get stats for each org
    const orgsWithStats = await Promise.all(
      (organizations || []).map(async (org) => {
        // Member count
        const { count: memberCount } = await supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Active member count
        const { count: activeMemberCount } = await supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true);

        // Team count
        const { count: teamCount } = await supabase
          .from('teams')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        return {
          ...org,
          stats: {
            totalMembers: memberCount || 0,
            activeMembers: activeMemberCount || 0,
            teams: teamCount || 0,
          },
        };
      })
    );

    return NextResponse.json({ organizations: orgsWithStats });

  } catch (error) {
    console.error('Error in organizations GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
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
    const { name, branding, settings } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Check for duplicate name within tenant
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('tenant_id', userData.tenant_id)
      .ilike('name', name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'An organization with this name already exists' }, { status: 400 });
    }

    // Create organization
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        tenant_id: userData.tenant_id,
        name: name.trim(),
        branding: branding || {},
        settings: settings || { signoff_mode: 'self_certify' },
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating organization:', createError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    return NextResponse.json({ organization: newOrg }, { status: 201 });

  } catch (error) {
    console.error('Error in organizations POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
