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

    // Fast path: Check for session existence without expensive restoration
    const cookieStore = await cookies();
    const projectRef = 'pcjaagjqydyqfsthsmac';
    const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
    const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

    // If no tokens, immediately fail with 401
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Wrap session restoration in a shorter timeout to prevent hanging
    const authPromise = (async () => {
      const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

      if (sessionError || !session || session.user.id !== userId) {
        throw new Error('Authentication failed');
      }

      return { session, supabase };
    })();

    // 2-second timeout for auth operations (faster than default 3s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timeout')), 2000)
    );

    const { supabase } = await Promise.race([authPromise, timeoutPromise]);

    // Wrap database operations in timeout to prevent hanging
    const dbPromise = (async () => {
      const { data: user, error: userError } = await supabase
        .schema('core')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[API] Error fetching user profile:', userError);
        throw new Error('Failed to fetch user profile');
      }

      return user;
    })();

    // 3-second timeout for database operations
    const dbTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    const user = await Promise.race([dbPromise, dbTimeoutPromise]) as User;

    return NextResponse.json({ user });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return appropriate error codes based on error type
    if (errorMessage.includes('timeout') || errorMessage.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication timeout' },
        { status: 401 }
      );
    }

    console.error('[API] Error in user profile GET:', errorMessage);
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