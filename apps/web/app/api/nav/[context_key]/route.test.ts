import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { navService } from '../../../lib/navService';

vi.mock('../../../lib/navService');

const makeParams = (context_key: string) => ({ params: { context_key } });
const makeReq = (user_id?: string) => ({
  nextUrl: {
    searchParams: {
      get: (key: string) => (key === 'user_id' ? user_id : null),
    },
  },
} as any);

describe('GET /api/nav/[context_key]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and nav options for valid context_key and user_id', async () => {
    (navService.getNavOptions as any) = vi.fn().mockResolvedValue([
      { nav_key: 'home' },
      { nav_key: 'about' },
    ]);
    const res = await GET(makeReq('user-1'), makeParams('leaderforge'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([
      { nav_key: 'home' },
      { nav_key: 'about' },
    ]);
  });

  it('returns 400 for missing context_key', async () => {
    const res = await GET(makeReq('user-1'), makeParams(undefined as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/context_key/i);
  });

  it('returns 400 for invalid context_key type', async () => {
    const res = await GET(makeReq('user-1'), makeParams(123 as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/context_key/i);
  });

  it('returns 400 for missing user_id', async () => {
    const res = await GET(makeReq(undefined), makeParams('leaderforge'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/user_id/i);
  });

  it('returns 400 for invalid user_id type', async () => {
    const res = await GET(makeReq(123 as any), makeParams('leaderforge'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/user_id/i);
  });

  it('returns 500 if service throws', async () => {
    (navService.getNavOptions as any) = vi.fn().mockRejectedValue(new Error('fail'));
    const res = await GET(makeReq('user-err'), makeParams('leaderforge'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/fail/i);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/api/nav/[context_key]/route.test.ts
 * 2. Review output for status codes and returned data.
 */