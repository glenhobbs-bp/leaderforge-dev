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
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === 'development' || process.env.FORCE_DEV === 'true';

  // Enhanced logging for production debugging
  if (isDev) {
    console.log('[PREFERENCES API] 🚀 Starting preferences fetch for user:', {
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      forceDev: process.env.FORCE_DEV
    });
  }

  try {
    const { user_id } = await params;

    if (isDev) {
      console.log('[PREFERENCES API] 📋 User ID:', user_id);
    }

    // Fast path: Check for session existence without expensive restoration
    const cookieStore = await cookies();
    const projectRef = 'pcjaagjqydyqfsthsmac';
    const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
    const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

    if (isDev) {
      console.log('[PREFERENCES API] 🍪 Tokens check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
    }

    // If no tokens, immediately fail with 401
    if (!accessToken || !refreshToken) {
      if (isDev) {
        console.log('[PREFERENCES API] ❌ No tokens found, returning 401');
      }
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Wrap session restoration in a shorter timeout to prevent hanging
    const authPromise = (async () => {
      if (isDev) {
        console.log('[PREFERENCES API] 🔐 Starting session restoration...');
      }

      const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

      if (isDev) {
        console.log('[PREFERENCES API] 🔐 Session restoration result:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          targetUserId: user_id,
          error: sessionError?.message
        });
      }

      if (sessionError || !session || session.user.id !== user_id) {
        throw new Error('Authentication failed');
      }

      return { supabase };
    })();

    // More aggressive timeout for production (1 second instead of 2)
    const authTimeout = isDev ? 2000 : 1000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timeout')), authTimeout)
    );

    const { supabase } = await Promise.race([authPromise, timeoutPromise]);

    if (isDev) {
      console.log('[PREFERENCES API] ✅ Authentication successful, querying database...');
    }

    // Wrap database operations in timeout to prevent hanging
    const dbPromise = (async () => {
      const { data: user, error: userError } = await supabase
        .schema('core')
        .from('users')
        .select('*')
        .eq('id', user_id)
        .single();

      if (isDev) {
        console.log('[PREFERENCES API] 📊 Database query result:', {
          hasUser: !!user,
          hasPreferences: !!user?.preferences,
          error: userError?.message
        });
      }

      if (userError) {
        console.error('[API] Error fetching user preferences:', userError);
        throw new Error('Failed to fetch user data');
      }

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    })();

    // More aggressive timeout for production (2 seconds instead of 3)
    const dbTimeout = isDev ? 3000 : 2000;
    const dbTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), dbTimeout)
    );

    const user = await Promise.race([dbPromise, dbTimeoutPromise]);

    const totalTime = Date.now() - startTime;

    // Return both user profile and preferences
    if (isDev) {
      console.log('[API] 📊 User preferences fetched successfully:', {
        userId: user.id,
        preferences: user.preferences,
        navigationState: user.preferences?.navigationState,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      });
    }

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

    // ✅ FIX: Disable caching to ensure navigation state changes are immediately visible
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-cache');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-cache');

    return response;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (isDev) {
      console.error('[PREFERENCES API] ❌ Error after', `${totalTime}ms:`, errorMessage);
    }

    // Return appropriate error codes based on error type
    if (errorMessage.includes('timeout') || errorMessage.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication timeout' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('User not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('[GET /api/user/preferences] Error:', errorMessage);
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