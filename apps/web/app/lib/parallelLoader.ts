// File: apps/web/app/lib/parallelLoader.ts
// Purpose: Parallel API loading service for optimized dashboard startup
// Owner: Frontend Team
// Tags: #performance #parallel-loading #api-optimization

import { authCoordinator } from './authCoordinator';

/**
 * Parallel loader for dashboard data - fetches all required data simultaneously
 * after authentication is complete to minimize startup time
 */
export class ParallelLoader {
  private static instance: ParallelLoader;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static getInstance(): ParallelLoader {
    if (!ParallelLoader.instance) {
      ParallelLoader.instance = new ParallelLoader();
    }
    return ParallelLoader.instance;
  }

  /**
   * Load all dashboard data in parallel after authentication is complete
   */
  async loadDashboardData(userId: string, tenantKey: string = 'leaderforge') {
    const startTime = Date.now();
    console.log('[ParallelLoader] 🚀 Starting parallel dashboard data load for user:', userId);

    try {
      // Wait for authentication to be ready first
      await authCoordinator.waitForSessionReady();

      // Define all API calls that can be run in parallel
      const apiCalls = [
        this.fetchUserPreferences(userId),
        this.fetchNavOptions(tenantKey),
        this.fetchAgentContext(userId, tenantKey)
      ];

      // Add timeouts to each call to prevent hanging
      const timeoutDuration = 8000; // 8 seconds max per call
      const timeoutPromises = apiCalls.map(call =>
        Promise.race([
          call,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), timeoutDuration)
          )
        ])
      );

      // Execute all API calls in parallel with individual error handling
      const [userPrefs, navOptions, agentContext] = await Promise.allSettled(timeoutPromises);

      const totalTime = Date.now() - startTime;
      console.log('[ParallelLoader] ✅ Parallel load completed in:', `${totalTime}ms`);

      // Return results with success/failure status
      return {
        userPreferences: userPrefs.status === 'fulfilled' ? userPrefs.value : null,
        navOptions: navOptions.status === 'fulfilled' ? navOptions.value : null,
        agentContext: agentContext.status === 'fulfilled' ? agentContext.value : null,
        errors: {
          userPreferences: userPrefs.status === 'rejected' ? userPrefs.reason : null,
          navOptions: navOptions.status === 'rejected' ? navOptions.reason : null,
          agentContext: agentContext.status === 'rejected' ? agentContext.reason : null,
        },
        totalTime,
        success: userPrefs.status === 'fulfilled' && navOptions.status === 'fulfilled'
      };

    } catch (error) {
      console.error('[ParallelLoader] Parallel load failed:', error);
      return {
        userPreferences: null,
        navOptions: null,
        agentContext: null,
        errors: { global: error },
        totalTime: Date.now() - startTime,
        success: false
      };
    }
  }

  /**
   * Fetch user preferences with caching
   */
  private async fetchUserPreferences(userId: string) {
    const cacheKey = `user-prefs-${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[ParallelLoader] 📦 Using cached user preferences');
      return cached.data;
    }

    console.log('[ParallelLoader] 📡 Fetching user preferences...');
    const response = await fetch(`/api/user/${userId}/preferences?t=${Date.now()}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`User preferences failed: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('[ParallelLoader] ✅ User preferences loaded');
    return data;
  }

  /**
   * Fetch navigation options with caching
   */
  private async fetchNavOptions(tenantKey: string) {
    const cacheKey = `nav-options-${tenantKey}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[ParallelLoader] 📦 Using cached nav options');
      return cached.data;
    }

    console.log('[ParallelLoader] 📡 Fetching navigation options...');
    const response = await fetch(`/api/nav/${tenantKey}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Nav options failed: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('[ParallelLoader] ✅ Navigation options loaded');
    return data;
  }

  /**
   * Fetch agent context with caching
   */
  private async fetchAgentContext(userId: string, tenantKey: string) {
    const cacheKey = `agent-context-${userId}-${tenantKey}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[ParallelLoader] 📦 Using cached agent context');
      return cached.data;
    }

    console.log('[ParallelLoader] 📡 Fetching agent context...');
    const response = await fetch('/api/agent/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, tenantKey })
    });

    if (!response.ok) {
      throw new Error(`Agent context failed: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('[ParallelLoader] ✅ Agent context loaded');
    return data;
  }

  /**
   * Clear cache for user (useful on logout)
   */
  clearUserCache(userId: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(userId));
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log('[ParallelLoader] 🧹 Cleared cache for user:', userId);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[ParallelLoader] 🧹 Cleared all cache');
  }
}

// Export singleton instance
export const parallelLoader = ParallelLoader.getInstance();