/**
 * File: src/app/api/admin/learning-path/route.ts
 * Purpose: API routes for managing organization learning paths
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch org's learning path with items
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's membership and org
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, role, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ success: false, error: 'No membership found' }, { status: 404 });
  }

  // Fetch learning path (from content schema)
  const { data: learningPath, error: pathError } = await supabase
    .schema('core')
    .from('learning_paths')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .single();

  if (pathError && pathError.code !== 'PGRST116') {
    console.error('Error fetching learning path:', pathError);
    return NextResponse.json({ success: false, error: 'Failed to fetch learning path' }, { status: 500 });
  }

  // Fetch items separately if path exists
  let items: Array<{
    id: string;
    content_id: string;
    sequence_order: number;
    unlock_date: string | null;
    is_optional: boolean;
    is_manually_unlocked: boolean;
  }> = [];
  
  if (learningPath) {
    const { data: pathItems, error: itemsError } = await supabase
      .schema('core')
      .from('learning_path_items')
      .select('id, content_id, sequence_order, unlock_date, is_optional, is_manually_unlocked')
      .eq('learning_path_id', learningPath.id)
      .order('sequence_order');

    if (itemsError) {
      console.error('Error fetching learning path items:', itemsError);
    } else {
      items = pathItems || [];
    }
  }

  return NextResponse.json({
    success: true,
    learningPath: learningPath ? { ...learningPath, items } : null,
  });
}

// POST - Create or update learning path
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's membership and verify admin role
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, role, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ success: false, error: 'No membership found' }, { status: 404 });
  }

  if (!['admin', 'owner'].includes(membership.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { 
    name, 
    description, 
    unlock_mode, 
    enrollment_date, 
    unlock_interval_days,
    completion_requirement 
  } = body;

  // Check if learning path already exists for this org
  const { data: existingPath } = await supabase
    .schema('core')
    .from('learning_paths')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .single();

  if (existingPath) {
    // Update existing path
    const { data: updatedPath, error: updateError } = await supabase
      .schema('core')
      .from('learning_paths')
      .update({
        name,
        description,
        unlock_mode,
        enrollment_date,
        unlock_interval_days,
        completion_requirement,
      })
      .eq('id', existingPath.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating learning path:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update learning path' }, { status: 500 });
    }

    return NextResponse.json({ success: true, learningPath: updatedPath });
  } else {
    // Create new path
    const { data: newPath, error: createError } = await supabase
      .schema('core')
      .from('learning_paths')
      .insert({
        tenant_id: membership.tenant_id,
        organization_id: membership.organization_id,
        name: name || 'Learning Path',
        description,
        unlock_mode: unlock_mode || 'hybrid',
        enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
        unlock_interval_days: unlock_interval_days || 7,
        completion_requirement: completion_requirement || 'full',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating learning path:', createError);
      return NextResponse.json({ success: false, error: 'Failed to create learning path' }, { status: 500 });
    }

    return NextResponse.json({ success: true, learningPath: newPath }, { status: 201 });
  }
}

