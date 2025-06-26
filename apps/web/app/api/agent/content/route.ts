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

    // ✅ Get session with fallback restoration
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If no session, try manual hydration once
    if (!session?.user?.id) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
      const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
      const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    // Final session check
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    if (!finalSession?.user?.id) {
      console.error('[API/agent/content] Session error after restoration:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Verify user matches session
    if (finalSession.user.id !== userId) {
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