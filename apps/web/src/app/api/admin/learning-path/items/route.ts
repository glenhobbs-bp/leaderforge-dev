/**
 * File: src/app/api/admin/learning-path/items/route.ts
 * Purpose: API routes for managing learning path items (module sequence)
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT - Update entire sequence (replace all items)
export async function PUT(request: NextRequest) {
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

  // Get org's learning path
  const { data: learningPath, error: pathError } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .single();

  if (pathError || !learningPath) {
    return NextResponse.json({ success: false, error: 'Learning path not found. Create one first.' }, { status: 404 });
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

  // Insert new items
  if (items.length > 0) {
    const itemsToInsert = items.map((item: { content_id: string; unlock_date?: string; is_optional?: boolean }, index: number) => ({
      learning_path_id: learningPath.id,
      content_id: item.content_id,
      sequence_order: index + 1,
      unlock_date: item.unlock_date || null,
      is_optional: item.is_optional || false,
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

