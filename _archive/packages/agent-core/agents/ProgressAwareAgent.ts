/**
 * Progress-Aware Agent - Agent Integration for Universal Progress Tool
 * Purpose: Enable agents to make orchestration decisions based on user progress
 * Owner: Senior Engineering Team
 * Tags: agent-orchestration, progress-tracking, agent-native
 */

import { AgentTool } from '../tools/ToolRegistry';
import { UserProgress, ProgressSummary, CompletionStats } from '../tools/UserProgressTool';

export interface ProgressContext {
  userId: string;
  tenantKey: string;
  currentProgress?: ProgressSummary;
  completionStats?: CompletionStats;
}

export interface ProgressDecision {
  action: 'continue' | 'recommend' | 'unlock' | 'celebrate' | 'redirect';
  contentId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ProgressRecommendation {
  contentId: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: number;
  prerequisites?: string[];
}

/**
 * Progress-Aware Agent for intelligent content orchestration
 */
export class ProgressAwareAgent {
  constructor(private universalProgressTool: AgentTool) {}

  /**
   * Analyze user progress and make orchestration decisions
   */
  async analyzeProgress(context: ProgressContext): Promise<ProgressDecision> {
    // Get current progress summary
    const progressSummary = await this.universalProgressTool.run(
      { action: 'getProgressSummary' },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as ProgressSummary;

    // Get completion stats for deeper analysis
    const completionStats = await this.universalProgressTool.run(
      { action: 'getCompletionStats' },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as CompletionStats;

    // Check for milestones
    const milestones = await this.universalProgressTool.run(
      { action: 'checkMilestones' },
      { userId: context.userId, tenantKey: context.tenantKey }
    );

    // Decision logic based on progress patterns
    return this.makeProgressDecision(progressSummary, completionStats, milestones);
  }

  /**
   * Get personalized content recommendations based on progress
   */
  async getRecommendations(context: ProgressContext, availableContent: string[]): Promise<ProgressRecommendation[]> {
    const progressSummary = await this.universalProgressTool.run(
      { action: 'getProgressSummary' },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as ProgressSummary;

    const completionStats = await this.universalProgressTool.run(
      { action: 'getCompletionStats' },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as CompletionStats;

        // Get progress for available content
    const contentProgress = await this.universalProgressTool.run(
      {
        action: 'batchGetProgress',
        queries: availableContent.map(contentId => ({
          userId: context.userId,
          contentId,
          tenantKey: context.tenantKey
        }))
      },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as UserProgress[];

    return this.generateRecommendations(progressSummary, completionStats, contentProgress, availableContent);
  }

  /**
   * Check if user has prerequisites for specific content
   */
  async checkPrerequisites(context: ProgressContext, contentId: string, prerequisites: string[]): Promise<boolean> {
    if (!prerequisites.length) return true;

    const prerequisiteProgress = await this.universalProgressTool.run(
      {
        action: 'batchGetProgress',
        queries: prerequisites.map(prereqId => ({
          userId: context.userId,
          contentId: prereqId,
          tenantKey: context.tenantKey
        }))
      },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as UserProgress[];

    // Check if all prerequisites are completed (100% progress)
    return prerequisiteProgress.every(progress =>
      progress && progress.progress_percentage >= 100
    );
  }

  /**
   * Generate progress-based UI schema modifications
   */
  async generateProgressSchema(context: ProgressContext, baseSchema: Record<string, unknown>): Promise<Record<string, unknown>> {
    const progressSummary = await this.universalProgressTool.run(
      { action: 'getProgressSummary' },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as ProgressSummary;

    // Enhance schema with progress data
    return {
      ...baseSchema,
      progressData: {
        summary: progressSummary,
        completionPercentage: progressSummary.completionPercentage,
        lastActivity: progressSummary.lastActivity,
        progressByType: progressSummary.progressByType
      },
      // Add progress-based conditional rendering
      conditionalContent: this.generateConditionalContent(progressSummary),
      // Add progress-based recommendations
      recommendations: await this.getRecommendations(context, (baseSchema.availableContent as string[]) || [])
    };
  }

  /**
   * Track agent-initiated progress events
   */
  async trackAgentProgress(context: ProgressContext, contentId: string, progressType: string, value: number, metadata?: Record<string, unknown>): Promise<UserProgress> {
    return await this.universalProgressTool.run(
      {
        action: 'trackProgressEvent',
        progressEvent: {
          userId: context.userId,
          contentId,
          tenantKey: context.tenantKey,
          progressType,
          value,
          metadata: {
            ...metadata,
            source: 'agent',
            timestamp: new Date().toISOString()
          }
        }
      },
      { userId: context.userId, tenantKey: context.tenantKey }
    ) as UserProgress;
  }

  /**
   * Private: Make orchestration decision based on progress data
   */
  private makeProgressDecision(
    progressSummary: ProgressSummary,
    completionStats: CompletionStats,
    milestones: any[]
  ): ProgressDecision {
    // Celebrate milestone achievements
    if (milestones.length > 0) {
      return {
        action: 'celebrate',
        reason: `Congratulations! You've achieved ${milestones.length} milestone(s)`,
        metadata: { milestones }
      };
    }

    // High completion rate - recommend advanced content
    if (progressSummary.completionPercentage >= 80) {
      return {
        action: 'recommend',
        reason: 'Great progress! Ready for advanced content',
        metadata: {
          completionRate: progressSummary.completionPercentage,
          recommendationType: 'advanced'
        }
      };
    }

    // Low completion rate - recommend review or easier content
    if (progressSummary.completionPercentage < 30 && progressSummary.inProgressItems > 0) {
      return {
        action: 'recommend',
        reason: 'Let\'s focus on completing current content',
        metadata: {
          completionRate: progressSummary.completionPercentage,
          recommendationType: 'review'
        }
      };
    }

    // Steady progress - continue current path
    return {
      action: 'continue',
      reason: 'Making steady progress, keep going!',
      metadata: {
        completionRate: progressSummary.completionPercentage,
        inProgress: progressSummary.inProgressItems
      }
    };
  }

  /**
   * Private: Generate content recommendations based on progress
   */
  private generateRecommendations(
    progressSummary: ProgressSummary,
    completionStats: CompletionStats,
    contentProgress: UserProgress[],
    availableContent: string[]
  ): ProgressRecommendation[] {
    const recommendations: ProgressRecommendation[] = [];

    // Recommend incomplete content with high priority
    const incompleteContent = contentProgress.filter(p => p.progress_percentage < 100);
    incompleteContent.forEach(progress => {
      recommendations.push({
        contentId: progress.content_id,
        title: `Continue: ${progress.content_id}`,
        reason: `${progress.progress_percentage}% complete`,
        priority: progress.progress_percentage > 50 ? 'high' : 'medium',
        estimatedTime: this.estimateTimeToComplete(progress)
      });
    });

        // Recommend new content based on completion patterns
    const newContent = availableContent.filter(contentId =>
      !contentProgress.some(p => p.content_id === contentId)
    );

    newContent.slice(0, 3).forEach(contentId => {
      recommendations.push({
        contentId,
        title: `New: ${contentId}`,
        reason: 'Based on your progress pattern',
        priority: 'medium'
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Private: Generate conditional content based on progress
   */
  private generateConditionalContent(progressSummary: ProgressSummary): any {
    return {
      showAdvanced: progressSummary.completionPercentage >= 70,
      showReview: progressSummary.completionPercentage < 50 && progressSummary.inProgressItems > 0,
      showCelebration: progressSummary.completionPercentage >= 100,
      enableNextModule: progressSummary.completionPercentage >= 80
    };
  }

  /**
   * Private: Estimate time to complete based on progress
   */
  private estimateTimeToComplete(progress: UserProgress): number {
    const remaining = 100 - progress.progress_percentage;
    const avgSessionTime = (progress.metadata as any)?.averageSessionTime || 10;
    return Math.ceil((remaining / 100) * avgSessionTime);
  }
}

/**
 * Factory function to create Progress-Aware Agent with Universal Progress Tool
 */
export function createProgressAwareAgent(universalProgressTool: AgentTool): ProgressAwareAgent {
  return new ProgressAwareAgent(universalProgressTool);
}

/**
 * Agent orchestration helper for progress-based decisions
 */
export async function orchestrateWithProgress(
  context: ProgressContext,
  universalProgressTool: AgentTool,
  baseSchema: any
): Promise<any> {
  const agent = createProgressAwareAgent(universalProgressTool);

  // Analyze progress and make decisions
  const decision = await agent.analyzeProgress(context);

  // Generate enhanced schema with progress data
  const enhancedSchema = await agent.generateProgressSchema(context, baseSchema);

  return {
    ...enhancedSchema,
    orchestrationDecision: decision,
    progressAware: true,
    timestamp: new Date().toISOString()
  };
}