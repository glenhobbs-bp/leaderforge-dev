vi.mock('./supabaseClient');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { provisioningService } from './provisioningService';
import { supabase } from './supabaseClient';

function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('provisioningService', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provisionUserToOrg returns true on success', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: null })));
    const result = await provisioningService.provisionUserToOrg('user-1', 'org-1', 'admin');
    expect(result).toBe(true);
  });

  it('provisionUserToOrg returns false on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: new Error('fail') })));
    const result = await provisioningService.provisionUserToOrg('user-2', 'org-2', 'member');
    expect(result).toBe(false);
  });

  it('provisionEntitlementToUser returns true on success', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: null })));
    const result = await provisioningService.provisionEntitlementToUser('user-1', 'ent-1');
    expect(result).toBe(true);
  });

  it('provisionEntitlementToUser returns false on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: new Error('fail') })));
    const result = await provisioningService.provisionEntitlementToUser('user-2', 'ent-2');
    expect(result).toBe(false);
  });

  it('provisionEntitlementToOrg returns true on success', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: null })));
    const result = await provisioningService.provisionEntitlementToOrg('org-1', 'ent-1', 5);
    expect(result).toBe(true);
  });

  it('provisionEntitlementToOrg returns false on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ error: new Error('fail') })));
    const result = await provisioningService.provisionEntitlementToOrg('org-2', 'ent-2');
    expect(result).toBe(false);
  });

  it('getProvisioningAuditLog returns data on success', async () => {
    const fakeLogs = [
      { id: 'log-1', action: 'provision', user_id: 'user-1' },
      { id: 'log-2', action: 'provision', user_id: 'user-2' },
    ];
    const mockQuery = createMockQueryBuilder(Promise.resolve({ data: fakeLogs, error: null }));
    mockQuery.eq = vi.fn().mockReturnThis();
    (supabase.from as any) = vi.fn(() => mockQuery);
    const result = await provisioningService.getProvisioningAuditLog({ user_id: 'user-1' });
    expect(result).toEqual(fakeLogs);
  });

  it('getProvisioningAuditLog returns empty array if no data', async () => {
    const mockQuery = createMockQueryBuilder(Promise.resolve({ data: null, error: null }));
    mockQuery.eq = vi.fn().mockReturnThis();
    (supabase.from as any) = vi.fn(() => mockQuery);
    const result = await provisioningService.getProvisioningAuditLog({ user_id: 'user-2' });
    expect(result).toEqual([]);
  });

  it('getProvisioningAuditLog throws on error', async () => {
    const mockQuery = createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') }));
    mockQuery.eq = vi.fn().mockReturnThis();
    (supabase.from as any) = vi.fn(() => mockQuery);
    await expect(provisioningService.getProvisioningAuditLog({ user_id: 'user-3' })).rejects.toThrow('fail');
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/provisioningService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */