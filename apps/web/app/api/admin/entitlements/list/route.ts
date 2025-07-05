/**
 * File: apps/web/app/api/admin/entitlements/list/route.ts
 * Purpose: API endpoint to list available entitlements and current user entitlements
 * Owner: Engineering Team
 * Tags: #api #admin #entitlements
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';
import { EntitlementTool } from 'agent-core/tools/EntitlementTool';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIdentifier } = body;

    console.log(`[API] Entitlements request body:`, JSON.stringify(body, null, 2));
    console.log(`[API] userIdentifier received: "${userIdentifier}" (length: ${userIdentifier?.length || 0})`);

    if (!userIdentifier) {
      return NextResponse.json(
        { error: 'userIdentifier is required' },
        { status: 400 }
      );
    }

    // Get session from cookies
    const cookieStore = await cookies();
    const { session, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const getAdminLevel = (user: { user_metadata?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean }; raw_user_meta_data?: { is_super_admin?: boolean; is_admin?: boolean; tenant_admin?: boolean; account_admin?: boolean } }) => {
      const metadata = user.user_metadata || {};
      const rawMetadata = user.raw_user_meta_data || {};

      if (metadata.is_super_admin === true || rawMetadata.is_super_admin === true) {
        return 'i49_super_admin';
      }

      if (metadata.is_admin === true || rawMetadata.is_admin === true) {
        return 'platform_admin';
      }

      if (metadata.tenant_admin || rawMetadata.tenant_admin) {
        return 'tenant_admin';
      }

      if (metadata.account_admin || rawMetadata.account_admin) {
        return 'account_admin';
      }

      return 'none';
    };

    const adminLevel = getAdminLevel(session.user);
    const isAdmin = adminLevel !== 'none';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    // Get user ID - need to properly validate UUID vs email vs name
    let userId = userIdentifier;

    // UUID pattern: 8-4-4-4-12 hex characters
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (userIdentifier.includes('@')) {
      // It's an email - look up the UUID
      let lookedUpUserId = await EntitlementTool.getUserIdByEmail(userIdentifier);

      if (!lookedUpUserId) {
        // User doesn't exist in core.users but might be authenticated
        // If this is the current user, create the record
        if (userIdentifier === session.user.email) {
          console.log(`[API] Creating missing user record for authenticated user: ${userIdentifier}`);

          // Create user in core.users table
          const { data: newUser, error: createError } = await (await import('../../../../lib/supabaseServerClient')).createSupabaseServerClient(await cookies())
            .schema('core')
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              first_name: session.user.user_metadata?.first_name || session.user.email?.split('@')[0],
              last_name: session.user.user_metadata?.last_name || '',
              enabled_modules: ['leaderforge'],
              current_module: 'leaderforge',
              preferences: { welcome_completed: false },
              status: 'active'
            })
            .select('id')
            .single();

          if (createError) {
            console.error('[API] Error creating user record:', createError);
            return NextResponse.json(
              { error: `Failed to create user record: ${createError.message}` },
              { status: 500 }
            );
          }

          lookedUpUserId = newUser.id;
          console.log(`[API] Successfully created user record with ID: ${lookedUpUserId}`);
        } else {
          return NextResponse.json(
            { error: `No user found with email: ${userIdentifier}` },
            { status: 404 }
          );
        }
      }

      userId = lookedUpUserId;
    } else if (uuidPattern.test(userIdentifier)) {
      // It's already a valid UUID
      userId = userIdentifier;
    } else {
      // It's neither email nor UUID (like "glen") - this is invalid
      return NextResponse.json(
        { error: `Invalid userIdentifier: "${userIdentifier}". Must be email address or valid UUID.` },
        { status: 400 }
      );
    }

    // Get available entitlements and current user entitlements
    const [availableEntitlements, currentEntitlements] = await Promise.all([
      EntitlementTool.getAvailableEntitlements(),
      EntitlementTool.getUserEntitlements(userId)
    ]);

    return NextResponse.json({
      available: availableEntitlements,
      current: currentEntitlements,
      userId: userId,
      userIdentifier: userIdentifier
    });

  } catch (error) {
    console.error('[API] Error listing entitlements:', error);
    return NextResponse.json(
      { error: 'Failed to load entitlements' },
      { status: 500 }
    );
  }
}