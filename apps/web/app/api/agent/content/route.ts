import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { ENV } from '../../../../../../packages/env';

/**
 * Agent Content API Route
 *
 * Purpose: Central endpoint for agent content generation and schema composition
 * Owner: Engineering Team
 * Tags: #agents #content #schema #api
 * Deployment: Updated 2025-06-28 with improved environment detection
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const body = await req.json();
    const { userId, tenantKey, navOptionId, intent } = body;

    if (process.env.NODE_ENV === 'development') {
      console.log('[API/agent/content] Request:', { userId, tenantKey, navOptionId, intent });
    }

    if (!userId || !tenantKey || !navOptionId) {
      console.error('[API/agent/content] Missing required fields:', { userId, tenantKey, navOptionId });
      return NextResponse.json(
        { error: 'Missing required fields: userId, tenantKey, navOptionId' },
        { status: 400 }
      );
    }

    // ✅ Use restoreSession for authentication (supports single JSON cookie format)
    const { session, supabase: authenticatedSupabase, error: sessionError } = await restoreSession(cookieStore);

    console.log('[API/agent/content] Final auth result:', {
      user: session?.user?.id,
      hasSession: !!session,
      error: sessionError?.message
    });

    if (sessionError || !session?.user) {
      console.error('[API/agent/content] Authentication failed:', sessionError?.message || 'No session');
      return NextResponse.json({
        error: 'Authentication required',
        details: {
          error: sessionError?.message || 'No session'
        }
      }, { status: 401 });
    }

    // ✅ Verify user matches session
    if (session.user.id !== userId) {
      console.error('[API/agent/content] User ID mismatch');
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    // ✅ LOOK UP AGENT FROM NAVIGATION OPTION
    console.log('[API/agent/content] Looking up agent for navigation option...');

    // Query nav_options to get the agent_id (using authenticated client)
    const { data: navOption, error: navError } = await authenticatedSupabase
      .schema('core')
      .from('nav_options')
      .select('agent_id, label, nav_key')
      .eq('id', navOptionId)
      .eq('tenant_key', tenantKey)
      .single();

    if (navError || !navOption) {
      console.error('[API/agent/content] Navigation option not found:', { navOptionId, tenantKey, error: navError });
      return NextResponse.json(
        { error: `Navigation option not found: ${navOptionId}` },
        { status: 404 }
      );
    }

    if (!navOption.agent_id) {
      console.warn('[API/agent/content] No agent assigned to navigation option:', navOption.label);
      return NextResponse.json({
        type: 'no_agent',
        message: `The ${navOption.label} feature is being prepared for you.`
      });
    }

    console.log('[API/agent/content] Found navigation option:', {
      label: navOption.label,
      agentId: navOption.agent_id
    });

    // ✅ INVOKE THE CORRECT AGENT
    console.log('[API/agent/content] Calling LangGraph agent...');
    console.log('[API/agent/content] Environment debug:', {
      NODE_ENV: ENV.NODE_ENV,
      IS_PRODUCTION: ENV.IS_PRODUCTION,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      LANGGRAPH_URL_OVERRIDE: process.env.LANGGRAPH_URL,
      LANGGRAPH_API_URL: ENV.LANGGRAPH_API_URL
    });

    console.log('[API/agent/content] 🧪 TESTING: Local → Render connection');
    console.log('[API/agent/content] Target URL:', ENV.LANGGRAPH_API_URL);

    // ✅ ARCHITECTURE COMPLIANCE: Use SSR-authenticated client, not service role
    const { createAgentService } = await import('../../../lib/agentService');
    const agentService = createAgentService(authenticatedSupabase); // User-authenticated client

    // Set authentication headers for this request
    if (session) {
      const authHeaders: Record<string, string> = {
        'Cookie': cookieStore.getAll()
          .map(cookie => `${cookie.name}=${cookie.value}`)
          .join('; ')
      };
      agentService.setAuthHeaders(authHeaders);
    }

    const agentResponse = await agentService.invokeAgent(navOption.agent_id, {
      message: intent?.message || `Show me content for ${navOption.label}`,
      userId,
      tenantKey: tenantKey,
      navOptionId,
      metadata: { navOptionId, navLabel: navOption.label }
    });

    console.log('[API/agent/content] Agent response:', agentResponse);
    return NextResponse.json(agentResponse);
  } catch (error) {
    console.error('[API/agent/content] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// (Optional) Remove or update the GET handler if not needed.