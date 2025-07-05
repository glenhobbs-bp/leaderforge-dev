/**
 * File: apps/web/app/api/dev/fix-entitlement-permissions/route.ts
 * Purpose: API endpoint to fix database permissions for entitlements tables
 * Owner: Engineering Team
 * Tags: #api #dev #database #permissions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

        // Create Supabase client with service role key and core schema
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'core'
      }
    });

    // Since we can't execute arbitrary SQL through the Supabase client,
    // let's try to test the current permissions and provide guidance

    console.log('Testing current permissions...');

    // Test access to core.entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('entitlements')
      .select('*')
      .limit(1);

    // Test access to core.user_entitlements
    const { data: userEntitlements, error: userEntitlementsError } = await supabase
      .from('user_entitlements')
      .select('*')
      .limit(1);

    const results = {
      entitlements: {
        accessible: !entitlementsError,
        error: entitlementsError?.message,
        count: entitlements?.length || 0
      },
      userEntitlements: {
        accessible: !userEntitlementsError,
        error: userEntitlementsError?.message,
        count: userEntitlements?.length || 0
      }
    };

    if (entitlementsError || userEntitlementsError) {
      return NextResponse.json({
        message: 'Database permissions need to be fixed manually',
        currentAccess: results,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Execute the SQL script provided in fix_entitlement_permissions.sql',
          '4. The script will grant proper permissions to service_role for entitlements tables',
          '5. Alternatively, ensure the tables are in the correct schema and have proper RLS policies'
        ],
        sqlScript: '/fix_entitlement_permissions.sql (in project root)'
      }, { status: 200 });
    }

    return NextResponse.json({
      message: 'Database permissions are working correctly',
      currentAccess: results
    });

  } catch (error) {
    console.error('Error fixing database permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fix database permissions', details: error.message },
      { status: 500 }
    );
  }
}