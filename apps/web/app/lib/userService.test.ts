vi.mock('./supabaseClient');
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from './userService';
import { supabase } from './supabaseClient';

function createMockQueryBuilder(finalPromise: Promise<any>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    then: finalPromise.then.bind(finalPromise),
    catch: finalPromise.catch.bind(finalPromise),
  };
}

const resetSupabaseMock = () => {
  supabase.from = vi.fn();
};

describe('userService', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getUser returns user by id', async () => {
    const fakeUser = { id: 'user-1', email: 'a@b.com' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeUser, error: null })));
    const result = await userService.getUser('user-1');
    expect(result).toEqual(fakeUser);
  });

  it('getUser returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await userService.getUser('user-2');
    expect(result).toBeNull();
  });

  it('getUser throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(userService.getUser('user-3')).rejects.toThrow('fail');
  });

  it('getUserByEmail returns user by email', async () => {
    const fakeUser = { id: 'user-1', email: 'a@b.com' };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeUser, error: null })));
    const result = await userService.getUserByEmail('a@b.com');
    expect(result).toEqual(fakeUser);
  });

  it('getUserByEmail returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await userService.getUserByEmail('b@c.com');
    expect(result).toBeNull();
  });

  it('getUserByEmail throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(userService.getUserByEmail('fail@fail.com')).rejects.toThrow('fail');
  });

  it('getUsersByIds returns users for ids', async () => {
    const fakeUsers = [
      { id: 'user-1', email: 'a@b.com' },
      { id: 'user-2', email: 'b@c.com' },
    ];
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeUsers, error: null })));
    const result = await userService.getUsersByIds(['user-1', 'user-2']);
    expect(result).toEqual(fakeUsers);
  });

  it('getUsersByIds returns empty array if no ids', async () => {
    const result = await userService.getUsersByIds([]);
    expect(result).toEqual([]);
  });

  it('getUsersByIds throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(userService.getUsersByIds(['user-3'])).rejects.toThrow('fail');
  });

  it('updateUserPreferences updates and returns user', async () => {
    const fakeUser = { id: 'user-1', preferences: { theme: 'dark' } };
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: fakeUser, error: null })));
    const result = await userService.updateUserPreferences('user-1', { theme: 'dark' });
    expect(result).toEqual(fakeUser);
  });

  it('updateUserPreferences returns null if not found', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: null })));
    const result = await userService.updateUserPreferences('user-2', { theme: 'light' });
    expect(result).toBeNull();
  });

  it('updateUserPreferences throws on error', async () => {
    (supabase.from as any) = vi.fn(() => createMockQueryBuilder(Promise.resolve({ data: null, error: new Error('fail') })));
    await expect(userService.updateUserPreferences('user-3', { theme: 'fail' })).rejects.toThrow('fail');
  });
});

/**
 * To run these tests:
 * 1. Install Vitest (or Jest) in your project if not already present.
 * 2. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/userService.test.ts
 * 3. Review console output for logs and test results.
 *
 * You can also run all tests in the project with: npx vitest --config vitest.config.ts
 */