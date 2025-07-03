/**
 * File: apps/web/app/api/dev/grant-admin-access/route.ts
 * Purpose: Development endpoint to grant admin access to current user
 * Owner: Engineering Team
 * Tags: #dev #admin #auth
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST() {
  try {
    // Get current session
    const cookieStore = await cookies();
    const { session, error } = await restoreSession(cookieStore);

    if (error || !session) {
      return NextResponse.json({
        error: 'No session found - please log in first'
      }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Update user metadata in auth.users table
    const { data: authUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...session.user.user_metadata,
          is_admin: true
        }
      }
    );

    if (updateError) {
      console.error('Failed to update user metadata:', updateError);
      return NextResponse.json({
        error: 'Failed to update user metadata',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Admin access granted to ${userEmail}`,
      instructions: 'Please log out and log back in for the changes to take effect.',
      user: {
        id: userId,
        email: userEmail,
        updated_metadata: authUser.user?.user_metadata
      }
    });
  } catch (error) {
    console.error('Error granting admin access:', error);
    return NextResponse.json({
      error: 'Failed to grant admin access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}