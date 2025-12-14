/**
 * Simple tests for Universal Progress Tool
 * Purpose: Test core business logic without complex mocking
 * Owner: Senior Engineering Team
 * Tags: testing, progress-tracking, simple
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserProgressTool, UserProgress, ProgressEvent } from '../UserProgressTool';

// Simple mock repository for testing business logic
class MockUserProgressRepository {
  private data = new Map<string, UserProgress>();

  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    const key = `${userId}:${contentId}:${contextKey}`;
    return this.data.get(key) || null;
  }

  async setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    const key = `${userId}:${contentId}:${contextKey}`;
    const existing = this.data.get(key);

    const updated: UserProgress = {
      id: existing?.id || 'mock-id',
      user_id: userId,
      content_id: contentId,
      context_key: contextKey,
      progress_type: progress.progress_type || 'video',
      progress_percentage: progress.progress_percentage || 0,
      completion_count: progress.completion_count || 0,
      total_sessions: progress.total_sessions || 1,
      started_at: existing?.started_at || new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      completed_at: progress.completed_at || null,
      notes: progress.notes || null,
      metadata: { ...existing?.metadata, ...progress.metadata },
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      ...progress
    };

    this.data.set(key, updated);
    return updated;
  }

  async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const existing = await this.getProgress(event.userId, event.contentId, event.contextKey);

    const progress: Partial<UserProgress> = {
      progress_type: event.progressType,
      progress_percentage: event.value,
      metadata: { ...existing?.metadata, ...event.metadata },
      total_sessions: (existing?.total_sessions || 0) + 1
    };

    if (event.value >= 100) {
      progress.completed_at = event.timestamp || new Date().toISOString();
      progress.completion_count = (existing?.completion_count || 0) + 1;
    }

    return this.setProgress(event.userId, event.contentId, event.contextKey, progress);
  }

  // Implement other required methods
  async listProgressForContentIds(): Promise<UserProgress[]> { return []; }
  async getProgressSummary(): Promise<any> { return {}; }
  async getCompletionStats(): Promise<any> { return {}; }
  async checkMilestones(): Promise<any[]> { return []; }
  async batchGetProgress(): Promise<UserProgress[]> { return []; }
  async batchTrackProgress(): Promise<UserProgress[]> { return []; }
}

describe('UserProgressTool - Business Logic', () => {
  let tool: UserProgressTool;
  let repository: MockUserProgressRepository;

  beforeEach(() => {
    repository = new MockUserProgressRepository();
    tool = new UserProgressTool(repository as any);
  });

  describe('Video Progress Tracking', () => {
    it('should track video progress correctly', async () => {
      const result = await tool.trackVideoProgress('user1', 'video1', 'leaderforge', 120, 60, 240);

      expect(result.progress_type).toBe('video');
      expect(result.progress_percentage).toBe(50); // 120/240 * 100
      expect(result.metadata.watchTimeSeconds).toBe(120);
      expect(result.metadata.lastPositionSeconds).toBe(60);
      expect(result.metadata.videoDurationSeconds).toBe(240);
    });

    it('should mark video as completed when watch time equals duration', async () => {
      const result = await tool.trackVideoProgress('user1', 'video1', 'leaderforge', 240, 240, 240);

      expect(result.progress_percentage).toBe(100);
      expect(result.completed_at).toBeTruthy();
      expect(result.completion_count).toBe(1);
    });
  });

  describe('Quiz Progress Tracking', () => {
    it('should track quiz completion correctly', async () => {
      const result = await tool.trackQuizCompletion('user1', 'quiz1', 'leaderforge', 85, 10, 10);

      expect(result.progress_type).toBe('quiz');
      expect(result.progress_percentage).toBe(100);
      expect(result.metadata.score).toBe(85);
      expect(result.metadata.totalQuestions).toBe(10);
      expect(result.metadata.questionsAnswered).toBe(10);
      expect(result.completed_at).toBeTruthy();
    });
  });

  describe('Reading Progress Tracking', () => {
    it('should track reading progress correctly', async () => {
      const result = await tool.trackReadingProgress('user1', 'article1', 'leaderforge', 0.75, 3);

      expect(result.progress_type).toBe('reading');
      expect(result.progress_percentage).toBe(75);
      expect(result.metadata.scrollPosition).toBe(0.75);
      expect(result.metadata.highlightCount).toBe(3);
    });
  });

  describe('Custom Progress Events', () => {
    it('should handle custom progress events', async () => {
      const customEvent: ProgressEvent = {
        userId: 'user1',
        contentId: 'custom1',
        contextKey: 'leaderforge',
        progressType: 'custom',
        value: 60,
        metadata: {
          customField: 'customValue',
          steps: 6,
          totalSteps: 10
        }
      };

      const result = await tool.trackProgressEvent(customEvent);

      expect(result.progress_type).toBe('custom');
      expect(result.progress_percentage).toBe(60);
      expect(result.metadata.customField).toBe('customValue');
      expect(result.metadata.steps).toBe(6);
      expect(result.metadata.totalSteps).toBe(10);
    });
  });
});