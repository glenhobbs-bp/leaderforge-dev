/**
 * Fetches context config from the API.
 * @param contextKey - The context key to fetch config for.
 * @returns Promise of context config object.
 * @throws Error if the API call fails.
 */
export async function fetchContextConfig(contextKey: string): Promise<any> {
  console.log(`[apiClient] Fetching context config for: ${contextKey}`);
  const res = await fetch(`/api/context/${contextKey}`);
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch context config');
  }
  const data = await res.json();
  console.log(`[apiClient] Got context config for ${contextKey}`);
  return data;
}

// TODO: Add test coverage for this API client.