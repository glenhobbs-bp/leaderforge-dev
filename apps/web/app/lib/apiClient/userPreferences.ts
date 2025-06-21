import type { User } from '../types';

/**
 * Fetches user preferences from the API.
 * Optimized with better caching and error handling.
 * @param userId - The user ID to fetch preferences for.
 * @returns Promise of preferences object.
 * @throws Error if the API call fails.
 */
export async function fetchUserPreferences(userId: string): Promise<User['preferences'] | undefined> {
  const res = await fetch(`/api/user/${userId}/preferences`, {
    credentials: 'include',
    // Add cache headers for browser-level caching
    headers: {
      'Cache-Control': 'max-age=300', // 5 minutes browser cache
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to fetch user preferences');
  }

  const data = await res.json();
  return data as User['preferences'];
}

/**
 * Updates user preferences via the API.
 * @param userId - The user ID to update preferences for.
 * @param prefs - The preferences object to update.
 * @returns Promise of updated preferences object.
 * @throws Error if the API call fails.
 */
export async function updateUserPreferences(
  userId: string,
  prefs: Partial<User['preferences']>
): Promise<User['preferences'] | undefined> {
  const res = await fetch(`/api/user/${userId}/preferences`, {
    method: 'PUT', // Use PUT instead of PATCH for consistency with API
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache', // Don't cache updates
    },
    body: JSON.stringify(prefs),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    console.error('[apiClient] Error:', error);
    throw new Error(error.error || 'Failed to update user preferences');
  }

  const data = await res.json();
  return data as User['preferences'];
}

// TODO: Add test coverage for this API client.