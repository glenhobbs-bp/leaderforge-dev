/**
 * Tests for Universal Progress Tool
 * Purpose: Validate universal progress tracking functionality
 * Owner: Senior Engineering Team
 * Tags: testing, progress-tracking, agent-native
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UserProgressTool,
  SupabaseUserProgressRepository,
  ProgressEvent
} from '../UserProgressTool';

// Create a comprehensive mock that handles all Supabase chaining
const createMockSupabase = () => {
  const mockResult = {
    data: null,
    error: null
  };

  // Create the chainable mock with all methods returning this
  const chainableMock = {
    // Schema and table methods
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),

    // Query methods
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),

    // Filter methods
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),

    // Modifier methods
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),

    // Terminal methods that return promises
    single: vi.fn().mockResolvedValue(mockResult),
    maybeSingle: vi.fn().mockResolvedValue(mockResult),
    then: vi.fn().mockResolvedValue(mockResult),

    // For non-terminal operations, return the chain
    mockReturnThis: function() { return this; }
  };

  // Make all methods return the chainable mock
  Object.keys(chainableMock).forEach(key => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then' && key !== 'mockReturnThis') {
      chainableMock[key as keyof typeof chainableMock] = vi.fn().mockReturnValue(chainableMock);
    }
  });

  return chainableMock;
};

const mockSupabase = createMockSupabase();

describe('UserProgressTool', () => {
  let tool: UserProgressTool;
  let repository: SupabaseUserProgressRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseUserProgressRepository(mockSupabase);
    tool = new UserProgressTool(repository);
  });

  describe('Backward Compatibility', () => {
    it('should get progress for single content item', async () => {
      const mockProgress = {
        id: '123',
        user_id: 'user1',
        content_id: 'content1',
        context_key: 'leaderforge',
        progress_type: 'video',
        progress_percentage: 75,
        completion_count: 0,
        total_sessions: 3,
        started_at: '2024-01-01T00:00:00Z',
        last_viewed_at: '2024-01-02T00:00:00Z',
        completed_at: null,
        notes: null,
        metadata: { watchTimeSeconds: 120, lastPositionSeconds: 45 },
        sync_status: 'synced',
        last_synced_at: '2024-01-02T00:00:00Z'
      };

      // Set up the mock to return the progress data
      mockSupabase.single.mockResolvedValue({ data: mockProgress, error: null });

      const result = await tool.getProgress('user1', 'content1', 'leaderforge');

      expect(mockSupabase.schema).toHaveBeenCalledWith('core');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
      expect(result).toEqual(expect.objectContaining({
        user_id: 'user1',
        content_id: 'content1',
        context_key: 'leaderforge',
        progress_percentage: 75,
        // Backward compatibility fields
        watch_time_seconds: 120,
        last_position_seconds: 45
      }));
    });

    it('should handle legacy video progress tracking', async () => {
      const mockUpdatedProgress = {
        id: '123',
        user_id: 'user1',
        content_id: 'video1',
        context_key: 'leaderforge',
        progress_type: 'video',
        progress_percentage: 50,
        metadata: { watchTimeSeconds: 120, lastPositionSeconds: 60, videoDurationSeconds: 120 }
      };

      // First call (select) returns no existing record
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // Second call (upsert) returns the created record
      mockSupabase.single.mockResolvedValueOnce({ data: mockUpdatedProgress, error: null });

      const result = await tool.trackVideoProgress('user1', 'video1', 'leaderforge', 120, 60, 120);

      expect(result.progress_percentage).toBe(50);
      expect(result.metadata).toEqual({
        watchTimeSeconds: 120,
        lastPositionSeconds: 60,
        videoDurationSeconds: 120
      });
    });
  });

  describe('Universal Progress Events', () => {
    it('should track quiz completion event', async () => {
      const mockQuizProgress = {
        id: '456',
        user_id: 'user1',
        content_id: 'quiz1',
        context_key: 'leaderforge',
        progress_type: 'quiz',
        progress_percentage: 100,
        completed_at: '2024-01-02T00:00:00Z',
        metadata: { score: 85, totalQuestions: 10, questionsAnswered: 10 }
      };

      // First call (select) returns no existing record
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // Second call (upsert) returns the created record
      mockSupabase.single.mockResolvedValueOnce({ data: mockQuizProgress, error: null });

      const result = await tool.trackQuizCompletion('user1', 'quiz1', 'leaderforge', 85, 10, 10);

      expect(result.progress_type).toBe('quiz');
      expect(result.progress_percentage).toBe(100);
      expect(result.metadata).toEqual({
        score: 85,
        totalQuestions: 10,
        questionsAnswered: 10
      });
    });

    it('should track reading progress event', async () => {
      const mockReadingProgress = {
        id: '789',
        user_id: 'user1',
        content_id: 'article1',
        context_key: 'leaderforge',
        progress_type: 'reading',
        progress_percentage: 75,
        metadata: { scrollPosition: 0.75, highlightCount: 3 }
      };

      // First call (select) returns no existing record
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // Second call (upsert) returns the created record
      mockSupabase.single.mockResolvedValueOnce({ data: mockReadingProgress, error: null });

      const result = await tool.trackReadingProgress('user1', 'article1', 'leaderforge', 0.75, 3);

      expect(result.progress_type).toBe('reading');
      expect(result.progress_percentage).toBe(75);
      expect(result.metadata).toEqual({
        scrollPosition: 0.75,
        highlightCount: 3
      });
    });

    it('should track custom progress event', async () => {
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

      const mockCustomProgress = {
        id: '999',
        user_id: 'user1',
        content_id: 'custom1',
        context_key: 'leaderforge',
        progress_type: 'custom',
        progress_percentage: 60,
        metadata: customEvent.metadata
      };

      // First call (select) returns no existing record
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      // Second call (upsert) returns the created record
      mockSupabase.single.mockResolvedValueOnce({ data: mockCustomProgress, error: null });

      const result = await tool.trackProgressEvent(customEvent);

      expect(result.progress_type).toBe('custom');
      expect(result.progress_percentage).toBe(60);
      expect(result.metadata).toEqual(customEvent.metadata);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch progress queries', async () => {
      const queries = [
        { userId: 'user1', contentId: 'content1', contextKey: 'leaderforge' },
        { userId: 'user1', contentId: 'content2', contextKey: 'leaderforge' }
      ];

      mockSupabase.single.mockResolvedValue({ data: { id: '1' }, error: null });

      const results = await tool.batchGetProgress(queries);

      expect(results).toHaveLength(2);
      expect(mockSupabase.single).toHaveBeenCalledTimes(2);
    });

    it('should handle batch progress tracking', async () => {
      const events: ProgressEvent[] = [
        {
          userId: 'user1',
          contentId: 'video1',
          contextKey: 'leaderforge',
          progressType: 'video',
          value: 25
        },
        {
          userId: 'user1',
          contentId: 'quiz1',
          contextKey: 'leaderforge',
          progressType: 'quiz',
          value: 100
        }
      ];

      // First call (select) returns no existing record
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      // Second call (upsert) returns the created record
      mockSupabase.single.mockResolvedValue({ data: { id: '1' }, error: null });

      const results = await tool.batchTrackProgress(events);

      expect(results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' }
      });

      await expect(tool.getProgress('user1', 'content1', 'leaderforge'))
        .rejects.toThrow();
    });

    it('should handle empty batch operations', async () => {
      const results = await tool.batchGetProgress([]);
      expect(results).toEqual([]);
    });
  });
});

describe('SupabaseUserProgressRepository', () => {
  let repository: SupabaseUserProgressRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseUserProgressRepository(mockSupabase);
  });

  describe('Schema Migration', () => {
    it('should use core schema instead of modules', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      await repository.getProgress('user1', 'content1', 'context1');

      expect(mockSupabase.schema).toHaveBeenCalledWith('core');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
    });
  });

  describe('Metadata Transformation', () => {
    it('should transform video-specific fields to metadata', async () => {
      const progressWithLegacyFields = {
        watch_time_seconds: 120,
        last_position_seconds: 45,
        progress_type: 'video' as const
      };

      mockSupabase.single.mockResolvedValue({ data: { id: '1' }, error: null });

      await repository.setProgress('user1', 'content1', 'context1', progressWithLegacyFields);

      const expectedUpsertCall = expect.objectContaining({
        metadata: expect.objectContaining({
          watchTimeSeconds: 120,
          lastPositionSeconds: 45
        })
      });

      expect(mockSupabase.upsert).toHaveBeenCalledWith([expectedUpsertCall], expect.any(Object));
    });
  });
});