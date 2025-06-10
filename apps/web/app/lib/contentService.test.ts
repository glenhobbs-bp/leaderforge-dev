vi.mock('./supabaseClient');
vi.mock('./entitlementService');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contentService } from './contentService';
import { supabase } from './supabaseClient';
import { entitlementService } from './entitlementService';

function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('contentService', () => {
  beforeEach(() => {
    resetSupabaseMock();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getContentForContext returns all content if no entitlements required', async () => {
    const content = [
      { id: 'c1', required_entitlements: [] },
      { id: 'c2', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentForContext('ctx', 'user-1');
    expect(result).toEqual(content);
  });

  it('getContentForContext filters by entitlement', async () => {
    const content = [
      { id: 'c1', required_entitlements: ['e1'] },
      { id: 'c2', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([{ entitlement_id: 'e1' }]);
    const result = await contentService.getContentForContext('ctx', 'user-1');
    expect(result).toEqual(content);
  });

  it('getContentForContext excludes content if user lacks entitlement', async () => {
    const content = [
      { id: 'c1', required_entitlements: ['e1'] },
      { id: 'c2', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentForContext('ctx', 'user-1');
    expect(result).toEqual([content[1]]);
  });

  it('getContentForContext returns empty array if no content', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentForContext('ctx', 'user-1');
    expect(result).toEqual([]);
  });

  it('getContentForContext throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(contentService.getContentForContext('ctx', 'user-1')).rejects.toThrow('fail');
  });

  it('getContentById returns content if user has entitlement', async () => {
    const content = { id: 'c1', required_entitlements: ['e1'] };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([{ entitlement_id: 'e1' }]);
    const result = await contentService.getContentById('c1', 'user-1');
    expect(result).toEqual(content);
  });

  it('getContentById returns null if user lacks entitlement', async () => {
    const content = { id: 'c1', required_entitlements: ['e1'] };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentById('c1', 'user-1');
    expect(result).toBeNull();
  });

  it('getContentById returns content if no entitlements required', async () => {
    const content = { id: 'c2', required_entitlements: [] };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: content, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentById('c2', 'user-1');
    expect(result).toEqual(content);
  });

  it('getContentById returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await contentService.getContentById('missing', 'user-1');
    expect(result).toBeNull();
  });

  it('getContentById throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(contentService.getContentById('fail', 'user-1')).rejects.toThrow('fail');
  });

  it('getAccessibleContent is alias for getContentForContext', async () => {
    const content = [
      { id: 'c1', required_entitlements: [] },
      { id: 'c2', required_entitlements: [] },
    ];
    (contentService.getContentForContext as any) = vi.fn().mockResolvedValue(content);
    const result = await contentService.getAccessibleContent('user-1', 'ctx');
    expect(result).toEqual(content);
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/contentService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */