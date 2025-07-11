/**
 * File: apps/web/app/api/debug/test-context-resolution/route.ts
 * Purpose: Debug endpoint to test context resolution and see what contexts are returned
 * Owner: Engineering Team
 * Tags: #debug #context #resolution
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { createContextResolutionAgent } from 'agent-core/agents/ContextResolutionAgent';

export async function GET() {
  try {
    // Get authenticated session
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'Authentication required'
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Test 1: Direct database query for contexts
    const { data: rawContexts, error: dbError } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .select('id, name, description, content, context_type, priority, tenant_key, created_by, is_active, template_variables')
      .eq('tenant_key', 'leaderforge')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Test 2: User preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .schema('core')
      .from('user_context_preferences')
      .select('context_id, is_enabled')
      .eq('user_id', userId)
      .eq('tenant_key', 'leaderforge');

    // Test 3: Agent resolution
    const agent = createContextResolutionAgent(supabase);
    const agentResult = await agent.resolveUserContexts({
      userId,
      tenantKey: 'leaderforge',
      userMessage: 'Test context resolution',
      includePreferences: true
    });

    return NextResponse.json({
      success: true,
      userId,
      tests: {
        rawContexts: {
          count: rawContexts?.length || 0,
          contexts: rawContexts?.map(ctx => ({
            id: ctx.id,
            name: ctx.name,
            type: ctx.context_type,
            priority: ctx.priority,
            hasContent: !!ctx.content?.trim(),
            contentLength: ctx.content?.length || 0,
            isActive: ctx.is_active
          })) || [],
          error: dbError
        },
        userPreferences: {
          count: userPrefs?.length || 0,
          preferences: userPrefs || [],
          error: prefsError
        },
        agentResolution: {
          appliedContextsCount: agentResult.appliedContexts?.length || 0,
          appliedContexts: agentResult.appliedContexts || [],
          resolvedContextsCount: agentResult.resolvedContext?.contexts?.length || 0,
          resolvedContextNames: agentResult.resolvedContext?.contexts?.map(ctx => ctx.name) || [],
          systemInstructionsLength: agentResult.systemInstructions?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('[Debug] Context resolution test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}