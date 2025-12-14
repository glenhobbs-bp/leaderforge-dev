/**
 * File: src/app/(dashboard)/content/page.tsx
 * Purpose: Content library page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { fetchContentCollection } from '@/lib/tribe-social';
import { createClient } from '@/lib/supabase/server';
import { ContentLibrary } from '@/components/content/content-library';

export const metadata: Metadata = {
  title: 'Content Library',
  description: 'Browse available learning content',
};

interface ProgressData {
  videoProgress: number;
  videoCompleted: boolean;
  worksheetCompleted: boolean;
  checkinStatus: 'none' | 'pending' | 'scheduled' | 'completed';
  boldActionStatus: 'none' | 'pending' | 'completed' | 'signed_off';
}

export default async function ContentPage() {
  const [content, supabase] = await Promise.all([
    fetchContentCollection(),
    createClient(),
  ]);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user progress (all 4 steps)
  let progressMap: Record<string, ProgressData> = {};
  
  if (user) {
    // Get video progress
    const { data: videoProgress } = await supabase
      .from('user_progress')
      .select('content_id, progress_percentage, completed_at')
      .eq('user_id', user.id);

    // Get worksheet submissions
    const { data: worksheetSubmissions } = await supabase
      .from('worksheet_submissions')
      .select('content_id')
      .eq('user_id', user.id);

    // Get check-in requests
    const { data: checkinRequests } = await supabase
      .from('checkin_requests')
      .select('content_id, status')
      .eq('user_id', user.id);

    // Get bold actions
    const { data: boldActions } = await supabase
      .from('bold_actions')
      .select('content_id, status')
      .eq('user_id', user.id);

    // Build lookup maps
    const worksheetSet = new Set(
      worksheetSubmissions?.map(w => w.content_id) || []
    );
    
    const checkinMap = new Map<string, 'pending' | 'scheduled' | 'completed'>(
      checkinRequests?.map(c => [c.content_id, c.status as 'pending' | 'scheduled' | 'completed']) || []
    );
    
    const boldActionMap = new Map<string, 'pending' | 'completed' | 'signed_off'>(
      boldActions?.map(b => [b.content_id, b.status as 'pending' | 'completed' | 'signed_off']) || []
    );

    // Get all content IDs that have any progress
    const allContentIds = new Set([
      ...(videoProgress?.map(v => v.content_id) || []),
      ...worksheetSet,
      ...checkinMap.keys(),
      ...boldActionMap.keys(),
    ]);

    // Build progress map for all items
    for (const contentId of allContentIds) {
      const video = videoProgress?.find(v => v.content_id === contentId);
      progressMap[contentId] = {
        videoProgress: video?.progress_percentage || 0,
        videoCompleted: (video?.progress_percentage || 0) >= 90,
        worksheetCompleted: worksheetSet.has(contentId),
        checkinStatus: checkinMap.get(contentId) || 'none',
        boldActionStatus: boldActionMap.get(contentId) || 'none',
      };
    }
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Library</h1>
        <p className="text-muted-foreground mt-1">
          Explore videos, documents, and learning materials
        </p>
      </div>

      {/* Content Grid */}
      {content.length > 0 ? (
        <ContentLibrary items={content} progressMap={progressMap} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">No content available</h2>
          <p className="text-muted-foreground mt-1">
            Check back soon for new learning materials.
          </p>
        </div>
      )}
    </div>
  );
}
