import type { ContextConfig } from '../types';

/**
 * Fetches context config from the API.
 * @param contextKey - The context key to fetch config for.
 * @param userId - The user ID to pass as a query parameter.
 * @returns Promise of context config object.
 * @throws Error if the API call fails.
 */
export async function fetchContextConfig(contextKey: string, userId?: string): Promise<ContextConfig> {
  console.log(`[apiClient] Fetching context config for: ${contextKey}, user: ${userId}`);
  const url = userId ? `/api/context/${contextKey}?user_id=${encodeURIComponent(userId)}` : `/api/context/${contextKey}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch context config');
  }
  const data = await res.json();
  console.log(`[apiClient] Got context config for ${contextKey}`);
  return data as ContextConfig;
}

// TODO: Add test coverage for this API client.