/**
 * File: src/app/api/user/avatar/route.ts
 * Purpose: API route for avatar upload
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/avatar
 * Upload a new avatar image
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be under 5MB' },
        { status: 400 }
      );
    }

    // Get user's tenant for path
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a tenant' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${userData.tenant_id}/${fileName}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // If bucket doesn't exist, create it (this is a fallback)
      if (uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Storage not configured. Please contact support.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    // Update user's avatar_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't fail - file was uploaded successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: publicUrl,
        path: filePath,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/avatar
 * Remove current avatar
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear avatar_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar removed',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
