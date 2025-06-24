/**
 * Database Check API
 * Purpose: Check what tables exist in the database
 * Owner: Senior Engineering Team
 * Tags: testing, database, debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Skip information_schema check for now - just check specific tables
    const tables = [];

    // Also check specifically for our expected tables
    const checkQueries = [
      { schema: 'public', table: 'user_progress' },
      { schema: 'modules', table: 'user_progress' },
      { schema: 'core', table: 'user_progress' }
    ];

    const tableChecks = await Promise.all(
      checkQueries.map(async ({ schema, table }) => {
        try {
          const { data, error } = await supabase
            .from(`${schema}.${table}`)
            .select('count(*)')
            .limit(1);

          return {
            schema,
            table,
            exists: !error,
            error: error?.message || null
          };
        } catch (e) {
          return {
            schema,
            table,
            exists: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      progressTables: tables || [],
      tableChecks,
      note: 'This shows which progress tables exist and are accessible'
    });

  } catch (error) {
    console.error('Database check failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}