vi.mock('./supabaseClient');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { organizationService } from './organizationService';
import { supabase } from './supabaseClient';

// Helper to create a fully mocked query builder chain
function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    // For double eq() in some queries
    throwOnError: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('organizationService', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getOrganization returns organization by id', async () => {
    const fakeOrg = { id: 'org-1', name: 'Test Org' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeOrg, error: null })));
    const result = await organizationService.getOrganization('org-1');
    expect(result).toEqual(fakeOrg);
  });

  it('getOrganization returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await organizationService.getOrganization('org-2');
    expect(result).toBeNull();
  });

  it('getOrganization throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(organizationService.getOrganization('org-3')).rejects.toThrow('fail');
  });

  it('getUserOrganizations returns organizations for user', async () => {
    const fakeOrgs = [
      { organization: { id: 'org-1', name: 'Org 1' } },
      { organization: { id: 'org-2', name: 'Org 2' } },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeOrgs, error: null })));
    const result = await organizationService.getUserOrganizations('user-1');
    expect(result).toEqual([{ id: 'org-1', name: 'Org 1' }, { id: 'org-2', name: 'Org 2' }]);
  });

  it('getUserOrganizations returns empty array if none', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [], error: null })));
    const result = await organizationService.getUserOrganizations('user-2');
    expect(result).toEqual([]);
  });

  it('getUserOrganizations throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(organizationService.getUserOrganizations('user-3')).rejects.toThrow('fail');
  });

  it('getOrgMembers returns users for org', async () => {
    const fakeMembers = [
      { user: { id: 'user-1', name: 'User 1' } },
      { user: { id: 'user-2', name: 'User 2' } },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeMembers, error: null })));
    const result = await organizationService.getOrgMembers('org-1');
    expect(result).toEqual([{ id: 'user-1', name: 'User 1' }, { id: 'user-2', name: 'User 2' }]);
  });

  it('getOrgMembers returns empty array if none', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: [], error: null })));
    const result = await organizationService.getOrgMembers('org-2');
    expect(result).toEqual([]);
  });

  it('getOrgMembers throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(organizationService.getOrgMembers('org-3')).rejects.toThrow('fail');
  });

  it('getProvisioningModel returns model for module', async () => {
    const fakeModel = { model_type: 'org_hierarchy', module_id: 'mod-1' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeModel, error: null })));
    const result = await organizationService.getProvisioningModel('mod-1');
    expect(result).toEqual(fakeModel);
  });

  it('getProvisioningModel returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await organizationService.getProvisioningModel('mod-2');
    expect(result).toBeNull();
  });

  it('getProvisioningModel throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(organizationService.getProvisioningModel('mod-3')).rejects.toThrow('fail');
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/organizationService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */