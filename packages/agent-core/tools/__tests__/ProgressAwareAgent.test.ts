/**
 * Progress-Aware Agent Tests - Agent Integration Testing
 * Purpose: Test agent orchestration with Universal Progress Tool
 * Owner: Senior Engineering Team
 * Tags: agent-testing, progress-tracking, integration-tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressAwareAgent, createProgressAwareAgent, orchestrateWithProgress } from '../../agents/ProgressAwareAgent';
import { AgentTool } from '../ToolRegistry';
import { UserProgress, ProgressSummary, CompletionStats } from '../UserProgressTool';

// Test interfaces
interface EnhancedSchema {
  progressData: {
    completionPercentage: number;
  };
  conditionalContent: {
    showAdvanced: boolean;
    showReview: boolean;
  };
  recommendations: unknown[];
}

// Mock agent tool for testing
const createMockUniversalProgressTool = (): AgentTool => ({
  name: 'universalProgress',
  description: 'Mock Universal Progress Tool',
  async run(input, context) {
    const { action } = input;

    switch (action) {
      case 'getProgressSummary':
        return {
          userId: context.userId,
          contextKey: context.contextKey,
          totalItems: 10,
          completedItems: 6,
          inProgressItems: 2,
          completionPercentage: 60,
          totalSessionTime: 1800,
          lastActivity: '2024-01-15T10:00:00Z',
          progressByType: {
            video: { completed: 4, total: 6, percentage: 67 },
            quiz: { completed: 2, total: 4, percentage: 50 }
          }
        } as ProgressSummary;

      case 'trackProgressEvent':
        return {
          id: `progress-${input.progressEvent.contentId}`,
          user_id: input.progressEvent.userId,
          content_id: input.progressEvent.contentId,
          context_key: input.progressEvent.contextKey,
          progress_type: input.progressEvent.progressType,
          progress_percentage: input.progressEvent.value,
          completion_count: input.progressEvent.value >= 100 ? 1 : 0,
          total_sessions: 1,
          started_at: '2024-01-15T09:00:00Z',
          last_viewed_at: new Date().toISOString(),
          completed_at: input.progressEvent.value >= 100 ? new Date().toISOString() : undefined,
          metadata: input.progressEvent.metadata,
          sync_status: 'synced' as const,
          last_synced_at: new Date().toISOString()
        } as UserProgress;

      case 'getCompletionStats':
        return {
          userId: context.userId,
          contextKey: context.contextKey,
          completionsByType: { video: 4, quiz: 2 },
          averageSessionTime: 15,
          streakDays: 3,
          milestones: []
        } as CompletionStats;

      case 'checkMilestones':
        return [] as unknown[];

      case 'batchGetProgress': {
        const queries = input.queries || [];
        return queries.map((query: { userId: string; contentId: string; contextKey: string }) => ({
          id: `progress-${query.contentId}`,
          user_id: query.userId,
          content_id: query.contentId,
          context_key: query.contextKey,
          progress_type: 'video',
          progress_percentage: query.contentId === 'content-1' ? 100 :
                              query.contentId === 'content-2' ? 50 : 0,
          completion_count: query.contentId === 'content-1' ? 1 : 0,
          total_sessions: 1,
          started_at: '2024-01-15T09:00:00Z',
          last_viewed_at: '2024-01-15T10:00:00Z',
          completed_at: query.contentId === 'content-1' ? '2024-01-15T10:00:00Z' : undefined,
          metadata: { watchTimeSeconds: 120 },
                    sync_status: 'synced' as const,
          last_synced_at: '2024-01-15T10:00:00Z'
        })) as UserProgress[];
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
});

describe('ProgressAwareAgent', () => {
  let agent: ProgressAwareAgent;
  let mockTool: AgentTool;

  beforeEach(() => {
    mockTool = createMockUniversalProgressTool();
    agent = createProgressAwareAgent(mockTool);
  });

  describe('analyzeProgress', () => {
    it('should analyze progress and make continue decision for steady progress', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const decision = await agent.analyzeProgress(context);

      expect(decision.action).toBe('continue');
      expect(decision.reason).toContain('steady progress');
      expect(decision.metadata).toHaveProperty('completionRate', 60);
    });

    it('should recommend advanced content for high completion rate', async () => {
      // Mock high completion rate
      const highCompletionTool: AgentTool = {
        ...mockTool,
        async run(input, context) {
          if (input.action === 'getProgressSummary') {
            return {
              ...await mockTool.run(input, context),
              completionPercentage: 85,
              completedItems: 8
            };
          }
          return mockTool.run(input, context);
        }
      };

      const highCompletionAgent = createProgressAwareAgent(highCompletionTool);
      const decision = await highCompletionAgent.analyzeProgress({
        userId: 'user-123',
        contextKey: 'test-context'
      });

      expect(decision.action).toBe('recommend');
      expect(decision.reason).toContain('advanced content');
      expect(decision.metadata?.recommendationType).toBe('advanced');
    });
  });

  describe('getRecommendations', () => {
    it('should generate personalized content recommendations', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const availableContent = ['content-1', 'content-2', 'content-3'];
      const recommendations = await agent.getRecommendations(context, availableContent);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Should prioritize incomplete content
      const incompleteRec = recommendations.find(r => r.contentId === 'content-2');
      expect(incompleteRec).toBeDefined();
      expect(incompleteRec?.reason).toContain('50% complete');
      expect(incompleteRec?.priority).toBe('medium');
    });

    it('should sort recommendations by priority', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const availableContent = ['content-1', 'content-2', 'content-3'];
      const recommendations = await agent.getRecommendations(context, availableContent);

      // Verify sorting (high priority first)
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        expect(priorityOrder[current.priority]).toBeGreaterThanOrEqual(
          priorityOrder[next.priority]
        );
      }
    });
  });

  describe('checkPrerequisites', () => {
    it('should return true when no prerequisites exist', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const result = await agent.checkPrerequisites(context, 'content-1', []);
      expect(result).toBe(true);
    });

    it('should check prerequisite completion correctly', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      // content-1 is 100% complete, content-2 is 50% complete
      const resultMet = await agent.checkPrerequisites(context, 'target-content', ['content-1']);
      expect(resultMet).toBe(true);

      const resultNotMet = await agent.checkPrerequisites(context, 'target-content', ['content-2']);
      expect(resultNotMet).toBe(false);
    });
  });

  describe('generateProgressSchema', () => {
    it('should enhance base schema with progress data', async () => {
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const baseSchema = {
        type: 'content-panel',
        title: 'Learning Content',
        availableContent: ['content-1', 'content-2']
      };

      const enhancedSchema = await agent.generateProgressSchema(context, baseSchema) as unknown as EnhancedSchema;

      expect(enhancedSchema).toHaveProperty('progressData');
      expect(enhancedSchema).toHaveProperty('conditionalContent');
      expect(enhancedSchema).toHaveProperty('recommendations');
      expect(enhancedSchema.progressData.completionPercentage).toBe(60);
      expect(enhancedSchema.conditionalContent.showAdvanced).toBe(false); // 60% < 70%
      expect(enhancedSchema.conditionalContent.showReview).toBe(false); // 60% >= 50%
    });
  });

  describe('trackAgentProgress', () => {
    it('should track agent-initiated progress events', async () => {
      const mockTrackTool: AgentTool = {
        ...mockTool,
        async run(input, context) {
          if (input.action === 'trackProgressEvent') {
            expect(input.progressEvent.metadata.source).toBe('agent');
            return {
              id: 'progress-123',
              user_id: context.userId,
              content_id: input.progressEvent.contentId,
              context_key: context.contextKey,
              progress_type: input.progressEvent.progressType,
              progress_percentage: input.progressEvent.value,
              completion_count: 0,
              total_sessions: 1,
              started_at: '2024-01-15T09:00:00Z',
              last_viewed_at: '2024-01-15T10:00:00Z',
              metadata: input.progressEvent.metadata,
              sync_status: 'synced' as const,
              last_synced_at: '2024-01-15T10:00:00Z'
            } as UserProgress;
          }
          return mockTool.run(input, context);
        }
      };

      const trackingAgent = createProgressAwareAgent(mockTrackTool);
      const context = {
        userId: 'user-123',
        contextKey: 'test-context'
      };

      const result = await trackingAgent.trackAgentProgress(
        context,
        'content-1',
        'video',
        75,
        { agentAction: 'recommendation' }
      );

      expect(result).toBeDefined();
      expect(result.progress_percentage).toBe(75);
      expect(result.metadata.source).toBe('agent');
    });
  });
});

describe('orchestrateWithProgress', () => {
  it('should orchestrate schema enhancement with progress analysis', async () => {
    const mockTool = createMockUniversalProgressTool();
    const context = {
      userId: 'user-123',
      contextKey: 'test-context'
    };

    const baseSchema = {
      type: 'dashboard',
      title: 'Learning Dashboard',
      availableContent: ['content-1', 'content-2', 'content-3']
    };

    const result = await orchestrateWithProgress(context, mockTool, baseSchema);

    expect(result).toHaveProperty('progressData');
    expect(result).toHaveProperty('orchestrationDecision');
    expect(result).toHaveProperty('progressAware', true);
    expect(result).toHaveProperty('timestamp');

    expect(result.orchestrationDecision.action).toBe('continue');
    expect(result.progressData.completionPercentage).toBe(60);
  });
});

describe('Progress-Aware Agent Integration', () => {
  it('should integrate with Universal Progress Tool for end-to-end workflow', async () => {
    const mockTool = createMockUniversalProgressTool();
    const agent = createProgressAwareAgent(mockTool);

    const context = {
      userId: 'user-123',
      contextKey: 'test-context'
    };

    // Step 1: Analyze current progress
    const decision = await agent.analyzeProgress(context);
    expect(decision.action).toBe('continue');

    // Step 2: Get recommendations
    const recommendations = await agent.getRecommendations(context, ['content-1', 'content-2', 'content-3']);
    expect(recommendations.length).toBeGreaterThan(0);

    // Step 3: Check prerequisites
    const canAccess = await agent.checkPrerequisites(context, 'advanced-content', ['content-1']);
    expect(canAccess).toBe(true);

    // Step 4: Generate enhanced schema
    const baseSchema = { type: 'component', title: 'Test Component', availableContent: [] };
    const enhancedSchema = await agent.generateProgressSchema(context, baseSchema);
    expect(enhancedSchema.progressData).toBeDefined();

    // Step 5: Track agent progress
    const progressResult = await agent.trackAgentProgress(context, 'content-1', 'video', 100);
    expect(progressResult.progress_percentage).toBe(100);
  });
});