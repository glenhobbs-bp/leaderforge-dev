// File: apps/web/app/api/nav/option-details/route.ts
// Purpose: API route to get navigation option details for routing decisions
// Owner: Frontend team
// Tags: navigation, routing, API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';

export async function POST(req: NextRequest) {
  try {
    const { navOptionId, tenantKey } = await req.json();

    if (!navOptionId || !tenantKey) {
      return NextResponse.json(
        { error: 'Missing navOptionId or tenantKey' },
        { status: 400 }
      );
    }

    // Restore session for authentication
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

        // Get navigation option details with agent type information
    const { data: navOption, error: navError } = await supabase
      .schema('core')
      .from('nav_options')
      .select(`
        id,
        nav_key,
        agent_id,
        label,
        required_entitlements
      `)
      .eq('id', navOptionId)
      .eq('tenant_key', tenantKey)
      .single();

    // Get agent type separately if agent_id exists
    let agentType = null;
    if (navOption?.agent_id) {
      const { data: agent } = await supabase
        .schema('core')
        .from('agents')
        .select('type')
        .eq('id', navOption.agent_id)
        .single();

      agentType = agent?.type || null;
    }

    if (navError || !navOption) {
      console.error('[API] Navigation option not found:', { navOptionId, tenantKey, error: navError });
      return NextResponse.json(
        { error: 'Navigation option not found' },
        { status: 404 }
      );
    }

    // Check user entitlements if required
    if (navOption.required_entitlements && navOption.required_entitlements.length > 0) {
      const { data: userEntitlements, error: entitlementError } = await supabase
        .schema('core')
        .from('user_entitlements')
        .select('entitlements(name)')
        .eq('user_id', session.user.id)
        .is('revoked_at', null);

      if (entitlementError) {
        console.error('[API] Error checking user entitlements:', entitlementError);
        return NextResponse.json(
          { error: 'Failed to check permissions' },
          { status: 500 }
        );
      }

      const userEntitlementNames = userEntitlements
        ?.map(ue => {
          const entitlement = ue.entitlements as { name?: string } | null;
          return entitlement?.name;
        })
        .filter((name): name is string => Boolean(name)) || [];

      const hasRequiredEntitlements = navOption.required_entitlements.every(
        (entitlement: string) => userEntitlementNames.includes(entitlement)
      );

      if (!hasRequiredEntitlements) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

            // Determine routing type based on configuration
    let routingType = 'agent'; // default

    if (navOption.nav_key && !navOption.agent_id) {
      routingType = 'direct';
    } else if (navOption.agent_id && agentType === 'static_page') {
      routingType = 'static_page';
    } else if (navOption.agent_id) {
      routingType = 'agent';
    }

    console.log('[API] Navigation option details retrieved:', {
      id: navOption.id,
      label: navOption.label,
      nav_key: navOption.nav_key,
      has_agent: !!navOption.agent_id,
      agent_type: agentType,
      routing_type: routingType
    });

    // Return navigation option details
    return NextResponse.json({
      id: navOption.id,
      nav_key: navOption.nav_key,
      agent_id: navOption.agent_id,
      label: navOption.label,
      agent_type: agentType,
      routing_type: routingType
    });

  } catch (error) {
    console.error('[API] Error in option-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}