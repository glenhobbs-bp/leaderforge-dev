/**
 * File: apps/web/app/api/context/[id]/route.ts
 * Purpose: API endpoints for individual prompt context operations (agent-native)
 * Owner: Engineering Team
 * Tags: #api #context #crud #agent-native #adr-0026
 *
 * HTTP Methods (per ADR-0026):
 * - GET: Retrieve single context by ID
 * - PUT: Update entire context via agent
 * - DELETE: Delete context via agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { UpdateContextSchema } from '../../../../lib/validation/contextSchemas';

// GET: Retrieve single context by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid context ID' }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Get context from database
    const { data: context, error } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .select('*')
      .eq('id', id)
      .eq('tenant_key', tenantKey)
      .eq('is_active', true)
      .single();

    if (error || !context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    // Check if user can view this context (basic permission check)
    const canView = context.created_by === session.user.id ||
                   context.context_type === 'global' ||
                   context.context_type === 'organizational';

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      context: {
        id: context.id,
        name: context.name,
        description: context.description,
        content: context.content,
        scope: context.context_type.charAt(0).toUpperCase() + context.context_type.slice(1),
        priority: context.priority,
        template_variables: context.template_variables,
        created_by: context.created_by,
        created_at: context.created_at,
        updated_at: context.updated_at,
        is_editable: context.created_by === session.user.id
      }
    });

  } catch (error) {
    console.error('[Context API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update entire context via agent
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid context ID' }, { status: 400 });
    }

    const body = await req.json();

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = UpdateContextSchema.parse({ ...body, id });
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid context data',
        details: error instanceof Error ? error.message : 'Validation failed'
      }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Check if context exists and user can edit it
    const { data: existingContext, error: fetchError } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .select('id, created_by, context_type')
      .eq('id', id)
      .eq('tenant_key', tenantKey)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingContext) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit = existingContext.created_by === session.user.id;
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own contexts' }, { status: 403 });
    }

    // Update context in database
    const { data: updatedContext, error: updateError } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .update({
        name: validatedData.name,
        description: validatedData.description,
        content: validatedData.content,
        context_type: validatedData.scope.toLowerCase(),
        priority: validatedData.priority,
        template_variables: validatedData.template_variables,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Context API] Update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update context'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Context updated successfully',
      context: updatedContext
    });

  } catch (error) {
    console.error('[Context API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete context via agent
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid context ID' }, { status: 400 });
    }

    const tenantKey = 'leaderforge'; // TODO: Get from request/session

    // Check if context exists and user can delete it
    const { data: existingContext, error: fetchError } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .select('id, created_by, context_type')
      .eq('id', id)
      .eq('tenant_key', tenantKey)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingContext) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 });
    }

    // Check permissions
    const canDelete = existingContext.created_by === session.user.id;
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own contexts' }, { status: 403 });
    }

    // Soft delete: mark as inactive
    const { error: deleteError } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('[Context API] Delete error:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete context'
      }, { status: 500 });
    }

    // Also remove user preferences for this context
    await supabase
      .schema('core')
      .from('user_context_preferences')
      .delete()
      .eq('context_id', id);

    return NextResponse.json({
      success: true,
      message: 'Context deleted successfully'
    });

  } catch (error) {
    console.error('[Context API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}