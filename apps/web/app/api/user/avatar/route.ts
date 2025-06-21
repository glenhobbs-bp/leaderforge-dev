import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // SSR Auth setup with proper session hydration
    const cookieStore = await nextCookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Get auth tokens from cookies for session hydration
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
    const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

    // Hydrate session if tokens exist
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Check session after hydration
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn('[AVATAR API] No session after hydration');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security check
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user avatar from database
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    // Handle user fetch result
    if (userError || !user?.avatar_url) {
      return NextResponse.json({ url: '/icons/default-avatar.svg' }, { status: 200 });
    }

    // Generate signed URL for the avatar
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .createSignedUrl(user.avatar_url, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ url: '/icons/default-avatar.svg' }, { status: 200 });
    }

    // Add cache headers for performance
    const response = NextResponse.json({ url: data.signedUrl }, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60'); // 5min cache
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

    // SSR Auth: get cookies and hydrate session
    const cookieStore = await nextCookies();
    const allCookies = cookieStore.getAll();

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    const supabase = createSupabaseServerClient(cookieStore);

    // Hydrate session manually (if tokens found)
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      console.warn('[AVATAR API] Missing access or refresh token in cookies');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow user to upload their own avatar
    if (session.user.id !== userId) {
      console.warn('[AVATAR API] Forbidden: user tried to upload avatar for another user');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;

    console.log('[AVATAR API] Generated filename:', fileName);

    // Convert File to ArrayBuffer for Supabase
    // Upload file directly without conversion to preserve quality
    const { data: uploadData, error: uploadError } = await supabase
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

    // Update user's avatar_url in database
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

    // Generate signed URL for immediate display
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('avatars')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[AVATAR API] Failed to generate signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Upload successful but failed to generate URL' }, { status: 500 });
    }

    console.log('[AVATAR API] Upload complete, returning signed URL:', signedUrlData.signedUrl);

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