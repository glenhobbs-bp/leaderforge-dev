/**
 * File: src/app/api/platform-admin/ai-config/route.ts
 * Purpose: Platform Admin API for managing AI configurations
 * Owner: LeaderForge Team
 * 
 * Part of 7.9 AI Configuration - Platform-level prompt management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AIConfig {
  id: string;
  config_key: string;
  config_type: 'system_prompt' | 'user_prompt_template' | 'settings' | 'terminology';
  config_value: Record<string, unknown>;
  description: string | null;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Verify the current user is a platform admin
 */
async function verifyPlatformAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    return { error: 'Forbidden - Platform Admin access required', status: 403 };
  }

  return { user, userData };
}

/**
 * GET /api/platform-admin/ai-config
 * List all AI configurations
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Fetch all AI configs
    const { data: configs, error } = await supabase
      .schema('core')
      .from('ai_config')
      .select('*')
      .order('config_type')
      .order('config_key');

    if (error) {
      console.error('Error fetching AI configs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch AI configurations' },
        { status: 500 }
      );
    }

    // Group by type for easier UI rendering
    const grouped = {
      system_prompt: configs?.filter(c => c.config_type === 'system_prompt') || [],
      user_prompt_template: configs?.filter(c => c.config_type === 'user_prompt_template') || [],
      settings: configs?.filter(c => c.config_type === 'settings') || [],
      terminology: configs?.filter(c => c.config_type === 'terminology') || [],
    };

    return NextResponse.json({
      success: true,
      data: {
        configs: configs || [],
        grouped,
        total: configs?.length || 0,
      },
    });
  } catch (error) {
    console.error('AI Config GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform-admin/ai-config
 * Create a new AI configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { config_key, config_type, config_value, description, model, max_tokens, temperature } = body;

    // Validation
    if (!config_key || !config_type || !config_value) {
      return NextResponse.json(
        { success: false, error: 'config_key, config_type, and config_value are required' },
        { status: 400 }
      );
    }

    const validTypes = ['system_prompt', 'user_prompt_template', 'settings', 'terminology'];
    if (!validTypes.includes(config_type)) {
      return NextResponse.json(
        { success: false, error: `config_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for duplicate key
    const { data: existing } = await supabase
      .schema('core')
      .from('ai_config')
      .select('id')
      .eq('config_key', config_key)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A configuration with this key already exists' },
        { status: 409 }
      );
    }

    // Create config
    const { data: config, error } = await supabase
      .schema('core')
      .from('ai_config')
      .insert({
        config_key,
        config_type,
        config_value,
        description: description || null,
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1024,
        temperature: temperature || 0.7,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI config:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create AI configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('AI Config POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
