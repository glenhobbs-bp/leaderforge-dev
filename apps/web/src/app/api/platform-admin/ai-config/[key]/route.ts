/**
 * File: src/app/api/platform-admin/ai-config/[key]/route.ts
 * Purpose: Platform Admin API for managing individual AI configurations
 * Owner: LeaderForge Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ key: string }>;
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
 * GET /api/platform-admin/ai-config/[key]
 * Get a specific AI configuration with history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Fetch config
    const { data: config, error } = await supabase
      .schema('core')
      .from('ai_config')
      .select('*')
      .eq('config_key', key)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { success: false, error: 'AI configuration not found' },
        { status: 404 }
      );
    }

    // Fetch history
    const { data: history } = await supabase
      .schema('core')
      .from('ai_config_history')
      .select('*')
      .eq('config_id', config.id)
      .order('version', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        config,
        history: history || [],
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
 * PATCH /api/platform-admin/ai-config/[key]
 * Update an AI configuration
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Get existing config
    const { data: existing, error: fetchError } = await supabase
      .schema('core')
      .from('ai_config')
      .select('*')
      .eq('config_key', key)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'AI configuration not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { config_value, description, model, max_tokens, temperature, is_active, change_note } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let valueChanged = false;

    if (config_value !== undefined) {
      updates.config_value = config_value;
      valueChanged = JSON.stringify(config_value) !== JSON.stringify(existing.config_value);
    }
    if (description !== undefined) updates.description = description;
    if (model !== undefined) updates.model = model;
    if (max_tokens !== undefined) updates.max_tokens = max_tokens;
    if (temperature !== undefined) updates.temperature = temperature;
    if (is_active !== undefined) updates.is_active = is_active;

    // If value changed, increment version and save history
    if (valueChanged) {
      updates.version = existing.version + 1;

      // Save to history
      await supabase
        .schema('core')
        .from('ai_config_history')
        .insert({
          config_id: existing.id,
          config_key: existing.config_key,
          config_value: existing.config_value,
          version: existing.version,
          changed_by: auth.user.id,
          change_note: change_note || null,
        });
    }

    // Update config
    const { data: config, error: updateError } = await supabase
      .schema('core')
      .from('ai_config')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating AI config:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update AI configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
      versionIncremented: valueChanged,
    });
  } catch (error) {
    console.error('AI Config PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/platform-admin/ai-config/[key]
 * Delete an AI configuration (soft delete by setting is_active = false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const supabase = await createClient();
    
    const auth = await verifyPlatformAdmin(supabase);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Get existing config
    const { data: existing, error: fetchError } = await supabase
      .schema('core')
      .from('ai_config')
      .select('id, config_key')
      .eq('config_key', key)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'AI configuration not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active = false
    const { error: updateError } = await supabase
      .schema('core')
      .from('ai_config')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Error deleting AI config:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete AI configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `AI configuration '${key}' has been deactivated`,
    });
  } catch (error) {
    console.error('AI Config DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
