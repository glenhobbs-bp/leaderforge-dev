import { NextRequest, NextResponse } from 'next/server';
import { UserProgressService } from '../../../lib/userProgressService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated supabase client
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      testType = 'video',
      userId = session.user.id, // Use authenticated user
      contentId = 'test-content-123',
      contextKey = 'test-context'
    } = body;

    let result;
    switch (testType) {
      case 'video':
        result = await UserProgressService.trackVideoProgress(userId, contentId, contextKey, 120, 60, 300);
        break;
      case 'quiz':
        result = await UserProgressService.trackQuizCompletion(userId, contentId, contextKey, 85, 10, 8);
        break;
      case 'reading':
        result = await UserProgressService.trackReadingProgress(userId, contentId, contextKey, 75, 3);
        break;
      case 'summary':
        result = await UserProgressService.getProgressSummary(userId, contextKey);
        break;
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testType,
      userId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Universal Progress Auth Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}