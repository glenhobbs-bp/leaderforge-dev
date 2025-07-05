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

    // Fast path: Check for session existence without expensive restoration
    const cookieStore = await cookies();
    const projectRef = 'pcjaagjqydyqfsthsmac';
    const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
    const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

    // If no tokens, skip navigation state update (user is logging out)
    if (!accessToken && !refreshToken) {
      return NextResponse.json({ success: true, skipped: 'no_session' });
    }

    // Only do full session restoration if we have tokens
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== userId) {
      // Don't fail hard during logout - just skip the update
      return NextResponse.json({ success: true, skipped: 'auth_failed' });
    }

        // Optimized database operations with change detection
    const dbPromise = Promise.race([
      (async () => {
        // Get current user preferences
        const { data: user, error: userError } = await supabase
          .schema('core')
          .from('users')
          .select('preferences')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('[API] Error fetching user:', userError);
          throw new Error('Failed to fetch user data');
        }

        const currentPrefs = user?.preferences || {};
        const currentNavState = currentPrefs.navigationState;

        // Skip update if values haven't changed (performance optimization)
        if (currentNavState?.lastTenant === tenantKey &&
            currentNavState?.lastNavOption === navOptionId) {
          return { success: true, skipped: 'no_change' };
        }

        // Update navigation state in user preferences
        const timestamp = new Date().toISOString();
        const updatedPrefs = {
          ...currentPrefs,
          navigationState: {
            ...currentNavState,
            lastTenant: tenantKey,
            lastNavOption: navOptionId,
            lastUpdated: timestamp
          }
        };

        console.log('[API] 📊 Navigation state update:', {
          userId,
          tenantKey,
          navOptionId,
          currentPrefs,
          updatedPrefs,
          timestamp
        });

        // Update with authenticated user context (respects RLS)
        const { error: updateError } = await supabase
          .schema('core')
          .from('users')
          .update({
            preferences: updatedPrefs,
            updated_at: timestamp
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[API] Error updating navigation state:', updateError);
          throw new Error('Failed to update navigation state');
        }

        console.log('[API] ✅ Navigation state saved successfully to database');
        return { success: true, preferences: updatedPrefs };
      })(),
      // 1.5-second timeout for optimized operations
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout')), 1500);
      })
    ]);

    const result = await dbPromise;
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error updating navigation state:', error);
    // During logout, don't fail hard - return success to avoid blocking
    return NextResponse.json({ success: true, skipped: 'error' });
  }
}