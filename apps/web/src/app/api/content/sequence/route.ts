/**
 * File: src/app/api/content/sequence/route.ts
 * Purpose: Get user's content sequence with unlock status
 * Owner: Core Team
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface LearningPathItem {
  id: string;
  content_id: string;
  sequence_order: number;
  unlock_date: string | null;
  is_optional: boolean;
  is_manually_unlocked: boolean;
}

interface LearningPath {
  id: string;
  name: string;
  unlock_mode: 'time_based' | 'completion_based' | 'hybrid' | 'manual';
  enrollment_date: string;
  unlock_interval_days: number;
  completion_requirement: 'video_only' | 'worksheet' | 'full';
  items: LearningPathItem[];
}

interface UserProgress {
  content_id: string;
  progress_percentage: number;
  completed_at: string | null;
}

interface BoldAction {
  content_id: string;
  status: string;
}

// GET - Get content sequence with unlock status for current user
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's membership
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json({ success: false, error: 'No membership found' }, { status: 404 });
  }

  // Fetch learning path
  const { data: learningPath, error: pathError } = await supabase
    .from('learning_paths')
    .select('id, name, unlock_mode, enrollment_date, unlock_interval_days, completion_requirement')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .single();

  // If no learning path, return empty (all content available)
  if (pathError || !learningPath) {
    return NextResponse.json({
      success: true,
      hasSequence: false,
      sequence: [],
    });
  }

  // Fetch items separately
  const { data: pathItems, error: itemsError } = await supabase
    .from('learning_path_items')
    .select('id, content_id, sequence_order, unlock_date, is_optional, is_manually_unlocked')
    .eq('learning_path_id', learningPath.id)
    .order('sequence_order');

  if (itemsError || !pathItems || pathItems.length === 0) {
    return NextResponse.json({
      success: true,
      hasSequence: false,
      sequence: [],
    });
  }

  const path: LearningPath = {
    ...learningPath,
    items: pathItems,
  };

  // Fetch user's progress for all content in the path
  const contentIds = path.items.map((item) => item.content_id);
  
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('content_id, progress_percentage, completed_at')
    .eq('user_id', user.id)
    .in('content_id', contentIds);

  const progressMap = new Map<string, UserProgress>();
  (progressData || []).forEach((p) => {
    progressMap.set(p.content_id, p as UserProgress);
  });

  // If completion-based or hybrid, also fetch bold actions and worksheets
  let boldActionsMap = new Map<string, BoldAction>();
  if (path.completion_requirement === 'full' || path.unlock_mode !== 'time_based') {
    const { data: boldActions } = await supabase
      .from('bold_actions')
      .select('content_id, status')
      .eq('user_id', user.id)
      .in('content_id', contentIds);

    (boldActions || []).forEach((ba) => {
      boldActionsMap.set(ba.content_id, ba as BoldAction);
    });
  }

  // Calculate unlock status for each item
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enrollmentDate = new Date(path.enrollment_date);

  const sequence = path.items.map((item, index) => {
    const progress = progressMap.get(item.content_id);
    const boldAction = boldActionsMap.get(item.content_id);
    
    // Check completion based on requirement
    let isComplete = false;
    if (path.completion_requirement === 'video_only') {
      isComplete = (progress?.progress_percentage || 0) >= 90;
    } else if (path.completion_requirement === 'worksheet') {
      isComplete = (progress?.progress_percentage || 0) >= 90; // Could check worksheet too
    } else {
      // full: need video + worksheet + check-in + signoff
      isComplete = boldAction?.status === 'completed' || boldAction?.status === 'signed_off';
    }

    // Check previous item completion (for completion-based/hybrid)
    let previousComplete = true;
    if (index > 0) {
      const prevItem = path.items[index - 1];
      const prevProgress = progressMap.get(prevItem.content_id);
      const prevBoldAction = boldActionsMap.get(prevItem.content_id);
      
      if (path.completion_requirement === 'video_only') {
        previousComplete = (prevProgress?.progress_percentage || 0) >= 90;
      } else if (path.completion_requirement === 'worksheet') {
        previousComplete = (prevProgress?.progress_percentage || 0) >= 90;
      } else {
        previousComplete = prevBoldAction?.status === 'completed' || prevBoldAction?.status === 'signed_off';
      }
    }

    // Calculate time-based unlock date
    const timeUnlockDate = item.unlock_date 
      ? new Date(item.unlock_date)
      : new Date(enrollmentDate.getTime() + (index * path.unlock_interval_days * 24 * 60 * 60 * 1000));

    // Determine if unlocked based on mode
    let isUnlocked = false;
    let unlockReason = '';

    if (index === 0) {
      // First item is always unlocked
      isUnlocked = true;
    } else if (path.unlock_mode === 'manual') {
      // Manual mode: admin explicitly unlocks each item
      isUnlocked = item.is_manually_unlocked === true;
      if (!isUnlocked) {
        unlockReason = 'Awaiting admin unlock';
      }
    } else if (path.unlock_mode === 'time_based') {
      isUnlocked = today >= timeUnlockDate;
      if (!isUnlocked) {
        unlockReason = `Unlocks ${timeUnlockDate.toLocaleDateString()}`;
      }
    } else if (path.unlock_mode === 'completion_based') {
      isUnlocked = previousComplete;
      if (!isUnlocked) {
        unlockReason = 'Complete previous module first';
      }
    } else {
      // Hybrid: both conditions
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

    return {
      content_id: item.content_id,
      sequence_order: item.sequence_order,
      is_optional: item.is_optional,
      is_unlocked: isUnlocked,
      is_complete: isComplete,
      unlock_date: timeUnlockDate.toISOString().split('T')[0],
      unlock_reason: unlockReason,
      progress_percentage: progress?.progress_percentage || 0,
    };
  });

  return NextResponse.json({
    success: true,
    hasSequence: true,
    pathName: path.name,
    unlockMode: path.unlock_mode,
    sequence,
  });
}

