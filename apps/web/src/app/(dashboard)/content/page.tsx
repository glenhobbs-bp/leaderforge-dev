/**
 * File: src/app/(dashboard)/content/page.tsx
 * Purpose: Content library page with learning path sequencing
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
  isLocked: boolean;
  unlockReason: string | null;
  sequenceOrder: number | null;
}

// Sequence item from API
interface SequenceItem {
  content_id: string;
  sequence_order: number;
  is_unlocked: boolean;
  unlock_reason: string;
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

    // Fetch sequence/unlock status from learning path
    let sequenceMap = new Map<string, SequenceItem>();
    let hasSequence = false;
    
    // Get user's membership for org
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (membership) {
      // Get org's learning path
      const { data: learningPath } = await supabase
        .from('learning_paths')
        .select(`
          id,
          unlock_mode,
          enrollment_date,
          unlock_interval_days,
          completion_requirement,
          items:learning_path_items(
            content_id,
            sequence_order,
            unlock_date,
            is_optional,
            is_manually_unlocked
          )
        `)
        .eq('organization_id', membership.organization_id)
        .eq('is_active', true)
        .single();
      
      if (learningPath?.items && learningPath.items.length > 0) {
        hasSequence = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const enrollmentDate = new Date(learningPath.enrollment_date);
        
        // Sort items by sequence order
        const sortedItems = [...learningPath.items].sort(
          (a: { sequence_order: number }, b: { sequence_order: number }) => 
            a.sequence_order - b.sequence_order
        );
        
        // Calculate unlock status for each item
        sortedItems.forEach((item: { 
          content_id: string; 
          sequence_order: number; 
          unlock_date: string | null;
          is_optional: boolean;
          is_manually_unlocked?: boolean;
        }, index: number) => {
          // Check previous completion
          let previousComplete = true;
          if (index > 0) {
            const prevItem = sortedItems[index - 1];
            const prevBoldAction = boldActionMap.get(prevItem.content_id);
            const prevVideo = videoProgress?.find(v => v.content_id === prevItem.content_id);
            
            if (learningPath.completion_requirement === 'video_only') {
              previousComplete = (prevVideo?.progress_percentage || 0) >= 90;
            } else if (learningPath.completion_requirement === 'worksheet') {
              previousComplete = (prevVideo?.progress_percentage || 0) >= 90 && worksheetSet.has(prevItem.content_id);
            } else {
              previousComplete = prevBoldAction === 'completed' || prevBoldAction === 'signed_off';
            }
          }
          
          // Calculate time unlock
          const timeUnlockDate = item.unlock_date 
            ? new Date(item.unlock_date)
            : new Date(enrollmentDate.getTime() + (index * learningPath.unlock_interval_days * 24 * 60 * 60 * 1000));
          
          // Determine unlock status
          let isUnlocked = false;
          let unlockReason = '';
          
          if (index === 0) {
            isUnlocked = true;
          } else if (learningPath.unlock_mode === 'manual') {
            // Manual mode: admin explicitly unlocks each item
            isUnlocked = item.is_manually_unlocked === true;
            if (!isUnlocked) unlockReason = 'Awaiting admin unlock';
          } else if (learningPath.unlock_mode === 'time_based') {
            isUnlocked = today >= timeUnlockDate;
            if (!isUnlocked) unlockReason = `Unlocks ${timeUnlockDate.toLocaleDateString()}`;
          } else if (learningPath.unlock_mode === 'completion_based') {
            isUnlocked = previousComplete;
            if (!isUnlocked) unlockReason = 'Complete previous module first';
          } else {
            // Hybrid
            const timeReady = today >= timeUnlockDate;
            isUnlocked = timeReady && previousComplete;
            if (!isUnlocked) {
              if (!timeReady && !previousComplete) {
                unlockReason = `Unlocks ${timeUnlockDate.toLocaleDateString()} (requires previous completion)`;
              } else if (!timeReady) {
                unlockReason = `Unlocks ${timeUnlockDate.toLocaleDateString()}`;
              } else {
                unlockReason = 'Complete previous module first';
              }
            }
          }
          
          sequenceMap.set(item.content_id, {
            content_id: item.content_id,
            sequence_order: item.sequence_order,
            is_unlocked: isUnlocked,
            unlock_reason: unlockReason,
          });
        });
      }
    }

    // Build progress map for all items (include all content, not just started)
    for (const item of content) {
      const video = videoProgress?.find(v => v.content_id === item.id);
      const sequenceItem = sequenceMap.get(item.id);
      
      // If there's a sequence, locked items not in sequence are also locked
      const isLocked = hasSequence 
        ? sequenceItem ? !sequenceItem.is_unlocked : true
        : false;
      const unlockReason = hasSequence
        ? sequenceItem?.unlock_reason || (sequenceItem ? null : 'Not in learning path')
        : null;
      
      progressMap[item.id] = {
        videoProgress: video?.progress_percentage || 0,
        videoCompleted: (video?.progress_percentage || 0) >= 90,
        worksheetCompleted: worksheetSet.has(item.id),
        checkinStatus: checkinMap.get(item.id) || 'none',
        boldActionStatus: boldActionMap.get(item.id) || 'none',
        isLocked,
        unlockReason,
        sequenceOrder: sequenceItem?.sequence_order || null,
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
