import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

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

  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Agent configuration - Environment-aware URL selection
  LANGGRAPH_API_URL: (() => {
    // Explicit override takes precedence
    if (process.env.LANGGRAPH_URL) {
      return process.env.LANGGRAPH_URL;
    }

    // TEMPORARY: Force use of Render service for local testing
    // This will help us verify the Render service works before fixing Vercel
    return 'https://leaderforge-langgraph-2.onrender.com';

    // Production environment detection - More robust for Vercel
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL === '1' ||
      process.env.VERCEL_URL !== undefined;

    if (isProduction) {
      return 'https://leaderforge-langgraph-2.onrender.com';
    }

    // Development fallback
    return 'http://127.0.0.1:8000';
  })(),

  // External services
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
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
