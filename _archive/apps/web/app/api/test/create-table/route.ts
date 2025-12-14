/**
 * Create Table API
 * Purpose: Execute SQL to create the core.user_progress table
 * Owner: Senior Engineering Team
 * Tags: testing, database, setup
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // SQL to create the universal progress table
    const createTableSQL = `
      -- Create Universal Progress Table in Core Schema
      -- Create sync_status enum if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
              CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');
          END IF;
      END $$;

      -- Create core schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS core;

      -- Create the enhanced universal progress table
      CREATE TABLE IF NOT EXISTS core.user_progress (
          -- Core identifiers
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          content_id TEXT NOT NULL,
          context_key TEXT NOT NULL,

          -- Universal content type differentiation
          progress_type TEXT NOT NULL DEFAULT 'video'
              CHECK (progress_type IN ('video', 'quiz', 'reading', 'worksheet', 'course', 'custom')),

          -- Universal progress tracking
          progress_percentage INTEGER DEFAULT 0
              CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
          completion_count INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0,

          -- Universal timestamps
          started_at TIMESTAMPTZ DEFAULT NOW(),
          last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,

          -- Universal user features
          notes TEXT,

          -- Universal metadata for type-specific data
          metadata JSONB DEFAULT '{}',

          -- Universal sync capabilities
          sync_status sync_status DEFAULT 'synced',
          last_synced_at TIMESTAMPTZ DEFAULT NOW(),

          -- Maintain unique constraint
          CONSTRAINT unique_user_content_context UNIQUE (user_id, content_id, context_key)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_progress_user ON core.user_progress USING btree (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_content ON core.user_progress USING btree (content_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_context ON core.user_progress USING btree (context_key);
      CREATE INDEX IF NOT EXISTS idx_user_progress_type ON core.user_progress USING btree (progress_type);

      -- Enable Row Level Security
      ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;

      -- Create policies if they don't exist
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE schemaname = 'core'
              AND tablename = 'user_progress'
              AND policyname = 'Users can manage own progress'
          ) THEN
              CREATE POLICY "Users can manage own progress" ON core.user_progress
                  FOR ALL USING (user_id = auth.uid());
          END IF;
      END $$;

      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE schemaname = 'core'
              AND tablename = 'user_progress'
              AND policyname = 'Service role full access'
          ) THEN
              CREATE POLICY "Service role full access" ON core.user_progress
                  FOR ALL TO service_role USING (true);
          END IF;
      END $$;
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Failed to create table:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        note: 'This might be due to permissions. Try executing SQL manually in Supabase dashboard.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Table core.user_progress created successfully',
      data,
      note: 'The table should now be available for universal progress tracking'
    });

  } catch (error) {
    console.error('Create table error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try manually executing the SQL in Supabase SQL Editor'
    }, { status: 500 });
  }
}