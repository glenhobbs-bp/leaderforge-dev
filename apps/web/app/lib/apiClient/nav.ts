/**
 * Fetches nav options for a context and user from the API.
 * @param contextKey - The context key to fetch nav for.
 * @param userId - The user ID for entitlement filtering.
 * @returns Promise of nav array.
 * @throws Error if the API call fails.
 */
export async function fetchNavForContext(contextKey: string, userId: string): Promise<any[]> {
  console.log(`[apiClient] Fetching nav for context: ${contextKey}, user: ${userId}`);
  const res = await fetch(`/api/nav/${contextKey}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch nav for context');
  }
  const data = await res.json();
  console.log(`[apiClient] Got ${data.length} nav items for context ${contextKey}`);
  return data;
}

// TODO: Add test coverage for this API client.