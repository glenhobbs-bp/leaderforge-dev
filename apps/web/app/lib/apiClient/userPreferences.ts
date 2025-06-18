import type { User } from '../types';

/**
 * Fetches user preferences from the API.
 * @param userId - The user ID to fetch preferences for.
 * @returns Promise of preferences object.
 * @throws Error if the API call fails.
 */
export async function fetchUserPreferences(userId: string): Promise<User['preferences'] | undefined> {
  console.log(`[apiClient] Fetching preferences for user: ${userId}`);
  const res = await fetch(`/api/user/${userId}/preferences`, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch user preferences');
  }
  const data = await res.json();
  console.log(`[apiClient] Got preferences for user ${userId}`);
  return data as User['preferences'];
}

/**
 * Updates user preferences via the API.
 * @param userId - The user ID to update preferences for.
 * @param prefs - The preferences object to update.
 * @returns Promise of updated preferences object.
 * @throws Error if the API call fails.
 */
export async function updateUserPreferences(userId: string, prefs: Partial<User['preferences']>): Promise<User['preferences'] | undefined> {
  console.log(`[apiClient] Updating preferences for user: ${userId}`);
  const res = await fetch(`/api/user/${userId}/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to update user preferences');
  }
  const data = await res.json();
  console.log(`[apiClient] Updated preferences for user ${userId}`);
  return data as User['preferences'];
}

// TODO: Add test coverage for this API client.