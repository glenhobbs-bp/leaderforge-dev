// File: apps/web/app/api/user/[user_id]/preferences/route.ts
// Purpose: User preferences API with performance optimizations and caching
// Owner: Backend team
// Tags: API, user management, preferences, caching, performance

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../../lib/userService';

/**
 * GET /api/user/[user_id]/preferences
 * Fetches user profile and preferences data.
 * Optimized with caching headers for better performance.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    const user = await userService.getUser(user_id);
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

    // Add caching headers for performance (5 minutes cache)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    response.headers.set('CDN-Cache-Control', 'public, max-age=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=300');

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
 * Updates user profile and/or preferences data.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const body = await request.json();

    // Separate profile fields from preferences
    const { first_name, last_name, full_name, avatar_url, ...preferences } = body;

    const profileFields: Record<string, string> = {};
    if (first_name !== undefined) profileFields.first_name = first_name;
    if (last_name !== undefined) profileFields.last_name = last_name;
    if (full_name !== undefined) profileFields.full_name = full_name;
    if (avatar_url !== undefined) profileFields.avatar_url = avatar_url;

    // Update both profile and preferences if both are provided
    let updatedUser;
    if (Object.keys(profileFields).length > 0 && Object.keys(preferences).length > 0) {
      updatedUser = await userService.updateUserProfileAndPreferences(user_id, profileFields, preferences);
    } else if (Object.keys(profileFields).length > 0) {
      updatedUser = await userService.updateUserProfile(user_id, profileFields);
    } else if (Object.keys(preferences).length > 0) {
      updatedUser = await userService.updateUserPreferences(user_id, preferences);
    } else {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
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