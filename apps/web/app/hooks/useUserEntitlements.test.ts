import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserEntitlements } from './useUserEntitlements';
import * as api from '../lib/apiClient/entitlements';

vi.mock('../lib/apiClient/entitlements');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useUserEntitlements', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches entitlements for a user', async () => {
    (api.fetchUserEntitlements as any) = vi.fn().mockResolvedValue([
      { entitlement_id: 'e1' },
      { entitlement_id: 'e2' },
    ]);
    const { result } = renderHook(() => useUserEntitlements('user-1'), { wrapper });
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toEqual([
      { entitlement_id: 'e1' },
      { entitlement_id: 'e2' },
    ]);
  });

  it('handles error', async () => {
    (api.fetchUserEntitlements as any) = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useUserEntitlements('user-err'), { wrapper });
    await waitFor(() => result.current.isError);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toMatch(/fail/i);
  });

  it('is loading initially', () => {
    (api.fetchUserEntitlements as any) = vi.fn(() => new Promise(() => {}));
    const { result } = renderHook(() => useUserEntitlements('user-1'), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/hooks/useUserEntitlements.test.ts
 * 2. Review output for loading, error, and success states.
 */