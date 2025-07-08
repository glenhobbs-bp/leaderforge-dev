/**
 * File: apps/web/app/api/context/preferences/route.ts
 * Purpose: API route for managing user context toggle preferences (agent-native)
 * Owner: Engineering Team
 * Tags: #api #context #preferences #agent-native
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { createContextResolutionAgent } from 'agent-core/agents/ContextResolutionAgent';

// GET: Fetch user's context preferences via agent
export async function GET() {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Agent-native: Use ContextResolutionAgent to orchestrate business logic
    const agent = createContextResolutionAgent(supabase);
    const result = await agent.resolveUserContexts({
      userId: session.user.id,
      tenantKey,
      includePreferences: true
    });

    return NextResponse.json({
      success: true,
      contexts: result.userPreferences,
      userHasPreferences: result.userPreferences.some(p => p.isEnabled !== undefined)
    });

  } catch (error) {
    console.error('[Context Preferences API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update user's context preference via agent
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contextId, isEnabled } = body;

    if (!contextId || typeof isEnabled !== 'boolean') {
      return NextResponse.json({
        error: 'Missing required fields: contextId (string), isEnabled (boolean)'
      }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Agent-native: Use ContextResolutionAgent to orchestrate preference update
    const agent = createContextResolutionAgent(supabase);
    const result = await agent.updateUserPreference({
      userId: session.user.id,
      contextId,
      isEnabled,
      tenantKey
    });

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to update preference'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Context preference ${isEnabled ? 'enabled' : 'disabled'}`,
      preference: {
        contextId,
        isEnabled,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Context Preferences API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Bulk update multiple context preferences via agent
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json({
        error: 'Invalid request: preferences must be an array of {contextId, isEnabled}'
      }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Agent-native: Use ContextResolutionAgent to orchestrate bulk preference update
    const agent = createContextResolutionAgent(supabase);
    const result = await agent.bulkUpdatePreferences({
      userId: session.user.id,
      tenantKey,
      preferences
    });

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to update preferences'
      }, { status: 500 });
    }

    const successCount = result.updatedPreferences?.filter(p => p.success).length || 0;
    const failedCount = (result.updatedPreferences?.length || 0) - successCount;

    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} context preferences${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
      updatedCount: successCount,
      details: result.updatedPreferences
    });

  } catch (error) {
    console.error('[Context Preferences API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}