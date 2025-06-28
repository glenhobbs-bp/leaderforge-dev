/**
 * Debug Navigation Options API Route
 *
 * Purpose: Debug endpoint to check actual navigation options in database
 * Owner: Engineering Team
 * Tags: #debug #navigation #database
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantKey = searchParams.get('tenant') || 'leaderforge';

    const cookieStore = await cookies();
    const { supabase } = await restoreSession(cookieStore);

    // Get all navigation options for the tenant
    const { data: navOptions, error } = await supabase
      .schema('core')
      .from('nav_options')
      .select('id, nav_key, label, tenant_key, agent_id, section, order, created_at')
      .eq('tenant_key', tenantKey)
      .order('section_order', { ascending: true })
      .order('order', { ascending: true });

    if (error) {
      console.error('[Debug] Navigation options query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also check if the specific failing UUID exists anywhere
    const failingUuid = '3202016b-05fa-4db6-bbc7-c785ba898e2f';
    const { data: specificOption, error: specificError } = await supabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('id', failingUuid)
      .maybeSingle();

    return NextResponse.json({
      tenant: tenantKey,
      totalOptions: navOptions?.length || 0,
      options: navOptions,
      failingUuidCheck: {
        uuid: failingUuid,
        exists: !!specificOption,
        data: specificOption,
        error: specificError
      }
    });

  } catch (error) {
    console.error('[Debug] Navigation check error:', error);
    return NextResponse.json({ error: 'Debug check failed' }, { status: 500 });
  }
}