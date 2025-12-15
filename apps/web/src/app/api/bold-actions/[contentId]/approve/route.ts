/**
 * File: src/app/api/bold-actions/[contentId]/approve/route.ts
 * Purpose: API route for team leaders to approve bold action completions
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardGamification } from '@/lib/gamification';

type RouteParams = {
  params: Promise<{ contentId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { boldActionId } = body;

    if (!boldActionId) {
      return NextResponse.json({ error: 'Bold action ID required' }, { status: 400 });
    }

    // Get the bold action
    const { data: boldAction, error: fetchError } = await supabase
      .from('bold_actions')
      .select('id, user_id, status')
      .eq('id', boldActionId)
      .single();

    if (fetchError || !boldAction) {
      return NextResponse.json({ error: 'Bold action not found' }, { status: 404 });
    }

    // Verify the bold action is pending approval
    if (boldAction.status !== 'pending_approval') {
      return NextResponse.json({ 
        error: 'Bold action is not pending approval' 
      }, { status: 400 });
    }

    // Verify the current user is the manager of the bold action's user
    const { data: membership } = await supabase
      .from('memberships')
      .select('manager_id')
      .eq('user_id', boldAction.user_id)
      .eq('is_active', true)
      .single();

    if (!membership || membership.manager_id !== user.id) {
      return NextResponse.json({ 
        error: 'Not authorized to approve this bold action' 
      }, { status: 403 });
    }

    // Approve the bold action
    const { data: updatedBoldAction, error: updateError } = await supabase
      .from('bold_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', boldActionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving bold action:', updateError);
      return NextResponse.json({ error: 'Failed to approve bold action' }, { status: 500 });
    }

    // Award gamification points to the user whose bold action was approved
    const { data: targetUserData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', boldAction.user_id)
      .single();
    
    if (targetUserData?.tenant_id) {
      await awardGamification(supabase, targetUserData.tenant_id, boldAction.user_id, 'bold_action_complete', contentId);
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedBoldAction 
    });

  } catch (error) {
    console.error('Error in bold action approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

