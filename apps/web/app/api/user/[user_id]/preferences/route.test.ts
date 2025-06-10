import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET, PATCH } from './route';
import { userService } from '../../../../lib/userService';

vi.mock('../../../../lib/userService');

const makeParams = (user_id: string) => ({ params: { user_id } });
const makeReq = (body?: any) => ({
  json: async () => body,
} as any);

const makeReqWithBody = (body: any) => ({
  json: async () => body,
} as any);

describe('/api/user/[user_id]/preferences', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 200 and preferences for valid user_id', async () => {
      (userService.getUser as any) = vi.fn().mockResolvedValue({ id: 'user-1', preferences: { theme: 'dark' } });
      const res = await GET({} as any, makeParams('user-1'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ theme: 'dark' });
    });

    it('returns 400 for missing user_id', async () => {
      const res = await GET({} as any, makeParams(undefined as any));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/user_id/i);
    });

    it('returns 400 for invalid user_id type', async () => {
      const res = await GET({} as any, makeParams(123 as any));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/user_id/i);
    });

    it('returns 404 if user not found', async () => {
      (userService.getUser as any) = vi.fn().mockResolvedValue(null);
      const res = await GET({} as any, makeParams('missing'));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/not found/i);
    });

    it('returns 500 if service throws', async () => {
      (userService.getUser as any) = vi.fn().mockRejectedValue(new Error('fail'));
      const res = await GET({} as any, makeParams('fail'));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toMatch(/fail/i);
    });
  });

  describe('PATCH', () => {
    it('returns 200 and updated preferences for valid user_id and body', async () => {
      (userService.updateUserPreferences as any) = vi.fn().mockResolvedValue({ id: 'user-1', preferences: { theme: 'light' } });
      const res = await PATCH(makeReqWithBody({ theme: 'light' }), makeParams('user-1'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ theme: 'light' });
    });

    it('returns 400 for missing user_id', async () => {
      const res = await PATCH(makeReqWithBody({ theme: 'light' }), makeParams(undefined as any));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/user_id/i);
    });

    it('returns 400 for invalid user_id type', async () => {
      const res = await PATCH(makeReqWithBody({ theme: 'light' }), makeParams(123 as any));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/user_id/i);
    });

    it('returns 400 for invalid JSON body', async () => {
      const badReq = { json: async () => { throw new Error('bad json'); } } as any;
      const res = await PATCH(badReq, makeParams('user-1'));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/json/i);
    });

    it('returns 400 for missing or invalid preferences in body', async () => {
      const res = await PATCH(makeReqWithBody(undefined), makeParams('user-1'));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/preferences/i);
    });

    it('returns 404 if user not found', async () => {
      (userService.updateUserPreferences as any) = vi.fn().mockResolvedValue(null);
      const res = await PATCH(makeReqWithBody({ theme: 'light' }), makeParams('missing'));
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/not found/i);
    });

    it('returns 500 if service throws', async () => {
      (userService.updateUserPreferences as any) = vi.fn().mockRejectedValue(new Error('fail'));
      const res = await PATCH(makeReqWithBody({ theme: 'fail' }), makeParams('fail'));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toMatch(/fail/i);
    });
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/api/user/[user_id]/preferences/route.test.ts
 * 2. Review output for status codes and returned data.
 */