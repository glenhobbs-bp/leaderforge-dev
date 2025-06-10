/**
 * Performs a provisioning action via the API.
 * @param action - The provisioning action to perform.
 * @param payload - The payload for the action.
 * @returns Promise of the API response.
 * @throws Error if the API call fails.
 */
export async function provisionAction(
  action: 'inviteUser' | 'grantEntitlement' | 'revokeEntitlement',
  payload: any
): Promise<any> {
  console.log(`[apiClient] Provisioning action: ${action}`);
  const res = await fetch('/api/provisioning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to perform provisioning action');
  }
  const data = await res.json();
  console.log(`[apiClient] Provisioning action ${action} complete`);
  return data;
}

// TODO: Add test coverage for this API client.