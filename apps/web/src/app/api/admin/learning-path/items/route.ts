/**
 * File: src/app/api/admin/learning-path/items/route.ts
 * Purpose: API routes for managing learning path items (module sequence + manual unlock)
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to verify admin access and get learning path
async function verifyAdminAndGetPath(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401, user: null, learningPath: null, membership: null };
  }

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, role, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return { error: 'No membership found', status: 404, user, learningPath: null, membership: null };
  }

  if (!['admin', 'owner'].includes(membership.role)) {
    return { error: 'Admin access required', status: 403, user, learningPath: null, membership };
  }

  const { data: learningPath, error: pathError } = await supabase
    .from('learning_paths')
    .select('id, unlock_mode')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .single();

  if (pathError || !learningPath) {
    return { error: 'Learning path not found', status: 404, user, learningPath: null, membership };
  }

  return { error: null, status: 200, user, learningPath, membership };
}

// PUT - Update entire sequence (replace all items)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { error, status, learningPath } = await verifyAdminAndGetPath(supabase);
  
  if (error || !learningPath) {
    return NextResponse.json({ success: false, error: error || 'Learning path not found' }, { status });
  }

  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ success: false, error: 'Items must be an array' }, { status: 400 });
  }

  // Delete existing items
  const { error: deleteError } = await supabase
    .from('learning_path_items')
    .delete()
    .eq('learning_path_id', learningPath.id);

  if (deleteError) {
    console.error('Error deleting existing items:', deleteError);
    return NextResponse.json({ success: false, error: 'Failed to update sequence' }, { status: 500 });
  }

  // Insert new items (first item auto-unlocked for manual mode)
  if (items.length > 0) {
    const itemsToInsert = items.map((item: { content_id: string; unlock_date?: string; is_optional?: boolean }, index: number) => ({
      learning_path_id: learningPath.id,
      content_id: item.content_id,
      sequence_order: index + 1,
      unlock_date: item.unlock_date || null,
      is_optional: item.is_optional || false,
      // For manual mode, first item is auto-unlocked
      is_manually_unlocked: learningPath.unlock_mode === 'manual' && index === 0,
    }));

    const { error: insertError } = await supabase
      .from('learning_path_items')
      .insert(itemsToInsert);

    if (insertError) {
      console.error('Error inserting items:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to save sequence' }, { status: 500 });
    }
  }

  // Fetch updated items
  const { data: updatedItems, error: fetchError } = await supabase
    .from('learning_path_items')
    .select('*')
    .eq('learning_path_id', learningPath.id)
    .order('sequence_order');

  if (fetchError) {
    console.error('Error fetching updated items:', fetchError);
  }

  return NextResponse.json({ 
    success: true, 
    items: updatedItems || [] 
  });
}

// PATCH - Toggle manual unlock for a specific item
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { error, status, user, learningPath } = await verifyAdminAndGetPath(supabase);
  
  if (error || !learningPath || !user) {
    return NextResponse.json({ success: false, error: error || 'Learning path not found' }, { status });
  }

  // Manual unlock only works in manual mode
  if (learningPath.unlock_mode !== 'manual') {
    return NextResponse.json({ 
      success: false, 
      error: 'Manual unlock is only available in manual unlock mode' 
    }, { status: 400 });
  }

  const body = await request.json();
  const { itemId, unlock } = body;

  if (!itemId || typeof unlock !== 'boolean') {
    return NextResponse.json({ 
      success: false, 
      error: 'itemId and unlock (boolean) are required' 
    }, { status: 400 });
  }

  // Verify item belongs to this learning path
  const { data: item, error: itemError } = await supabase
    .from('learning_path_items')
    .select('id, sequence_order')
    .eq('id', itemId)
    .eq('learning_path_id', learningPath.id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
  }

  // Don't allow locking the first item
  if (!unlock && item.sequence_order === 1) {
    return NextResponse.json({ 
      success: false, 
      error: 'Cannot lock the first module' 
    }, { status: 400 });
  }

  // Update the item
  const { data: updatedItem, error: updateError } = await supabase
    .from('learning_path_items')
    .update({
      is_manually_unlocked: unlock,
      manually_unlocked_at: unlock ? new Date().toISOString() : null,
      manually_unlocked_by: unlock ? user.id : null,
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating item:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    item: updatedItem 
  });
}

