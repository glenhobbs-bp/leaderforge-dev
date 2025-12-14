/**
 * File: src/app/api/bold-actions/[contentId]/route.ts
 * Purpose: API routes for Bold Action tracking
 * Owner: Core Team
 * 
 * Bold Actions are commitments made during worksheet completion.
 * Part of the 4-step module completion workflow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

/**
 * GET /api/bold-actions/[contentId]
 * Get user's bold action for a specific content item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: boldAction, error } = await supabase
      .from('bold_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching bold action:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bold action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: boldAction || null,
    });
  } catch (error) {
    console.error('Bold action GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bold-actions/[contentId]
 * Create or update a bold action commitment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { actionDescription } = body;

    if (!actionDescription || typeof actionDescription !== 'string' || !actionDescription.trim()) {
      return NextResponse.json(
        { success: false, error: 'Action description is required' },
        { status: 400 }
      );
    }

    // Upsert bold action
    const { data: boldAction, error } = await supabase
      .from('bold_actions')
      .upsert({
        tenant_id: userData.tenant_id,
        user_id: user.id,
        content_id: contentId,
        action_description: actionDescription.trim(),
        status: 'pending',
        committed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,content_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bold action:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save bold action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: boldAction,
    });
  } catch (error) {
    console.error('Bold action POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bold-actions/[contentId]
 * Update bold action status (complete/cancel) with optional reflection data
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      completionNotes,
      // Reflection data
      completion_status,
      reflection_text,
      challenge_level,
      would_repeat,
    } = body;

    if (!status || !['completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    if (status === 'completed') {
      updateData.completed_at = now;
      updateData.signoff_type = 'self'; // Self-certification by default
      updateData.signed_off_by = user.id;
      updateData.signed_off_at = now;
      
      // Legacy completion notes field
      if (completionNotes) {
        updateData.completion_notes = completionNotes;
      }
      
      // New reflection fields
      if (completion_status) {
        updateData.completion_status = completion_status;
      }
      if (reflection_text !== undefined) {
        updateData.reflection_text = reflection_text;
      }
      if (challenge_level !== undefined) {
        updateData.challenge_level = challenge_level;
      }
      if (would_repeat !== undefined) {
        updateData.would_repeat = would_repeat;
      }
    }

    const { data: boldAction, error } = await supabase
      .from('bold_actions')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bold action:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update bold action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: boldAction,
    });
  } catch (error) {
    console.error('Bold action PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

