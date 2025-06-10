/**
 * Fetches all entitlements for an organization from the API.
 * @param orgId - The organization ID to fetch entitlements for.
 * @returns Promise of entitlements array.
 * @throws Error if the API call fails.
 */
export async function fetchOrgEntitlements(orgId: string): Promise<any[]> {
  console.log(`[apiClient] Fetching entitlements for org: ${orgId}`);
  const res = await fetch(`/api/orgs/${orgId}/entitlements`);
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch org entitlements');
  }
  const data = await res.json();
  console.log(`[apiClient] Got ${data.length} org entitlements`);
  return data;
}

// TODO: Add test coverage for this API client.