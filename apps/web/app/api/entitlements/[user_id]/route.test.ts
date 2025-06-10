import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { entitlementService } from '../../../lib/entitlementService';

vi.mock('../../../lib/entitlementService');

const makeParams = (user_id: string) => ({ params: { user_id } });
const makeReq = () => ({} as any);

describe('GET /api/entitlements/[user_id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and entitlements for valid user_id', async () => {
    (entitlementService.getUserEntitlements as any) = vi.fn().mockResolvedValue([
      { entitlement_id: 'e1' },
      { entitlement_id: 'e2' },
    ]);
    const res = await GET(makeReq(), makeParams('user-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([
      { entitlement_id: 'e1' },
      { entitlement_id: 'e2' },
    ]);
  });

  it('returns 400 for missing user_id', async () => {
    const res = await GET(makeReq(), makeParams(undefined as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/user_id/i);
  });

  it('returns 400 for invalid user_id type', async () => {
    const res = await GET(makeReq(), makeParams(123 as any));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/user_id/i);
  });

  it('returns 500 if service throws', async () => {
    (entitlementService.getUserEntitlements as any) = vi.fn().mockRejectedValue(new Error('fail'));
    const res = await GET(makeReq(), makeParams('user-err'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/fail/i);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/api/entitlements/[user_id]/route.test.ts
 * 2. Review output for status codes and returned data.
 */