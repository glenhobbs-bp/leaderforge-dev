import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { AgentService } from '../../../lib/agentService';

/**
 * POST /api/agent/content
 * Agent-native: Thin API that looks up the agent from navigation and invokes it.
 * Follows the architectural principle: APIs only invoke agents and return their schema.
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  try {
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

    console.log('[API/agent/content] Calling LangGraph agent...');
    const agentService = new AgentService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      process.env.LANGGRAPH_URL || 'http://localhost:8000'
    );

    // For now, use a default agent ID until we implement nav-option-to-agent mapping
    const defaultAgentId = 'd9f0bd53-ec61-4dfc-95fe-8f3355d293b9'; // leaderforgeContentLibrary

    const agentResponse = await agentService.invokeAgent(defaultAgentId, {
      message: intent?.message || `Show me content for navigation option ${navOptionId}`,
      userId,
      tenantKey: tenantKey,
      navOptionId,
      metadata: { navOptionId }
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