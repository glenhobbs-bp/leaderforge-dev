/**
 * Progress Schema Types - Schema Integration for Universal Progress Tool
 * Purpose: Enable progress data inclusion in component schemas for agent orchestration
 * Owner: Senior Engineering Team
 * Tags: schema-driven, progress-tracking, agent-native
 */

import { UserProgress, ProgressSummary, CompletionStats } from '../tools/UserProgressTool';

/**
 * Progress data that can be included in component schemas
 */
export interface ProgressSchemaData {
  summary: ProgressSummary;
  completionPercentage: number;
  lastActivity: string;
  progressByType: Record<string, { completed: number; total: number; percentage: number }>;
  milestones?: Array<{
    id: string;
    name: string;
    achievedAt: string;
    description: string;
  }>;
}

/**
 * Conditional content flags based on progress
 */
export interface ConditionalContent {
  showAdvanced: boolean;
  showReview: boolean;
  showCelebration: boolean;
  enableNextModule: boolean;
  showPrerequisites: boolean;
  allowSkip: boolean;
}

/**
 * Progress-based recommendations for content
 */
export interface ProgressRecommendation {
  contentId: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: number;
  prerequisites?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Enhanced component schema with progress awareness
 */
export interface ProgressAwareSchema {
  // Base schema properties
  type: string;
  title: string;
  description?: string;

  // Progress integration
  progressData?: ProgressSchemaData;
  conditionalContent?: ConditionalContent;
  recommendations?: ProgressRecommendation[];

  // Content-specific progress
  contentProgress?: Record<string, UserProgress>;

  // Agent orchestration metadata
  orchestrationDecision?: {
    action: 'continue' | 'recommend' | 'unlock' | 'celebrate' | 'redirect';
    reason: string;
    metadata?: Record<string, unknown>;
  };

  // Original schema properties
  [key: string]: unknown;
}

/**
 * Progress-aware content item schema
 */
export interface ProgressAwareContentItem {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'worksheet' | 'course';

  // Progress state
  progress?: UserProgress;
  isCompleted: boolean;
  isInProgress: boolean;
  isLocked: boolean;

  // Prerequisites
  prerequisites?: string[];
  hasPrerequisites: boolean;

  // Recommendations
  recommendationPriority?: 'high' | 'medium' | 'low';
  estimatedTime?: number;

  // Conditional visibility
  isVisible: boolean;
  showAdvanced: boolean;
}

/**
 * Progress-aware navigation schema
 */
export interface ProgressAwareNavigation {
  currentPath: string;
  availablePaths: Array<{
    path: string;
    title: string;
    isUnlocked: boolean;
    progress?: number;
    isRecommended: boolean;
  }>;

  // Progress-based navigation hints
  nextRecommended?: string;
  reviewRecommended?: string[];
  celebrationPath?: string;
}

/**
 * Progress analytics for dashboard schemas
 */
export interface ProgressAnalytics {
  totalContent: number;
  completedContent: number;
  inProgressContent: number;
  completionRate: number;

  // Time analytics
  totalTimeSpent: number;
  averageSessionTime: number;
  lastActivityDate: string;

  // Type breakdown
  progressByType: Record<string, {
    total: number;
    completed: number;
    percentage: number;
  }>;

  // Streaks and milestones
  currentStreak: number;
  longestStreak: number;
  milestonesAchieved: number;

  // Trends
  weeklyProgress: Array<{
    week: string;
    completions: number;
    timeSpent: number;
  }>;
}

/**
 * Schema enhancement utilities
 */
export class ProgressSchemaEnhancer {

  /**
   * Enhance a base schema with progress data
   */
  static enhanceSchema(
    baseSchema: Record<string, unknown>,
    progressData: ProgressSchemaData,
    conditionalContent: ConditionalContent,
    recommendations: ProgressRecommendation[]
  ): ProgressAwareSchema {
    return {
      type: (baseSchema.type as string) || 'component',
      title: (baseSchema.title as string) || 'Component',
      ...baseSchema,
      progressData,
      conditionalContent,
      recommendations,
      orchestrationDecision: this.generateOrchestrationDecision(progressData),
      progressAware: true,
      enhancedAt: new Date().toISOString()
    };
  }

  /**
   * Create progress-aware content items from content list
   */
  static createProgressAwareContent(
    contentList: Array<{ id: string; title: string; type: string }>,
    progressMap: Record<string, UserProgress>,
    prerequisites: Record<string, string[]> = {}
  ): ProgressAwareContentItem[] {
    return contentList.map(content => {
      const progress = progressMap[content.id];
      const hasPrereqs = prerequisites[content.id]?.length > 0;
      const prereqsMet = hasPrereqs ?
        prerequisites[content.id].every(prereqId =>
          progressMap[prereqId]?.progress_percentage >= 100
        ) : true;

      return {
        id: content.id,
        title: content.title,
        type: content.type as any,
        progress,
        isCompleted: progress?.progress_percentage >= 100 || false,
        isInProgress: progress?.progress_percentage > 0 && progress?.progress_percentage < 100 || false,
        isLocked: hasPrereqs && !prereqsMet,
        prerequisites: prerequisites[content.id] || [],
        hasPrerequisites: hasPrereqs,
        isVisible: !hasPrereqs || prereqsMet,
        showAdvanced: progress?.progress_percentage >= 70 || false,
        estimatedTime: this.estimateContentTime(progress)
      };
    });
  }

  /**
   * Create progress-aware navigation
   */
  static createProgressAwareNavigation(
    currentPath: string,
    availablePaths: Array<{ path: string; title: string }>,
    progressSummary: ProgressSummary
  ): ProgressAwareNavigation {
    return {
      currentPath,
      availablePaths: availablePaths.map(path => ({
        ...path,
        isUnlocked: true, // Would be based on progress rules
        progress: this.calculatePathProgress(path.path, progressSummary),
        isRecommended: this.isPathRecommended(path.path, progressSummary)
      })),
      nextRecommended: this.getNextRecommendedPath(progressSummary),
      reviewRecommended: this.getReviewPaths(progressSummary)
    };
  }

  /**
   * Generate analytics schema for dashboards
   */
  static generateAnalyticsSchema(
    progressSummary: ProgressSummary,
    completionStats: CompletionStats
  ): ProgressAnalytics {
    return {
      totalContent: progressSummary.totalItems,
      completedContent: progressSummary.completedItems,
      inProgressContent: progressSummary.inProgressItems,
      completionRate: progressSummary.completionPercentage,

      totalTimeSpent: progressSummary.totalSessionTime,
      averageSessionTime: completionStats.averageSessionTime,
      lastActivityDate: progressSummary.lastActivity,

      progressByType: progressSummary.progressByType,

      currentStreak: completionStats.streakDays,
      longestStreak: completionStats.streakDays, // Would be calculated separately
      milestonesAchieved: completionStats.milestones.length,

      weeklyProgress: [] // Would be calculated from historical data
    };
  }

  // Private helper methods
  private static generateOrchestrationDecision(progressData: ProgressSchemaData) {
    if (progressData.completionPercentage >= 90) {
      return {
        action: 'celebrate' as const,
        reason: 'Excellent progress! You\'re nearly done!',
        metadata: { completionRate: progressData.completionPercentage }
      };
    }

    if (progressData.completionPercentage >= 70) {
      return {
        action: 'recommend' as const,
        reason: 'Great progress! Ready for advanced content',
        metadata: { completionRate: progressData.completionPercentage }
      };
    }

    return {
      action: 'continue' as const,
      reason: 'Keep up the good work!',
      metadata: { completionRate: progressData.completionPercentage }
    };
  }

  private static estimateContentTime(progress?: UserProgress): number {
    if (!progress) return 15; // Default estimate
    const remaining = 100 - progress.progress_percentage;
    const avgTime = (progress.metadata as any)?.averageSessionTime || 10;
    return Math.ceil((remaining / 100) * avgTime);
  }

  private static calculatePathProgress(path: string, summary: ProgressSummary): number {
    // Would calculate based on path-specific content
    return summary.completionPercentage;
  }

  private static isPathRecommended(path: string, summary: ProgressSummary): boolean {
    // Would implement recommendation logic based on progress patterns
    return summary.completionPercentage > 50;
  }

  private static getNextRecommendedPath(summary: ProgressSummary): string | undefined {
    // Would implement next path recommendation logic
    return summary.completionPercentage > 80 ? '/advanced' : undefined;
  }

  private static getReviewPaths(summary: ProgressSummary): string[] {
    // Would implement review path logic
    return summary.completionPercentage < 50 ? ['/basics'] : [];
  }
}

// Types are already exported via interface declarations above