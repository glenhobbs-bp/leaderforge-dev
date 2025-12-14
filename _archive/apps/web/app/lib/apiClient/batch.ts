import type { NavOption, Content, Entitlement, ContextConfig } from '../types';

/**
 * Complete context data bundle returned by the optimized batch API
 */
export interface ContextBundle {
  contextConfig: ContextConfig | null;
  navOptions: NavOption[];
  content: Content[];
  userEntitlements: Entitlement[];
}

/**
 * Fetches complete context data bundle (config, nav, content) in a single optimized request.
 * This replaces multiple separate API calls with a single batched request for better performance.
 *
 * @param contextKey - The context key to fetch data for.
 * @returns Promise of complete context bundle.
 * @throws Error if the API call fails.
 */
export async function fetchContextBundle(contextKey: string): Promise<ContextBundle> {
  console.log(`[apiClient] Fetching optimized context bundle for: ${contextKey}`);

  const startTime = Date.now();
  const res = await fetch(`/api/context/${contextKey}/bundle`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[apiClient] Context bundle error:', error);
    throw new Error(error.error || 'Failed to fetch context bundle');
  }

  const data = await res.json() as ContextBundle;
  const endTime = Date.now();
  const duration = endTime - startTime;
  const responseTime = res.headers.get('X-Response-Time');

  console.log(`[apiClient] Context bundle for ${contextKey} received in ${duration}ms (server: ${responseTime})`);
  console.log(`[apiClient] Bundle contents - config: ${!!data.contextConfig}, nav: ${data.navOptions.length}, content: ${data.content.length}, entitlements: ${data.userEntitlements.length}`);

  return data;
}

/**
 * Performance comparison helper - measures the difference between batch vs individual requests
 */
export async function measurePerformanceComparison(contextKey: string): Promise<{
  batchTime: number;
  individualTime: number;
  improvement: number;
}> {
  console.log(`[apiClient] Running performance comparison for context: ${contextKey}`);

  // Measure batch request
  const batchStartTime = Date.now();
  await fetchContextBundle(contextKey);
  const batchTime = Date.now() - batchStartTime;

  // Measure individual requests (simulated)
  const individualStartTime = Date.now();
  await Promise.all([
    fetch(`/api/context/${contextKey}`, { credentials: 'include' }),
    fetch(`/api/nav/${contextKey}`, { credentials: 'include' }),
    fetch(`/api/content/${contextKey}`, { credentials: 'include' })
  ]);
  const individualTime = Date.now() - individualStartTime;

  const improvement = ((individualTime - batchTime) / individualTime) * 100;

  console.log(`[apiClient] Performance comparison - Batch: ${batchTime}ms, Individual: ${individualTime}ms, Improvement: ${improvement.toFixed(1)}%`);

  return {
    batchTime,
    individualTime,
    improvement
  };
}