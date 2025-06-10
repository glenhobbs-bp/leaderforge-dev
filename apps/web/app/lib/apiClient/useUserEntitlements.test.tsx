// @jsxImportSource react
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserEntitlements } from '../../hooks/useUserEntitlements';
import * as api from './entitlements';

vi.mock('./entitlements');

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

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
    await waitFor(() => result.current.isError && result.current.error != null);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message || '').toMatch(/fail/i);
  });

  it('is loading initially', () => {
    (api.fetchUserEntitlements as any) = vi.fn(() => new Promise(() => {}));
    const { result } = renderHook(() => useUserEntitlements('user-1'), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});

/**
 * To run these tests:
 * 1. Run: npx vitest run --config vitest.config.ts apps/web/app/lib/apiClient/useUserEntitlements.test.tsx
 * 2. Review output for loading, error, and success states.
 */