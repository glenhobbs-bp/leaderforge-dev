import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { contextService } from '../../../lib/contextService';

vi.mock('../../../lib/contextService');

const makeParams = (context_key: string) => ({ params: { context_key } });
const makeReq = () => ({} as any);

describe('GET /api/context/[context_key]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and config for valid context_key', async () => {
    (contextService.getContextConfig as any) = vi.fn().mockResolvedValue({ context_key: 'leaderforge', theme: 'dark' });
    const res = await GET(makeReq(), makeParams('leaderforge'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ context_key: 'leaderforge', theme: 'dark' });
  });

  it('returns 400 for missing context_key', async () => {
    const res = await GET(makeReq(), makeParams(undefined as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/context_key/i);
  });

  it('returns 400 for invalid context_key type', async () => {
    const res = await GET(makeReq(), makeParams(123 as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/context_key/i);
  });

  it('returns 404 if context not found', async () => {
    (contextService.getContextConfig as any) = vi.fn().mockResolvedValue(null);
    const res = await GET(makeReq(), makeParams('missing'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/not found/i);
  });

  it('returns 500 if service throws', async () => {
    (contextService.getContextConfig as any) = vi.fn().mockRejectedValue(new Error('fail'));
    const res = await GET(makeReq(), makeParams('fail'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/fail/i);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/api/context/[context_key]/route.test.ts
 * 2. Review output for status codes and returned data.
 */