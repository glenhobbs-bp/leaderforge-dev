/**
 * File: src/app/api/worksheet/[contentId]/route.ts
 * Purpose: API routes for worksheet submissions
 * Owner: Core Team
 * 
 * When a worksheet is submitted with a bold action, this also
 * creates/updates the corresponding bold_actions record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

/**
 * GET /api/worksheet/[contentId]
 * Get user's worksheet submission for a content item
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

    const { data: submission, error } = await supabase
      .from('worksheet_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching worksheet:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch worksheet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission || null,
    });
  } catch (error) {
    console.error('Worksheet GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worksheet/[contentId]
 * Submit or update worksheet responses
 * Also creates/updates bold action if provided
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
    const { responses } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid responses' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Upsert worksheet submission
    const { data: submission, error: worksheetError } = await supabase
      .from('worksheet_submissions')
      .upsert({
        tenant_id: userData.tenant_id,
        user_id: user.id,
        content_id: contentId,
        responses,
        updated_at: now,
      }, {
        onConflict: 'user_id,content_id',
      })
      .select()
      .single();

    if (worksheetError) {
      console.error('Error saving worksheet:', worksheetError);
      return NextResponse.json(
        { success: false, error: 'Failed to save worksheet' },
        { status: 500 }
      );
    }

    // If there's a bold action in the responses, create/update it too
    const boldAction = responses.boldAction || responses.bold_action;
    if (boldAction && typeof boldAction === 'string' && boldAction.trim()) {
      const { error: boldActionError } = await supabase
        .from('bold_actions')
        .upsert({
          tenant_id: userData.tenant_id,
          user_id: user.id,
          content_id: contentId,
          action_description: boldAction.trim(),
          status: 'pending',
          committed_at: now,
          updated_at: now,
        }, {
          onConflict: 'user_id,content_id',
        });

      if (boldActionError) {
        console.error('Error saving bold action:', boldActionError);
        // Don't fail the whole request, worksheet was saved
      }
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Worksheet POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
