import { NextRequest, NextResponse } from "next/server";
import { cookies as nextCookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { createClient } from '@supabase/supabase-js';
import { AgentService } from '../../../lib/agentService';

/**
 * POST /api/agent/content
 * Agent-native: Thin API that looks up the agent from navigation and invokes it.
 * Follows the architectural principle: APIs only invoke agents and return their schema.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, contextKey, navOptionId, intent } = body;

    console.log('[API/agent/content] Request:', { userId, contextKey, navOptionId, intent });

    // Get user session for authentication (using same method as avatar API)
    const cookieStore = await nextCookies();
    const allCookies = cookieStore.getAll();
    console.log('[API/agent/content] Cookies available:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 10) + '...' })));

    // Extract tokens like the avatar API does
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
    console.log('[API/agent/content] Extracted tokens:', { accessToken: accessToken ? 'present' : 'missing', refreshToken: refreshToken ? 'present' : 'missing' });

    const supabase = createSupabaseServerClient(cookieStore);

    // Manually restore session if tokens are present
    if (accessToken && refreshToken) {
      const setSessionRes = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      console.log('[API/agent/content] setSession result:', setSessionRes.error ? { error: setSessionRes.error } : 'success');
    } else {
      console.warn('[API/agent/content] Missing access or refresh token in cookies');
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[API/agent/content] Auth result:', { user: session?.user?.id, error: sessionError });

    if (sessionError || !session?.user) {
      console.error('[API/agent/content] Auth error:', sessionError);
      return NextResponse.json({
        type: 'AuthError',
        message: 'Authentication required',
        details: {
          error: sessionError?.message || 'No session',
          cookieCount: allCookies.length
        }
      }, { status: 401 });
    }

    const user = session.user;

    const effectiveUserId = userId || user.id;

    // Use service role for database lookups to avoid RLS issues
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Look up the navigation option to get the agent_id
    console.log('[API/agent/content] Looking up navOptionId:', navOptionId, 'in context:', contextKey);

    const { data: navOption, error: queryError } = await serviceSupabase
      .schema('core')
      .from('nav_options')
      .select('*')
      .eq('context_key', contextKey)
      .eq('id', navOptionId)
      .single();

    if (queryError || !navOption) {
      console.error('[API/agent/content] Navigation lookup error:', queryError);
      return NextResponse.json({
        type: 'NavOptionNotFound',
        message: 'Navigation option not found',
        details: { contextKey, navOptionId }
      }, { status: 404 });
    }

    console.log('[API/agent/content] Found nav option:', navOption);

    // 2. Check if nav option has an agent_id
    if (!navOption.agent_id) {
      console.log('[API/agent/content] No agent assigned to nav option, returning fallback');
      return NextResponse.json({
        type: 'no_agent',
        message: 'No agent assigned to this navigation option',
        fallback: {
          type: 'message',
          content: `No agent configured for ${navOption.label}. Please contact support.`
        }
      });
    }

    // 3. Look up the agent from the database
    const { data: agent, error: agentError } = await serviceSupabase
      .schema('core')
      .from('agents')
      .select('*')
      .eq('id', navOption.agent_id)
      .single();

    if (agentError || !agent) {
      console.error('[API/agent/content] Agent lookup error:', agentError);
      return NextResponse.json({
        type: 'AgentNotFound',
        message: 'Agent not found',
        details: { agentId: navOption.agent_id }
      }, { status: 404 });
    }

    console.log('[API/agent/content] Found agent:', { id: agent.id, name: agent.name, type: agent.type });

    // 4. Invoke the agent based on its type using AgentService
    try {
      const agentService = new AgentService(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        process.env.LANGGRAPH_URL || 'http://localhost:8000'
      );

      const agentResponse = await agentService.invokeAgent(agent.id, {
        message: intent?.message || `Show me content for ${navOption.label}`,
        userId: effectiveUserId,
        contextKey,
        navOptionId,
        metadata: { navOption, agent }
      });

      console.log('[API/agent/content] Agent response:', agentResponse);
      return NextResponse.json(agentResponse);

    } catch (agentError) {
      console.error('[API/agent/content] Agent invocation error:', agentError);
      return NextResponse.json({
        type: 'AgentError',
        message: 'Agent invocation failed',
        error: agentError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[API/agent/content] Unexpected error:', error);
    return NextResponse.json({
      type: 'ServerError',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// (Optional) Remove or update the GET handler if not needed.