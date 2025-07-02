import { NextRequest, NextResponse } from 'next/server';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

// Simple in-memory cache for avatar URLs
const avatarCache = new Map<string, { url: string; timestamp: number }>();
const AVATAR_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Create service role Supabase client for backend operations
 * This bypasses RLS policies and provides full database/storage access for server-side operations
 */
async function createServiceRoleSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables for service role client');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Check cache first
  const cached = avatarCache.get(userId);
  if (cached && Date.now() - cached.timestamp < AVATAR_CACHE_DURATION) {
    return NextResponse.json({ url: cached.url }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
        'X-Cache': 'HIT',
      }
    });
  }

  try {
    // ✅ Session Auth: Use consistent restoreSession approach
    const cookieStore = await nextCookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (!session?.user?.id || session.user.id !== userId || sessionError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Database Operations: Use authenticated context for database access
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    // ✅ Service Role for Storage: Only use service role for storage operations that require elevated permissions
    const serviceClient = await createServiceRoleSupabaseClient();

    // Handle user fetch result
    if (userError || !user?.avatar_url) {
      return NextResponse.json({ url: '/icons/default-avatar.svg' }, { status: 200 });
    }

    // Generate signed URL for the avatar using service role
    const { data, error } = await serviceClient
      .storage
      .from('avatars')
      .createSignedUrl(user.avatar_url, 3600);

    if (error || !data?.signedUrl) {
      console.warn('[AVATAR API] Signed URL generation failed:', error);
      return NextResponse.json({ url: '/icons/default-avatar.svg' }, { status: 200 });
    }

    // Cache the result
    avatarCache.set(userId, { url: data.signedUrl, timestamp: Date.now() });

    // Add aggressive cache headers for performance
    const response = NextResponse.json({ url: data.signedUrl }, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600'); // 30min cache
    response.headers.set('X-Cache', 'MISS');
    return response;

  } catch (error) {
    console.error('[AVATAR API] Unexpected error:', error);
    return NextResponse.json({ url: '/icons/default-avatar.svg' }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  console.log('--- [AVATAR API] POST - Avatar upload request');

  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    console.log('[AVATAR API] Upload params:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId
    });

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (10MB limit for high quality images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // ✅ Session Auth: Verify user identity using robust session restoration
    const cookieStore = await nextCookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== userId) {
      console.log('[AVATAR API POST] Authentication failed:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        requestedUserId: userId,
        error: sessionError?.message
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AVATAR API POST] Authentication successful for user:', session.user.id);

    // ✅ Service Role for Storage: Only use service role for storage operations that require elevated permissions
    const serviceClient = await createServiceRoleSupabaseClient();

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;

    console.log('[AVATAR API] Generated filename:', fileName);

    // Upload file using service role (required for storage operations)
    const { data: uploadData, error: uploadError } = await serviceClient
      .storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true, // Replace if exists
        cacheControl: '3600', // Cache for 1 hour
      });

    if (uploadError) {
      console.error('[AVATAR API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    console.log('[AVATAR API] Upload successful:', uploadData);

    // ✅ Database Operations: Update user's avatar_url using authenticated context
    const { data: updateData, error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update({
        avatar_url: fileName,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[AVATAR API] Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update user avatar' }, { status: 500 });
    }

    console.log('[AVATAR API] Database updated:', updateData);

    // Generate signed URL for immediate display using service role
    const { data: signedUrlData, error: signedUrlError } = await serviceClient
      .storage
      .from('avatars')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[AVATAR API] Failed to generate signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Upload successful but failed to generate URL' }, { status: 500 });
    }

    console.log('[AVATAR API] Upload complete, returning signed URL:', signedUrlData.signedUrl);

    // Clear any cached avatar for this user to ensure fresh fetches
    avatarCache.delete(userId);
    console.log('[AVATAR API] Cleared avatar cache for user:', userId);

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      fileName: fileName,
      message: 'Avatar uploaded successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[AVATAR API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}