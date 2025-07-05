// File: apps/web/app/lib/apiClient/userPreferences.ts
// Purpose: API client for user preferences with caching and error handling
// Owner: Frontend team
// Tags: API client, user preferences, caching, error handling

import type { User } from '../types';

/**
 * Fetches user preferences from the API.
 * Optimized with better caching and error handling.
 * @param userId - The user ID to fetch preferences for.
 * @returns Promise of preferences object.
 * @throws Error if the API call fails.
 */
export async function fetchUserPreferences(userId: string): Promise<User['preferences'] | undefined> {
  // 20-second timeout to accommodate slower API responses while still preventing infinite hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`/api/user/${userId}/preferences?t=${Date.now()}`, {
      credentials: 'include',
      signal: controller.signal,
      // ✅ FIX: Force fresh data by disabling cache
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json',
      },
      // Add keepalive for better connection reuse
      keepalive: true,
    });

    window.clearTimeout(timeoutId);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      console.error('[apiClient] Error:', error);
      throw new Error(error.error || 'Failed to fetch user preferences');
    }

    const data = await res.json();

    // 🔍 DEBUG: Log the actual API response structure
    console.log('[apiClient] 🔍 Raw API response:', data);
    console.log('[apiClient] 🔍 Response type:', typeof data);
    console.log('[apiClient] 🔍 Has preferences key:', 'preferences' in data);
    console.log('[apiClient] 🔍 Preferences value:', data?.preferences);

    // ✅ FIX: API returns { user: {...}, preferences: {...} } structure
    // Extract just the preferences part that the hook expects
    if (data && typeof data === 'object' && 'preferences' in data) {
      console.log('[apiClient] ✅ Extracting preferences from API response:', data.preferences);
      return data.preferences as User['preferences'];
    }

    // Fallback: if data structure is unexpected, return empty preferences
    console.warn('[apiClient] ❌ Unexpected data structure from preferences API:', data);
    return {};
  } catch (error) {
    window.clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      console.warn('[apiClient] User preferences request timed out, using fallback');
      return undefined; // Graceful degradation
    }
    throw error;
  }
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

  // ✅ FIX: API returns { user: {...}, preferences: {...} } structure
  // Extract just the preferences part that the hook expects
  if (data && typeof data === 'object' && 'preferences' in data) {
    return data.preferences as User['preferences'];
  }

  // Fallback: if data structure is unexpected, return empty preferences
  console.warn('[apiClient] Unexpected data structure from preferences update API:', data);
  return {};
}

// TODO: Add test coverage for this API client.