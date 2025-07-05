/**
 * File: apps/web/app/api/dev/test-entitlements/route.ts
 * Purpose: Test endpoint to verify entitlements database access
 * Owner: Engineering Team
 * Tags: #api #dev #database #test
 */

import { NextResponse } from 'next/server';
import { EntitlementTool } from 'agent-core/tools/EntitlementTool';

export async function GET() {
  try {
    console.log('Testing entitlements access...');

    // Test fetching available entitlements
    const entitlements = await EntitlementTool.getAvailableEntitlements();
    console.log('Available entitlements:', entitlements);

    // Test looking up a user (you can replace with your email)
    const testEmail = 'glen@brilliantperspectives.com';
    const userId = await EntitlementTool.getUserIdByEmail(testEmail);
    console.log(`User ID for ${testEmail}:`, userId);

    let userEntitlements = [];
    if (userId) {
      userEntitlements = await EntitlementTool.getUserEntitlements(userId);
      console.log('User entitlements:', userEntitlements);
    }

    return NextResponse.json({
      success: true,
      message: 'Entitlements access working correctly!',
      data: {
        availableEntitlements: entitlements,
        testUser: {
          email: testEmail,
          userId: userId,
          entitlements: userEntitlements
        }
      }
    });

  } catch (error) {
    console.error('Error testing entitlements:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Entitlements access failed - permissions need to be fixed'
    }, { status: 500 });
  }
}