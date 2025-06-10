vi.mock('./supabaseClient');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { entitlementService } from './entitlementService';
import { supabase } from './supabaseClient';

// Helper to create a fully mocked query builder chain
function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    // For double eq() in orgEntitlements
    throwOnError: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

// Helper to reset supabase.from mock
const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('entitlementService', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getUserEntitlements returns entitlements for user', async () => {
    const fakeData = [{ entitlement_id: 'abc' }];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeData, error: null })));
    const result = await entitlementService.getUserEntitlements('user-1');
    expect(result).toEqual(fakeData);
  });

  it('getUserEntitlements returns empty array if no entitlements', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [], error: null })));
    const result = await entitlementService.getUserEntitlements('user-2');
    expect(result).toEqual([]);
  });

  it('getUserEntitlements throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(entitlementService.getUserEntitlements('user-3')).rejects.toThrow('fail');
  });

  it('getOrgEntitlements returns entitlements for org', async () => {
    const fakeData = [{ entitlement_id: 'org-abc' }];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeData, error: null })));
    const result = await entitlementService.getOrgEntitlements('org-1');
    expect(result).toEqual(fakeData);
  });

  it('canUserAccessContent returns true if no policy', async () => {
    entitlementService.getUserEntitlements = vi.fn().mockResolvedValue([{ entitlement_id: 'foo' }]);
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [], error: null })));
    const result = await entitlementService.canUserAccessContent('user-1', 'content-1');
    expect(result).toBe(true);
  });

  it('canUserAccessContent returns true if user has required entitlement (any mode)', async () => {
    entitlementService.getUserEntitlements = vi.fn().mockResolvedValue([{ entitlement_id: 'foo' }]);
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [{ required_entitlements: ['foo'], access_mode: 'any' }], error: null })));
    const result = await entitlementService.canUserAccessContent('user-1', 'content-2');
    expect(result).toBe(true);
  });

  it('canUserAccessContent returns false if user lacks required entitlement (all mode)', async () => {
    entitlementService.getUserEntitlements = vi.fn().mockResolvedValue([{ entitlement_id: 'foo' }]);
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [{ required_entitlements: ['foo', 'bar'], access_mode: 'all' }], error: null })));
    const result = await entitlementService.canUserAccessContent('user-1', 'content-3');
    expect(result).toBe(false);
  });

  it('getAccessibleContent returns only accessible content', async () => {
    entitlementService.canUserAccessContent = vi.fn(async (_userId, contentId) => contentId === 'content-1');
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [
      { id: 'content-1', context_key: 'ctx' },
      { id: 'content-2', context_key: 'ctx' }
    ], error: null })));
    const result = await entitlementService.getAccessibleContent('user-1', 'ctx');
    expect(result).toEqual([{ id: 'content-1', context_key: 'ctx' }]);
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/entitlementService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */