import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
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
    const supabase = createSupabaseServerClient(cookieStore);

    const body = await req.json();
    const { userId, tenantKey, navOptionId, intent } = body;

    console.log('[API/agent/content] Request:', { userId, tenantKey, navOptionId, intent });

    if (!userId || !tenantKey || !navOptionId) {
      console.error('[API/agent/content] Missing required fields:', { userId, tenantKey, navOptionId });
      return NextResponse.json(
        { error: 'Missing required fields: userId, tenantKey, navOptionId' },
        { status: 400 }
      );
    }

    // ✅ Robust Session Restoration with Token Refresh Handling
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    let session = null;
    let sessionError = null;

    // Try to restore session if tokens are present
    if (accessToken && refreshToken) {
      console.log('[API/agent/content] Attempting session restoration...');

      try {
        const setSessionRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionRes.error) {
          console.log('[API/agent/content] setSession failed:', setSessionRes.error.message);

          // If JWT is invalid, try refresh
          if (setSessionRes.error.message.includes('JWT') || setSessionRes.error.message.includes('expired')) {
            console.log('[API/agent/content] Attempting token refresh...');

            const refreshRes = await supabase.auth.refreshSession();
            if (refreshRes.error) {
              console.log('[API/agent/content] Token refresh failed:', refreshRes.error.message);
              sessionError = refreshRes.error;
            } else {
              console.log('[API/agent/content] Token refresh successful');
              session = refreshRes.data.session;
            }
          } else {
            sessionError = setSessionRes.error;
          }
        } else {
          console.log('[API/agent/content] Session restored successfully');
          session = setSessionRes.data.session;
        }
      } catch (error) {
        console.log('[API/agent/content] Session restoration threw error:', error.message);
        sessionError = error;
      }
    } else {
      console.warn('[API/agent/content] Missing access or refresh token in cookies');
    }

    // Final session check - try one more time to get current session
    if (!session) {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      session = currentSession;
      if (currentError && !sessionError) {
        sessionError = currentError;
      }
    }

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
          error: sessionError?.message || 'No session',
          cookieCount: allCookies.length,
          hasTokens: !!(accessToken && refreshToken)
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

    // Query nav_options to get the agent_id
    const { data: navOption, error: navError } = await supabase
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

    // Import AgentService dynamically to avoid import-time environment variable access
    const { getAgentService } = await import('../../../lib/agentService');
    const agentService = getAgentService();

    // Set authentication headers for this request
    if (accessToken) {
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