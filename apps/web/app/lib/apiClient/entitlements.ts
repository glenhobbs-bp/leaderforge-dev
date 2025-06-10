/**
 * Fetches all entitlements for a user from the API.
 * @param userId - The user ID to fetch entitlements for.
 * @returns Promise of entitlements array.
 * @throws Error if the API call fails.
 */
export async function fetchUserEntitlements(userId: string): Promise<any[]> {
  console.log(`[apiClient] Fetching entitlements for user: ${userId}`);
  const res = await fetch(`/api/entitlements/${userId}`);
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch entitlements');
  }
  const data = await res.json();
  console.log(`[apiClient] Got ${data.length} entitlements`);
  return data;
}

// TODO: Add test coverage for this API client.