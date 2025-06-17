import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import { createContentLibraryAgent } from "agent-core";
import { cookies as nextCookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { navService } from '../../../lib/navService';

/**
 * POST /api/agent/content
 * Agent-native: invokes the LangGraph ContentLibraryAgent.
 * Expects { userId, contextKey, navOptionId, intent } in the request body.
 * Returns the schema built by the agent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[API] /api/agent/content POST body:', body);
    const { userId, contextKey, navOptionId, intent } = body;

    // Hydrate SSR session
    const cookieStore = await nextCookies();
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
    const supabase = createSupabaseServerClient(cookieStore);

    if (accessToken && refreshToken) {
      const setSessionRes = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      console.log('[API/agent/content] setSession result:', setSessionRes);
    } else {
      console.warn('[API/agent/content] Missing access or refresh token in cookies. SSR auth will likely fail.');
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('[API/agent/content] Supabase user:', user, 'Session error:', error);

    // Look up nav option by id
    if (!navOptionId) {
      return NextResponse.json({ type: 'NoContent' });
    }
    const navOption = await navService.getNavOptionById(supabase, navOptionId, userId);
    if (!navOption) {
      // Could be access denied or not found
      return NextResponse.json({ type: 'AccessDenied' });
    }
    if (!navOption.agent_id) {
      return NextResponse.json({ type: 'NoContent' });
    }

    // TODO: Look up agent config by agent_id and invoke dynamically
    // For now, fallback to createContentLibraryAgent for demo
    const agent = createContentLibraryAgent();
    const initialState = {
      userId: userId || '',
      contextKey: contextKey || '',
      intent: intent,
      contentList: [],
      progressMap: {},
      schema: null,
      updateResult: null,
      __input: {
        userId: userId || '',
        contextKey: contextKey || '',
        intent: intent,
      },
    };
    console.log('[API] Invoking agent with initialState:', initialState);
    const result = await agent.invoke(initialState);
    console.log('[API] Agent result:', result);
    console.log('[API] Agent result.schema:', result.schema);
    return NextResponse.json(result.schema);
  } catch (error) {
    console.error('[API] Error in /api/agent/content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// (Optional) Remove or update the GET handler if not needed.