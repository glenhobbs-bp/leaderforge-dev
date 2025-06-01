# Environment Configuration Addendum

_Addendum to LeaderForge Master Technical Specification v2.0_
_Created: January 2025_

## 📋 Purpose

This addendum provides complete environment configuration for the LeaderForge platform, including all required environment variables, service configurations, and setup validation procedures for development, staging, and production environments.

**Reference**: LeaderForge Master Technical Specification v2.0 - Development Environment

---

## 🌍 Complete Environment Variables

### 1. Root Environment Template

```bash
# .env.example
# Copy to .env.local for development, .env.staging for staging, .env.production for production

#==============================================================================
# ENVIRONMENT IDENTIFICATION
#==============================================================================
NODE_ENV=development # development | staging | production
APP_ENV=development  # development | staging | production
DEPLOYMENT_STAGE=dev # dev | staging | prod

#==============================================================================
# APPLICATION CONFIGURATION
#==============================================================================
# Frontend URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0
API_CORS_ORIGIN=http://localhost:3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

#==============================================================================
# DATABASE CONFIGURATION
#==============================================================================
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Direct Database URL (for migrations and seeding)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

#==============================================================================
# REDIS CONFIGURATION
#==============================================================================
# Upstash Redis (recommended for production)
REDIS_URL=redis://default:password@host:port
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Local Redis (for development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

#==============================================================================
# AI/LLM CONFIGURATION
#==============================================================================
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=4000

# Azure OpenAI (alternative)
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=

#==============================================================================
# TRIBE SOCIAL CMS INTEGRATION
#==============================================================================
TRIBE_API_URL=https://api.tribesocial.io
TRIBE_API_KEY=your-tribe-api-key
TRIBE_WEBHOOK_SECRET=your-tribe-webhook-secret

# Platform IDs for different modules
TRIBE_PLATFORM_MOVEMENT=36
TRIBE_PLATFORM_LEADERFORGE=37
TRIBE_PLATFORM_WEALTH=38
TRIBE_PLATFORM_SCHOOL=39
TRIBE_PLATFORM_SMALLGROUP=40

# Video streaming configuration
TRIBE_VIDEO_CDN_URL=https://cdn.tribesocial.io
TRIBE_EMBED_DOMAIN=embed.tribesocial.io

#==============================================================================
# MLM PLATFORM INTEGRATION
#==============================================================================
MLM_PLATFORM_API_URL=https://api.mlmplatform.com
MLM_PLATFORM_API_KEY=your-mlm-api-key
MLM_PLATFORM_WEBHOOK_SECRET=your-mlm-webhook-secret

# Commission calculation settings
MLM_COMMISSION_RATES='{"level1": 0.25, "level2": 0.10, "level3": 0.05, "level4": 0.03, "level5": 0.03, "level6": 0.02, "level7": 0.02}'
MLM_PAYOUT_THRESHOLD=25.00
MLM_PAYOUT_SCHEDULE=monthly

#==============================================================================
# EMAIL SERVICES
#==============================================================================
# Resend (recommended)
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=noreply@leaderforge.com
EMAIL_FROM_NAME=LeaderForge

# SendGrid (alternative)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# SMTP (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

#==============================================================================
# AUTHENTICATION SERVICES
#==============================================================================
# Magic link configuration
MAGIC_LINK_SECRET=your-magic-link-secret-32-chars
MAGIC_LINK_EXPIRES_IN=900 # 15 minutes

# Optional 2FA (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

#==============================================================================
# FILE STORAGE
#==============================================================================
# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1

# Cloudflare R2 (alternative)
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ENDPOINT=

# AWS S3 (alternative)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

#==============================================================================
# MONITORING & ANALYTICS
#==============================================================================
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=leaderforge
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

#==============================================================================
# FEATURE FLAGS
#==============================================================================
# Module Features
NEXT_PUBLIC_ENABLE_MLM=true
NEXT_PUBLIC_ENABLE_COMMUNITY=true
NEXT_PUBLIC_ENABLE_VOICE_NOTES=false
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_2FA=false

# Development Features
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_CONVERSATION_LOGGING=true

#==============================================================================
# SECURITY CONFIGURATION
#==============================================================================
# Encryption keys
ENCRYPTION_KEY=your-32-char-encryption-key
JOURNAL_ENCRYPTION_SALT=your-journal-salt-32-chars

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://app.leaderforge.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000 # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

#==============================================================================
# PAYMENT PROCESSING
#==============================================================================
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_MOVEMENT_MONTHLY=price_movement_monthly
STRIPE_PRICE_MOVEMENT_ANNUAL=price_movement_annual

#==============================================================================
# WEBHOOKS
#==============================================================================
# Webhook endpoints for external integrations
WEBHOOK_SECRET_GLOBAL=your-global-webhook-secret
WEBHOOK_TRIBE_SECRET=your-tribe-webhook-secret
WEBHOOK_MLM_SECRET=your-mlm-webhook-secret
WEBHOOK_STRIPE_SECRET=your-stripe-webhook-secret

#==============================================================================
# DEVELOPMENT TOOLS
#==============================================================================
# Database Seeding
SEED_DATABASE=false
LOAD_FIXTURES=false
CREATE_TEST_USERS=false

# Logging
LOG_LEVEL=info # error | warn | info | verbose | debug
LOG_FORMAT=combined # combined | common | dev | short | tiny

# Performance
ENABLE_QUERY_LOGGING=false
ENABLE_SLOW_QUERY_LOG=true
SLOW_QUERY_THRESHOLD=1000 # milliseconds

#==============================================================================
# BACKUP & MAINTENANCE
#==============================================================================
# Backup configuration
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * * # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=

# Maintenance mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=System maintenance in progress
MAINTENANCE_BYPASS_TOKEN=
```

---

## 🔧 Service Configuration Templates

### 1. Next.js Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@langchain/core", "@langchain/openai"],
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  images: {
    domains: [
      "cdn.tribesocial.io",
      "your-project.supabase.co",
      "app.posthog.com",
    ],
    formats: ["image/webp", "image/avif"],
  },

  async rewrites() {
    return [
      {
        source: "/api/webhooks/:path*",
        destination: "/api/webhooks/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGINS,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 2. Supabase Configuration

```typescript
// lib/supabase/config.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client (with service role)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Environment-specific configuration
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  storageUrl: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL!,
  realtimeEnabled: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
};
```

### 3. Redis Configuration

```typescript
// lib/redis/config.ts
import { Redis } from "@upstash/redis";
import { createClient } from "redis";

// Upstash Redis (Production)
export const upstashRedis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Local Redis (Development)
export const localRedis =
  process.env.NODE_ENV === "development"
    ? createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || "0"),
      })
    : null;

// Redis client selection
export const redis = upstashRedis || localRedis;

if (!redis) {
  console.warn("No Redis configuration found. Caching will be disabled.");
}

// Redis configuration
export const redisConfig = {
  keyPrefix: process.env.REDIS_KEY_PREFIX || "leaderforge:",
  defaultTTL: 300, // 5 minutes
  longTTL: 3600, // 1 hour
  shortTTL: 60, // 1 minute

  // Cache keys
  keys: {
    user: (id: string) => `user:${id}`,
    content: (id: string) => `content:${id}`,
    module: (id: string) => `module:${id}`,
    conversation: (id: string) => `conversation:${id}`,
    progress: (userId: string, contentId: string) =>
      `progress:${userId}:${contentId}`,
  },
};
```

### 4. AI/LLM Configuration

```typescript
// lib/ai/config.ts
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";

// OpenAI Configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

// Anthropic Configuration
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

// AI Model Configuration
export const aiConfig = {
  openai: {
    model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4000"),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
    stream: true,
  },

  anthropic: {
    model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "4000"),
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "0.7"),
  },

  // Default provider
  defaultProvider: "openai",

  // Rate limiting
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },
};
```

---

## 🏗️ Environment Setup Scripts

### 1. Environment Validation Script

```bash
#!/bin/bash
# scripts/validate-env.sh
# Validates environment configuration

set -e

echo "🔍 Validating LeaderForge environment configuration..."

# Function to check if variable exists and is not empty
check_var() {
  local var_name=$1
  local var_value=${!var_name}
  local required=${2:-true}

  if [ -z "$var_value" ]; then
    if [ "$required" = true ]; then
      echo "❌ Missing required environment variable: $var_name"
      exit 1
    else
      echo "⚠️  Optional environment variable not set: $var_name"
    fi
  else
    echo "✅ $var_name is set"
  fi
}

# Core Application Variables
echo "📱 Checking core application variables..."
check_var "NODE_ENV"
check_var "NEXT_PUBLIC_APP_URL"
check_var "NEXT_PUBLIC_API_URL"
check_var "SESSION_SECRET"
check_var "JWT_SECRET"

# Database Variables
echo "🗄️  Checking database variables..."
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"
check_var "DATABASE_URL"

# AI/LLM Variables
echo "🤖 Checking AI/LLM variables..."
if [ -n "$OPENAI_API_KEY" ]; then
  echo "✅ OpenAI configuration detected"
elif [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "✅ Anthropic configuration detected"
else
  echo "❌ No AI provider configured (OpenAI or Anthropic required)"
  exit 1
fi

# External Services
echo "🔗 Checking external service variables..."
check_var "TRIBE_API_KEY" false
check_var "RESEND_API_KEY" false
check_var "REDIS_URL" false

# Security Variables
echo "🔒 Checking security variables..."
check_var "ENCRYPTION_KEY"
check_var "MAGIC_LINK_SECRET"

# Validate variable formats
echo "📋 Validating variable formats..."

# Check URL formats
if [[ ! "$NEXT_PUBLIC_APP_URL" =~ ^https?:// ]]; then
  echo "❌ NEXT_PUBLIC_APP_URL must be a valid URL"
  exit 1
fi

# Check secret lengths
if [ ${#SESSION_SECRET} -lt 32 ]; then
  echo "❌ SESSION_SECRET must be at least 32 characters"
  exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "❌ JWT_SECRET must be at least 32 characters"
  exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if command -v psql >/dev/null 2>&1; then
  if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
  else
    echo "❌ Database connection failed"
    exit 1
  fi
else
  echo "⚠️  psql not found, skipping database connection test"
fi

# Test Redis connection
echo "🔌 Testing Redis connection..."
if [ -n "$REDIS_URL" ] && command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "✅ Redis connection successful"
  else
    echo "❌ Redis connection failed"
    exit 1
  fi
else
  echo "⚠️  Redis not configured or redis-cli not found"
fi

echo "✅ Environment validation complete!"
```

### 2. Environment Setup Script

```bash
#!/bin/bash
# scripts/setup-env.sh
# Sets up environment for different stages

set -e

STAGE=${1:-development}

echo "🚀 Setting up LeaderForge environment for: $STAGE"

# Copy appropriate environment file
case $STAGE in
  development)
    cp .env.example .env.local
    echo "📋 Copied .env.example to .env.local"
    ;;
  staging)
    cp .env.staging.example .env.staging
    echo "📋 Copied .env.staging.example to .env.staging"
    ;;
  production)
    cp .env.production.example .env.production
    echo "📋 Copied .env.production.example to .env.production"
    ;;
  *)
    echo "❌ Unknown stage: $STAGE"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

# Generate secrets if needed
echo "🔐 Generating secrets..."

# Generate session secret
if ! grep -q "your-super-secret-session-key" .env.local 2>/dev/null; then
  SESSION_SECRET=$(openssl rand -base64 32)
  sed -i.bak "s/your-super-secret-session-key-min-32-chars/$SESSION_SECRET/" .env.local
  echo "✅ Generated SESSION_SECRET"
fi

# Generate JWT secret
if ! grep -q "your-jwt-secret-key" .env.local 2>/dev/null; then
  JWT_SECRET=$(openssl rand -base64 32)
  sed -i.bak "s/your-jwt-secret-key-min-32-chars/$JWT_SECRET/" .env.local
  echo "✅ Generated JWT_SECRET"
fi

# Generate encryption key
if ! grep -q "your-32-char-encryption-key" .env.local 2>/dev/null; then
  ENCRYPTION_KEY=$(openssl rand -base64 32)
  sed -i.bak "s/your-32-char-encryption-key/$ENCRYPTION_KEY/" .env.local
  echo "✅ Generated ENCRYPTION_KEY"
fi

# Generate magic link secret
if ! grep -q "your-magic-link-secret" .env.local 2>/dev/null; then
  MAGIC_LINK_SECRET=$(openssl rand -base64 32)
  sed -i.bak "s/your-magic-link-secret-32-chars/$MAGIC_LINK_SECRET/" .env.local
  echo "✅ Generated MAGIC_LINK_SECRET"
fi

# Clean up backup files
rm -f .env.local.bak

echo "📝 Please update the following variables in your .env.local file:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - DATABASE_URL"
echo "   - OPENAI_API_KEY or ANTHROPIC_API_KEY"
echo "   - RESEND_API_KEY"
echo "   - TRIBE_API_KEY (if using Tribe integration)"

echo "✅ Environment setup complete for $STAGE!"
```

### 3. Service Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh
# Checks health of all services

set -e

echo "🏥 Running LeaderForge health checks..."

# Function to check HTTP service
check_http() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}

  echo "🔍 Checking $name at $url..."

  if command -v curl >/dev/null 2>&1; then
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$status" = "$expected_status" ]; then
      echo "✅ $name is healthy (status: $status)"
    else
      echo "❌ $name is unhealthy (status: $status)"
      return 1
    fi
  else
    echo "⚠️  curl not found, skipping $name check"
  fi
}

# Check frontend
if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
  check_http "Frontend" "$NEXT_PUBLIC_APP_URL"
fi

# Check API
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
  check_http "API" "$NEXT_PUBLIC_API_URL/health"
fi

# Check database
echo "🔍 Checking database connection..."
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database is healthy"
  else
    echo "❌ Database is unhealthy"
    exit 1
  fi
fi

# Check Redis
echo "🔍 Checking Redis connection..."
if command -v redis-cli >/dev/null 2>&1 && [ -n "$REDIS_URL" ]; then
  if redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "✅ Redis is healthy"
  else
    echo "❌ Redis is unhealthy"
    exit 1
  fi
fi

# Check external services
if [ -n "$TRIBE_API_URL" ] && [ -n "$TRIBE_API_KEY" ]; then
  check_http "Tribe API" "$TRIBE_API_URL/health" 200
fi

echo "✅ All health checks completed!"
```

---

## 🌐 Environment-Specific Configurations

### 1. Development Environment

```bash
# .env.development
NODE_ENV=development
APP_ENV=development

# Local URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Development features
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=debug

# Development database
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Local Redis
REDIS_URL=redis://localhost:6379

# Test API keys (use development/test keys)
OPENAI_API_KEY=sk-test-your-dev-key
RESEND_API_KEY=re_test-your-dev-key

# Development-specific settings
SEED_DATABASE=true
LOAD_FIXTURES=true
CREATE_TEST_USERS=true
ENABLE_QUERY_LOGGING=true
```

### 2. Staging Environment

```bash
# .env.staging
NODE_ENV=production
APP_ENV=staging

# Staging URLs
NEXT_PUBLIC_APP_URL=https://staging.leaderforge.com
NEXT_PUBLIC_API_URL=https://staging-api.leaderforge.com

# Staging features
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=info

# Staging database
DATABASE_URL=postgresql://postgres:password@staging-db.supabase.co:5432/postgres

# Production-like Redis
REDIS_URL=redis://default:password@staging-redis.upstash.io:6379

# Production API keys (staging versions)
OPENAI_API_KEY=sk-your-staging-key
RESEND_API_KEY=re_your-staging-key

# Staging-specific settings
SEED_DATABASE=false
LOAD_FIXTURES=false
CREATE_TEST_USERS=false
ENABLE_QUERY_LOGGING=false
```

### 3. Production Environment

```bash
# .env.production
NODE_ENV=production
APP_ENV=production

# Production URLs
NEXT_PUBLIC_APP_URL=https://app.leaderforge.com
NEXT_PUBLIC_API_URL=https://api.leaderforge.com

# Production features
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=warn

# Production database
DATABASE_URL=postgresql://postgres:secure-password@prod-db.supabase.co:5432/postgres

# Production Redis
REDIS_URL=redis://default:secure-password@prod-redis.upstash.io:6379

# Production API keys
OPENAI_API_KEY=sk-your-production-key
RESEND_API_KEY=re_your-production-key

# Production security
CORS_ORIGINS=https://app.leaderforge.com
RATE_LIMIT_MAX_REQUESTS=60

# Production-specific settings
SEED_DATABASE=false
LOAD_FIXTURES=false
CREATE_TEST_USERS=false
ENABLE_QUERY_LOGGING=false
BACKUP_ENABLED=true
```

---

## 🔍 Configuration Validation

### 1. TypeScript Environment Validation

```typescript
// lib/env/validation.ts
import { z } from "zod";

const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(["development", "staging", "production"]),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),

  // Authentication
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),

  // AI Services (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // External services (optional)
  RESEND_API_KEY: z.string().optional(),
  TRIBE_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().min(32),
  MAGIC_LINK_SECRET: z.string().min(32),
});

// Custom validation for AI providers
const validateEnv = (env: z.infer<typeof envSchema>) => {
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    throw new Error(
      "At least one AI provider (OpenAI or Anthropic) must be configured",
    );
  }
  return env;
};

export const env = validateEnv(envSchema.parse(process.env));

// Export typed environment variables
export type Env = typeof env;
```

### 2. Runtime Configuration Checker

```typescript
// lib/config/checker.ts
import { env } from "@/lib/env/validation";

export class ConfigChecker {
  static async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { supabase } = await import("@/lib/supabase/config");
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  static async checkRedisConnection(): Promise<boolean> {
    try {
      const { redis } = await import("@/lib/redis/config");
      if (!redis) return false;
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  static async checkAIProvider(): Promise<boolean> {
    try {
      if (env.OPENAI_API_KEY) {
        const { openai } = await import("@/lib/ai/config");
        await openai.models.list({ limit: 1 });
        return true;
      }

      if (env.ANTHROPIC_API_KEY) {
        // Anthropic doesn't have a simple health check, so we assume it's working
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  static async runAllChecks(): Promise<{
    database: boolean;
    redis: boolean;
    ai: boolean;
    overall: boolean;
  }> {
    const results = {
      database: await this.checkDatabaseConnection(),
      redis: await this.checkRedisConnection(),
      ai: await this.checkAIProvider(),
      overall: false,
    };

    results.overall = results.database && results.ai;

    return results;
  }
}
```

---

## 📋 Implementation Checklist

### Environment Setup

- [ ] Copy `.env.example` to `.env.local`
- [ ] Run environment setup script
- [ ] Update all placeholder values
- [ ] Run environment validation script
- [ ] Test database connection
- [ ] Test Redis connection (if configured)
- [ ] Test AI provider connection
- [ ] Verify all external service connections

### Development Environment

- [ ] Install all required dependencies
- [ ] Set up local Supabase instance
- [ ] Set up local Redis (optional)
- [ ] Configure development database
- [ ] Load development fixtures
- [ ] Test environment with health check script

### Staging Environment

- [ ] Set up staging infrastructure
- [ ] Configure staging environment variables
- [ ] Deploy to staging
- [ ] Run staging health checks
- [ ] Test staging with real data

### Production Environment

- [ ] Set up production infrastructure
- [ ] Configure production environment variables
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Deploy to production
- [ ] Run production health checks

---

## **This addendum provides complete environment configuration for all deployment stages, ensuring consistent and secure setup across development, staging, and production environments.**

## 🧩 Environment Configuration Enhancements

### 🧪 Config Schema Validation

All JSON config files should be validated at runtime using a schema validation library (e.g., [Zod](https://zod.dev/) or [AJV](https://ajv.js.org/)).

Include checks for:

- Required fields
- Allowed enums
- Field types
- Version compatibility

### 🔐 Secrets Management

Use `.env` for local development, but adopt:

- Google Secret Manager (GCP) or AWS SSM for cloud
- HashiCorp Vault or Doppler for multi-cloud teams

Secrets should never be committed to the repo or embedded in the frontend.

### 📚 Config Discovery

Add a `config/docs/README.md` that indexes:

- All available JSON config files
- Their purpose and scope
- Links to schema definitions

This serves as developer reference and aids onboarding.
