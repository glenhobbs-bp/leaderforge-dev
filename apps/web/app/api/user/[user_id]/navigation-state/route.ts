// File: apps/web/app/api/user/[user_id]/navigation-state/route.ts
// Purpose: API endpoint for updating user navigation state with SSR authentication
// Owner: Backend team
// Tags: API endpoint, navigation state, user preferences, SSR auth

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { tenantKey, navOptionId } = await request.json();
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

    if (!userId || !tenantKey || !navOptionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SSR-first authentication with robust session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update navigation state for the authenticated user
    // Get current user preferences
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[API] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Update navigation state in user preferences
    const currentPrefs = user?.preferences || {};
    const updatedPrefs = {
      ...currentPrefs,
      navigationState: {
        ...currentPrefs.navigationState,
        lastTenant: tenantKey,
        lastNavOption: navOptionId,
        lastUpdated: new Date().toISOString()
      }
    };

    // Update with authenticated user context (respects RLS)
    const { error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[API] Error updating navigation state:', updateError);
      return NextResponse.json(
        { error: 'Failed to update navigation state' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error updating navigation state:', error);
    return NextResponse.json(
      { error: 'Failed to update navigation state' },
      { status: 500 }
    );
  }
}