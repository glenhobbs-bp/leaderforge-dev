// File: apps/web/app/api/user/[user_id]/preferences/route.ts
// Purpose: SSR-compliant user preferences API with proper authentication
// Owner: Backend team
// Tags: API, user management, preferences, SSR auth

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';
import type { User } from '../../../../lib/types';

/**
 * GET /api/user/[user_id]/preferences
 * Fetches user profile and preferences data with SSR authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

        // SSR-first authentication with robust session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data with authenticated context (respects RLS)
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.error('[API] Error fetching user preferences:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return both user profile and preferences
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
      preferences: user.preferences || {}
    });

    // Add caching headers for performance (30 seconds cache to avoid navigation state staleness)
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    response.headers.set('CDN-Cache-Control', 'public, max-age=30');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=30');

    return response;
  } catch (error) {
    console.error('[GET /api/user/preferences] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/[user_id]/preferences
 * Updates user profile and/or preferences data with SSR authentication.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const body = await request.json();

        // SSR-first authentication with robust session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Separate profile fields from preferences
    const { first_name, last_name, full_name, avatar_url, ...preferences } = body;

    const profileFields: Partial<User> = {};
    if (first_name !== undefined) profileFields.first_name = first_name;
    if (last_name !== undefined) profileFields.last_name = last_name;
    if (full_name !== undefined) profileFields.full_name = full_name;
    if (avatar_url !== undefined) profileFields.avatar_url = avatar_url;

    // Prepare update data
    const updateData: Partial<User> = {
      updated_at: new Date().toISOString()
    };

    // Add profile fields if any
    if (Object.keys(profileFields).length > 0) {
      Object.assign(updateData, profileFields);
    }

    // Add preferences if any
    if (Object.keys(preferences).length > 0) {
      updateData.preferences = preferences;
    }

    // Validate that we have something to update
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update with authenticated user context (respects RLS)
    const { data: updatedUser, error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating user preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user data' },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Return updated user data with no-cache headers (data was just modified)
    const response = NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        full_name: updatedUser.full_name,
        avatar_url: updatedUser.avatar_url,
      },
      preferences: updatedUser.preferences || {}
    });

    // No caching for updated data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;
  } catch (error) {
    console.error('[PUT /api/user/preferences] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}