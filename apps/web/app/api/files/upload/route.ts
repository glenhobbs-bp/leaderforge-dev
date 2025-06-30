/**
 * Purpose: File upload API endpoint for schema-driven forms system
 * Owner: Schema-Driven Forms Implementation
 * Tags: [api, file-upload, forms, supabase-storage, security]
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm'
];

interface FileUploadResponse {
  success: boolean;
  file_id?: string;
  storage_path?: string;
  download_url?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FileUploadResponse>> {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const privacy_level = formData.get('privacy_level') as string || 'user_private';
    const tenant_key = formData.get('tenant_key') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `File type ${file.type} not allowed`
      }, { status: 400 });
    }

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Verify user authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Generate unique file ID and storage path
    const fileId = randomUUID();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const storagePath = `user/${userId}/${fileId}${fileExtension ? '.' + fileExtension : ''}`;

    // Upload file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('[FileUpload] Storage error:', storageError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file to storage'
      }, { status: 500 });
    }

    // Store file metadata in database
    const { error: dbError } = await supabase
      .from('user_files')
      .insert({
        file_id: fileId,
        user_id: userId,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        privacy_level,
        tenant_key: tenant_key || session.user.user_metadata?.tenant_key || 'leaderforge',
        processing_status: 'completed' // For MVP, mark as completed immediately
      })
      .select()
      .single();

    if (dbError) {
      console.error('[FileUpload] Database error:', dbError);

      // Clean up storage if database insert failed
      await supabase.storage
        .from('user-files')
        .remove([storagePath]);

      return NextResponse.json({
        success: false,
        error: 'Failed to store file metadata'
      }, { status: 500 });
    }

    // Generate signed download URL (valid for 1 hour)
    const { data: signedUrlData } = await supabase.storage
      .from('user-files')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      file_id: fileId,
      storage_path: storagePath,
      download_url: signedUrlData?.signedUrl
    });

  } catch (error) {
    console.error('[FileUpload] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve file metadata and download URL
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'file_id parameter required'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Verify user authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get file metadata from database
    const { data: fileRecord, error: dbError } = await supabase
      .from('user_files')
      .select('*')
      .eq('file_id', fileId)
      .single();

    if (dbError || !fileRecord) {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Generate fresh signed download URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(fileRecord.storage_path, 3600);

    if (urlError) {
      console.error('[FileUpload] Signed URL error:', urlError);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate download URL'
      }, { status: 500 });
    }

    // Update access tracking
    await supabase
      .from('user_files')
      .update({
        download_count: (fileRecord.download_count || 0) + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('file_id', fileId);

    return NextResponse.json({
      success: true,
      file_id: fileId,
      original_filename: fileRecord.original_filename,
      content_type: fileRecord.content_type,
      file_size: fileRecord.file_size,
      uploaded_at: fileRecord.uploaded_at,
      download_url: signedUrlData.signedUrl
    });

  } catch (error) {
    console.error('[FileUpload] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}