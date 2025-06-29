/**
 * Debug Mockups API Route
 *
 * Purpose: Debug endpoint to check available mockups and their status
 * Owner: Product Team
 * Tags: #debug #mockups #feature-flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { getAllMockups, isMockupEnabled } from '../../../../lib/mockups';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Get session for current user if no user_id provided
    let currentUserId = userId;
    if (!currentUserId) {
      const cookieStore = await cookies();
      const { session } = await restoreSession(cookieStore);
      currentUserId = session?.user?.id;
    }

    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all available mockups
    const allMockups = getAllMockups();

    // Check status for each mockup
    const mockupStatus = allMockups.map(({ navOptionId, config }) => ({
      navOptionId,
      name: config.name,
      description: config.description,
      featureFlag: config.featureFlag,
      enabledForAll: config.enabledForAll,
      enabledUsers: config.enabledUsers,
      isEnabled: isMockupEnabled(navOptionId, currentUserId),
      isCurrentUser: config.enabledUsers?.includes(currentUserId) || false
    }));

    return NextResponse.json({
      userId: currentUserId,
      environment: process.env.NODE_ENV,
      totalMockups: allMockups.length,
      enabledMockups: mockupStatus.filter(m => m.isEnabled).length,
      mockups: mockupStatus,
      instructions: {
        usage: 'Navigate to any nav option with an enabled mockup to see it in action',
        devMode: 'All mockups are enabled in development mode',
        production: 'Only specific users see mockups in production'
      }
    });

  } catch (error) {
    console.error('[Debug] Mockups check error:', error);
    return NextResponse.json({ error: 'Debug check failed' }, { status: 500 });
  }
}