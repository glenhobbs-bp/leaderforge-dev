/**
 * File: apps/web/app/api/admin/entitlements/update/route.ts
 * Purpose: API endpoint to update user entitlements from the checkbox form
 * Owner: Engineering Team
 * Tags: #api #admin #entitlements
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';
import { EntitlementTool } from 'agent-core/tools/EntitlementTool';

export async function POST(request: NextRequest) {
  try {
    const { userIdentifier, entitlements } = await request.json();

    if (!userIdentifier || !Array.isArray(entitlements)) {
      return NextResponse.json(
        { error: 'userIdentifier and entitlements array are required' },
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

    // Get user ID
    let userId = userIdentifier;
    if (userIdentifier.includes('@')) {
      const lookedUpUserId = await EntitlementTool.getUserIdByEmail(userIdentifier);
      if (!lookedUpUserId) {
        return NextResponse.json(
          { error: `No user found with email: ${userIdentifier}` },
          { status: 404 }
        );
      }
      userId = lookedUpUserId;
    }

    // Update entitlements
    const success = await EntitlementTool.updateUserEntitlements(userId, entitlements);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update entitlements' },
        { status: 500 }
      );
    }

    // Get updated entitlements for confirmation
    const updatedEntitlements = await EntitlementTool.getUserEntitlements(userId);
    const availableEntitlements = await EntitlementTool.getAvailableEntitlements();

    const entitlementNames = updatedEntitlements.map(id => {
      const entitlement = availableEntitlements.find(e => e.id === id);
      return entitlement ? entitlement.display_name : id;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated entitlements for ${userIdentifier}`,
      entitlements: updatedEntitlements,
      entitlementNames: entitlementNames,
      count: updatedEntitlements.length
    });

  } catch (error) {
    console.error('[API] Error updating entitlements:', error);
    return NextResponse.json(
      { error: 'Failed to update entitlements' },
      { status: 500 }
    );
  }
}