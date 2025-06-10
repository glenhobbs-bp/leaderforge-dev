vi.mock('./supabaseClient');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contextService } from './contextService';
import { supabase } from './supabaseClient';

function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('contextService', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getContextConfig returns config by key', async () => {
    const fakeConfig = { context_key: 'leaderforge', theme: 'dark' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeConfig, error: null })));
    const result = await contextService.getContextConfig('leaderforge');
    expect(result).toEqual(fakeConfig);
  });

  it('getContextConfig returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await contextService.getContextConfig('missing');
    expect(result).toBeNull();
  });

  it('getContextConfig throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(contextService.getContextConfig('fail')).rejects.toThrow('fail');
  });

  it('getAllContexts returns all configs', async () => {
    const fakeConfigs = [
      { context_key: 'leaderforge', theme: 'dark' },
      { context_key: 'movement', theme: 'light' },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeConfigs, error: null })));
    const result = await contextService.getAllContexts();
    expect(result).toEqual(fakeConfigs);
  });

  it('getAllContexts returns empty array if no configs', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await contextService.getAllContexts();
    expect(result).toEqual([]);
  });

  it('getAllContexts throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(contextService.getAllContexts()).rejects.toThrow('fail');
  });

  it('updateContextConfig updates and returns config', async () => {
    const fakeConfig = { context_key: 'leaderforge', theme: 'dark' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeConfig, error: null })));
    const result = await contextService.updateContextConfig('leaderforge', { theme: 'dark' });
    expect(result).toEqual(fakeConfig);
  });

  it('updateContextConfig returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await contextService.updateContextConfig('missing', { theme: 'light' });
    expect(result).toBeNull();
  });

  it('updateContextConfig throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(contextService.updateContextConfig('fail', { theme: 'fail' })).rejects.toThrow('fail');
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/contextService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */