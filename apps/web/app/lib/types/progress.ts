/**
 * Client-side Progress Types
 * Purpose: Type definitions for progress tracking on the client side
 * Owner: Senior Engineering Team
 * Tags: types, progress-tracking, client-side
 */

// Enhanced universal progress interface
export interface UserProgress {
  id: string;
  user_id: string;
  content_id: string;
  context_key: string;
  progress_type: 'video' | 'quiz' | 'reading' | 'worksheet' | 'course' | 'custom';
  progress_percentage: number;
  completion_count: number;
  total_sessions: number;
  started_at: string;
  last_viewed_at: string;
  completed_at?: string;
  notes?: string;
  metadata: Record<string, unknown>; // Type-specific data
  sync_status: 'synced' | 'pending' | 'conflict';
  last_synced_at: string;

  // Backward compatibility - computed from metadata
  watch_time_seconds?: number;
  last_position_seconds?: number;
}

// Progress event for tracking user interactions
export interface ProgressEvent {
  userId: string;
  contentId: string;
  contextKey: string;
  progressType: 'video' | 'quiz' | 'reading' | 'worksheet' | 'course' | 'custom';
  value: number; // 0-100 percentage or custom metric
  metadata?: {
    // Video-specific
    watchTimeSeconds?: number;
    lastPositionSeconds?: number;
    videoDurationSeconds?: number;

    // Quiz-specific
    questionsAnswered?: number;
    totalQuestions?: number;
    score?: number;

    // Reading-specific
    scrollPosition?: number;
    highlightCount?: number;

    // Custom component data
    [key: string]: unknown;
  };
  timestamp?: string;
}

// Progress summary for agent queries
export interface ProgressSummary {
  userId: string;
  contextKey: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  completionPercentage: number;
  totalSessionTime: number;
  lastActivity: string;
  progressByType: Record<string, { completed: number; total: number; percentage: number }>;
}

// Completion statistics for analytics
export interface CompletionStats {
  userId: string;
  contextKey: string;
  completionsByType: Record<string, number>;
  averageSessionTime: number;
  streakDays: number;
  milestones: Milestone[];
}

// Milestone achievements
export interface Milestone {
  id: string;
  name: string;
  description: string;
  achievedAt: string;
  metadata: Record<string, unknown>;
}