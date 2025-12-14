// File: apps/web/app/api/user/[user_id]/profile/route.ts
// Purpose: SSR-compliant API endpoint for user profile operations
// Owner: Backend team
// Tags: API endpoint, user profile, SSR auth

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';
import type { User } from '../../../../lib/types';

/**
 * GET /api/user/[user_id]/profile
 * Get user profile data with SSR authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

        // SSR-first authentication with robust session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with authenticated context (respects RLS)
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[API] Error fetching user profile:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: user as User });
  } catch (error) {
    console.error('[API] Error in user profile GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/[user_id]/profile
 * Update user profile data with SSR authentication
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

    // Validate input
    const { first_name, last_name, full_name, avatar_url } = body;
    if (!first_name && !last_name && !full_name && !avatar_url) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
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

    // Update user profile with authenticated context (respects RLS)
    const updateData: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data: updatedUser, error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser as User });
  } catch (error) {
    console.error('[API] Error in user profile PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}