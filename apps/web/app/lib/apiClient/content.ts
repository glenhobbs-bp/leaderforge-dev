/**
 * Fetches content for a context and user from the API.
 * @param contextKey - The context key to fetch content for.
 * @param userId - The user ID for entitlement filtering.
 * @returns Promise of content array.
 * @throws Error if the API call fails.
 */
export async function fetchContentForContext(contextKey: string, userId: string): Promise<any[]> {
  console.log(`[apiClient] Fetching content for context: ${contextKey}, user: ${userId}`);
  const res = await fetch(`/api/content/${contextKey}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch content for context');
  }
  const data = await res.json();
  console.log(`[apiClient] Got ${data.length} content items for context ${contextKey}`);
  return data;
}

// TODO: Add test coverage for this API client.