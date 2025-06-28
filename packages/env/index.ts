/**
 * Environment Configuration
 *
 * Purpose: Centralized environment variable management and development flags
 * Owner: Engineering Team
 * Tags: #environment #configuration #development #production
 */

export const ENV = {
  // Environment detection
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Debug flags for development
  DEBUG: {
    // Core application debugging
    AGENT_LOGGING: process.env.DEBUG_AGENT === 'true' || process.env.NODE_ENV === 'development',
    DATABASE_LOGGING: process.env.DEBUG_DATABASE === 'true',
    PERFORMANCE_LOGGING: process.env.DEBUG_PERFORMANCE === 'true',

    // Component debugging
    UI_COMPONENTS: process.env.DEBUG_UI === 'true',
    NAVIGATION: process.env.DEBUG_NAV === 'true',
    VIDEO_PLAYER: process.env.DEBUG_VIDEO === 'true',
    AUTH_FLOW: process.env.DEBUG_AUTH === 'true',

    // Feature debugging
    PROGRESS_TRACKING: process.env.DEBUG_PROGRESS === 'true',
    CONTENT_LOADING: process.env.DEBUG_CONTENT === 'true',
    SCHEMA_RENDERING: process.env.DEBUG_SCHEMA === 'true',

    // Infrastructure debugging
    API_REQUESTS: process.env.DEBUG_API === 'true',
    NETWORK_REQUESTS: process.env.DEBUG_NETWORK === 'true',
    CACHE_OPERATIONS: process.env.DEBUG_CACHE === 'true',
  },

  // Supabase - Lazy-loaded to avoid build-time errors
  get SUPABASE_URL() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
    }
    return url;
  },
  get SUPABASE_ANON_KEY() {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return key;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Debug logging for production troubleshooting
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      console.log('[ENV DEBUG] SUPABASE_SERVICE_ROLE_KEY check:', {
        exists: !!key,
        keyLength: key ? key.length : 0,
        keyPreview: key ? key.substring(0, 10) + '...' : 'NOT_FOUND',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
        vercelEnv: process.env.VERCEL_ENV,
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        allEnvCount: Object.keys(process.env).length
      });
    }

    if (!key) {
      // Instead of immediately throwing, let's try to provide a fallback or more information
      console.error('[ENV ERROR] SUPABASE_SERVICE_ROLE_KEY is missing. Available environment variables:',
        Object.keys(process.env).filter(k => k.includes('SUPABASE')));

      // TEMPORARY: Try different possible environment variable names
      const alternatives = [
        'SUPABASE_SERVICE_ROLE',
        'SUPABASE_SERVICE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      for (const alt of alternatives) {
        const altValue = process.env[alt];
        if (altValue) {
          console.log(`[ENV FALLBACK] Found alternative: ${alt}`);
          return altValue;
        }
      }

      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
    }
    return key;
  },

  // Agent configuration - Environment-aware URL selection
  LANGGRAPH_API_URL: (() => {
    // Explicit override takes precedence
    if (process.env.LANGGRAPH_URL) {
      return process.env.LANGGRAPH_URL;
    }

    // Production environment detection - More robust for Vercel
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL === '1' ||
      process.env.VERCEL_URL !== undefined;

    if (isProduction) {
      return 'https://leaderforge-langgraph-2.onrender.com';
    }

    // TEMPORARY: Force use of Render service for local testing
    // This will help us verify the Render service works before fixing Vercel
    return 'https://leaderforge-langgraph-2.onrender.com';

    // Development fallback would be: 'http://127.0.0.1:8000'
  })(),

  // External services
  get ANTHROPIC_API_KEY() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
    }
    return key;
  },
};

// Utility functions for controlled logging
export const debugLog = {
  agent: (...args: any[]) => ENV.DEBUG.AGENT_LOGGING && console.log('[AGENT]', ...args),
  database: (...args: any[]) => ENV.DEBUG.DATABASE_LOGGING && console.log('[DB]', ...args),
  performance: (...args: any[]) => ENV.DEBUG.PERFORMANCE_LOGGING && console.log('[PERF]', ...args),
  ui: (...args: any[]) => ENV.DEBUG.UI_COMPONENTS && console.log('[UI]', ...args),
  navigation: (...args: any[]) => ENV.DEBUG.NAVIGATION && console.log('[NAV]', ...args),
  video: (...args: any[]) => ENV.DEBUG.VIDEO_PLAYER && console.log('[VIDEO]', ...args),
  auth: (...args: any[]) => ENV.DEBUG.AUTH_FLOW && console.log('[AUTH]', ...args),
  progress: (...args: any[]) => ENV.DEBUG.PROGRESS_TRACKING && console.log('[PROGRESS]', ...args),
  content: (...args: any[]) => ENV.DEBUG.CONTENT_LOADING && console.log('[CONTENT]', ...args),
  schema: (...args: any[]) => ENV.DEBUG.SCHEMA_RENDERING && console.log('[SCHEMA]', ...args),
  api: (...args: any[]) => ENV.DEBUG.API_REQUESTS && console.log('[API]', ...args),
  network: (...args: any[]) => ENV.DEBUG.NETWORK_REQUESTS && console.log('[NETWORK]', ...args),
  cache: (...args: any[]) => ENV.DEBUG.CACHE_OPERATIONS && console.log('[CACHE]', ...args),
};

export default ENV;
