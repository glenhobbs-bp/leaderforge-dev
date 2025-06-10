import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { provisioningService } from '../../lib/provisioningService';

vi.mock('../../lib/provisioningService');

const makeReq = (body: any) => ({
  json: async () => body,
} as any);

describe('POST /api/provisioning', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inviteUser: returns 200 for valid params', async () => {
    (provisioningService.provisionUserToOrg as any) = vi.fn().mockResolvedValue(true);
    const res = await POST(makeReq({ action: 'inviteUser', userId: 'u1', orgId: 'o1', role: 'admin' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('inviteUser: returns 400 for missing params', async () => {
    const res = await POST(makeReq({ action: 'inviteUser', userId: 'u1', orgId: 'o1' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/role/i);
  });

  it('grantEntitlement: returns 200 for valid params', async () => {
    (provisioningService.provisionEntitlementToUser as any) = vi.fn().mockResolvedValue(true);
    const res = await POST(makeReq({ action: 'grantEntitlement', userId: 'u1', entitlementId: 'e1' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('grantEntitlement: returns 400 for missing params', async () => {
    const res = await POST(makeReq({ action: 'grantEntitlement', userId: 'u1' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/entitlementId/i);
  });

  it('revokeEntitlement: returns 501', async () => {
    const res = await POST(makeReq({ action: 'revokeEntitlement', userId: 'u1', entitlementId: 'e1' }));
    expect(res.status).toBe(501);
    const data = await res.json();
    expect(data.error).toMatch(/not implemented/i);
  });

  it('returns 400 for unknown action', async () => {
    const res = await POST(makeReq({ action: 'unknownAction' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/unknown action/i);
  });

  it('returns 400 for missing action', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/action/i);
  });

  it('returns 400 for invalid JSON', async () => {
    const badReq = { json: async () => { throw new Error('bad json'); } } as any;
    const res = await POST(badReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/json/i);
  });

  it('returns 500 if service throws', async () => {
    (provisioningService.provisionUserToOrg as any) = vi.fn().mockRejectedValue(new Error('fail'));
    const res = await POST(makeReq({ action: 'inviteUser', userId: 'u1', orgId: 'o1', role: 'admin' }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/fail/i);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/api/provisioning/route.test.ts
 * 2. Review output for status codes and returned data.
 */