/**
 * File: apps/web/app/api/context/route.ts
 * Purpose: API endpoints for prompt context CRUD operations (agent-native)
 * Owner: Engineering Team
 * Tags: #api #context #crud #agent-native #adr-0026
 *
 * HTTP Methods (per ADR-0026):
 * - GET: Retrieve all contexts for user (with filtering)
 * - POST: Create new context via agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../lib/supabaseServerClient';
import { createContextResolutionAgent } from 'agent-core/agents/ContextResolutionAgent';
import { CreateContextSchema, ContextFilterSchema } from '../../../lib/validation/contextSchemas';

// GET: Retrieve all contexts for user with optional filtering
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filterParams = {
      scope: searchParams.get('scope') || undefined,
      search: searchParams.get('search') || undefined,
      enabled: searchParams.get('enabled') ? searchParams.get('enabled') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Validate filter parameters
    try {
      ContextFilterSchema.parse(filterParams);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid filter parameters',
        details: error instanceof Error ? error.message : 'Validation failed'
      }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Agent-native: Use ContextResolutionAgent to orchestrate context retrieval
    const agent = createContextResolutionAgent(supabase);
    const result = await agent.resolveUserContexts({
      userId: session.user.id,
      tenantKey,
      includePreferences: true
    });

    // Filter results based on query parameters
    let filteredContexts = result.userPreferences;

    if (filterParams.scope) {
      filteredContexts = filteredContexts.filter(ctx => ctx.scope === filterParams.scope);
    }

    if (filterParams.search) {
      const searchLower = filterParams.search.toLowerCase();
      filteredContexts = filteredContexts.filter(ctx =>
        ctx.name.toLowerCase().includes(searchLower) ||
        ctx.description.toLowerCase().includes(searchLower)
      );
    }

    if (filterParams.enabled !== undefined) {
      filteredContexts = filteredContexts.filter(ctx => ctx.isEnabled === filterParams.enabled);
    }

    // Apply pagination
    const totalCount = filteredContexts.length;
    const paginatedContexts = filteredContexts.slice(
      filterParams.offset,
      filterParams.offset + filterParams.limit
    );

    return NextResponse.json({
      success: true,
      contexts: paginatedContexts,
      totalCount,
      hasMore: (filterParams.offset + filterParams.limit) < totalCount,
      filters: filterParams
    });

  } catch (error) {
    console.error('[Context API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new context via agent
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = CreateContextSchema.parse(body);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid context data',
        details: error instanceof Error ? error.message : 'Validation failed'
      }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // For now, create context directly via database until agent method is implemented
    // TODO: Implement createContext method in ContextResolutionAgent
    const { data: context, error } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        content: validatedData.content,
        context_type: validatedData.scope,
        priority: validatedData.priority,
        template_variables: validatedData.template_variables,
        tenant_key: tenantKey,
        created_by: session.user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[Context API] Database error:', error);
      return NextResponse.json({
        error: 'Failed to create context'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Context created successfully',
      context
    }, { status: 201 });

  } catch (error) {
    console.error('[Context API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}