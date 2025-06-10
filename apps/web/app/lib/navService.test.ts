vi.mock('./supabaseClient');
vi.mock('./entitlementService');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { navService } from './navService';
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

describe('navService', () => {
  beforeEach(() => {
    resetSupabaseMock();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getNavOptions returns all navs if no entitlements required', async () => {
    const navs = [
      { nav_key: 'home', required_entitlements: [] },
      { nav_key: 'about', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: navs, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOptions('ctx', 'user-1');
    expect(result).toEqual(navs);
  });

  it('getNavOptions filters by entitlement', async () => {
    const navs = [
      { nav_key: 'premium', required_entitlements: ['e1'] },
      { nav_key: 'basic', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: navs, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([{ entitlement_id: 'e1' }]);
    const result = await navService.getNavOptions('ctx', 'user-1');
    expect(result).toEqual(navs);
  });

  it('getNavOptions excludes navs if user lacks entitlement', async () => {
    const navs = [
      { nav_key: 'premium', required_entitlements: ['e1'] },
      { nav_key: 'basic', required_entitlements: [] },
    ];
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: navs, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOptions('ctx', 'user-1');
    expect(result).toEqual([navs[1]]);
  });

  it('getNavOptions returns empty array if no navs', async () => {
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: null, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOptions('ctx', 'user-1');
    expect(result).toEqual([]);
  });

  it('getNavOptions throws on error', async () => {
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') }));
    });
    await expect(navService.getNavOptions('ctx', 'user-1')).rejects.toThrow('fail');
  });

  it('getNavOption returns nav if user has entitlement', async () => {
    const nav = { nav_key: 'premium', required_entitlements: ['e1'] };
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: nav, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([{ entitlement_id: 'e1' }]);
    const result = await navService.getNavOption('ctx', 'premium', 'user-1');
    expect(result).toEqual(nav);
  });

  it('getNavOption returns null if user lacks entitlement', async () => {
    const nav = { nav_key: 'premium', required_entitlements: ['e1'] };
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: nav, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOption('ctx', 'premium', 'user-1');
    expect(result).toBeNull();
  });

  it('getNavOption returns nav if no entitlements required', async () => {
    const nav = { nav_key: 'basic', required_entitlements: [] };
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: nav, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOption('ctx', 'basic', 'user-1');
    expect(result).toEqual(nav);
  });

  it('getNavOption returns null if not found', async () => {
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: null, error: null }));
    });
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([]);
    const result = await navService.getNavOption('ctx', 'missing', 'user-1');
    expect(result).toBeNull();
  });

  it('getNavOption throws on error', async () => {
    (supabase.from as any) = vi.fn((table: string) => {
      if (table !== 'core.nav_options') throw new Error('Wrong table: ' + table);
      return createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') }));
    });
    await expect(navService.getNavOption('ctx', 'fail', 'user-1')).rejects.toThrow('fail');
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/navService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */