# LeaderForge Deployment & DevOps Guide (Light Version)

## Overview

This guide provides a streamlined deployment approach for the initial LeaderForge development phase, optimized for a single developer using Cursor & Claude.

## Local Development Setup

### 1. Prerequisites

```bash
# Required tools
- Node.js 20+ (via nvm)
- pnpm package manager
- Docker Desktop (for local Supabase)
- Git

# Install nvm and Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm
```

### 2. Repository Setup

```bash
# Clone repository
git clone https://github.com/brilliant-perspectives/leaderforge.git
cd leaderforge

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Local Services

```bash
# Start Supabase locally
pnpm supabase:start

# Start Redis for caching
docker run -d -p 6379:6379 redis:alpine

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

### 4. Development Workflow

```bash
# Start all services (uses Turborepo)
pnpm dev

# This starts:
# - Next.js frontend on http://localhost:3000
# - API server on http://localhost:3001
# - Supabase Studio on http://localhost:54323
```

## Deployment Strategy

### Phase 1: Development (Current)

- **Frontend**: Vercel (automatic from GitHub)
- **API**: Railway or Render
- **Database**: Supabase Cloud (free tier)
- **Redis**: Upstash (serverless Redis)

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel)

```bash
# Add via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
# ... etc

# Or add via Vercel Dashboard
# Project Settings > Environment Variables
```

### Railway Deployment (API)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Add environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
```

## Database Management

### Migrations

```bash
# Create new migration
pnpm supabase migration new <migration_name>

# Apply migrations locally
pnpm supabase db reset

# Push to production
pnpm supabase db push
```

### Backup Strategy

```bash
# Manual backup (for now)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240115.sql
```

## Monitoring & Debugging

### Basic Monitoring

```javascript
// apps/api/src/monitoring.ts
export const monitor = {
  // Simple health check endpoint
  health: async (req, res) => {
    const checks = {
      api: "ok",
      database: await checkDatabase(),
      redis: await checkRedis(),
      timestamp: new Date(),
    };
    res.json(checks);
  },
};

// Add to Uptime Robot or similar
// https://api.leaderforge.com/health
```

### Error Tracking

```bash
# Install Sentry
pnpm add @sentry/nextjs @sentry/node

# Initialize (follow Sentry wizard)
npx @sentry/wizard -i nextjs
```

### Logs

```bash
# View Vercel logs
vercel logs --follow

# View Railway logs
railway logs

# Local development logs
# Check terminal output from pnpm dev
```

## Quick Deployment Checklist

### Before First Deploy

- [ ] Set up GitHub repository
- [ ] Create Vercel account and connect repo
- [ ] Create Supabase project
- [ ] Set up Railway/Render account
- [ ] Configure environment variables

### For Each Deploy

- [ ] Run tests locally: `pnpm test`
- [ ] Check TypeScript: `pnpm type-check`
- [ ] Review changes: `git diff`
- [ ] Commit with clear message
- [ ] Push to GitHub (auto-deploys)
- [ ] Verify deployment in staging
- [ ] Check error tracking

## LangGraph Agent Integration Checklist

### For Local Development

- [ ] Ensure LangGraph agent is running locally (e.g., `pnpm exec langgraphjs dev --host localhost --port 8000`)
- [ ] Confirm `langgraph.json` is present and correctly configured in the agent directory
- [ ] In CopilotKit API handler, set remote endpoint to `http://localhost:8000` using `langGraphPlatformEndpoint`
- [ ] Verify CopilotKit frontend can connect to the local LangGraph agent

### For Production

- [ ] Choose deployment: LangGraph Platform (managed) or Self-Hosted (FastAPI/Node)
- [ ] Update CopilotKit API handler to use production LangGraph deployment URL and API key
- [ ] Add/verify agent(s) in `langgraph.json` and update descriptions/IDs as needed
- [ ] Test end-to-end integration in staging/production

## Useful Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "start": "turbo start",
    "test": "turbo test",
    "type-check": "turbo type-check",

    // Deployment helpers
    "deploy:preview": "vercel",
    "deploy:prod": "vercel --prod",
    "deploy:api": "railway up",

    // Database
    "db:migrate": "pnpm --filter database migrate",
    "db:seed": "pnpm --filter database seed",
    "db:reset": "pnpm --filter database reset",

    // Quick checks
    "precommit": "pnpm type-check && pnpm test",
    "check:env": "node scripts/check-env.js"
  }
}
```

## Environment Management

### Required Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env (API)
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=

# Tribe Integration
TRIBE_API_URL=https://api.tribesocial.io
TRIBE_API_KEY=
```

### Environment Validation Script

```javascript
// scripts/check-env.js
const required = ["DATABASE_URL", "OPENAI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("Missing environment variables:", missing);
  process.exit(1);
}
console.log("✅ All required environment variables set");
```

## Troubleshooting

### Common Issues

**Port already in use**

```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

**Database connection issues**

```bash
# Reset local Supabase
pnpm supabase stop
pnpm supabase start
pnpm supabase db reset
```

**Build failures**

```bash
# Clear all caches
rm -rf .next node_modules
pnpm install
pnpm build
```

**Type errors after package updates**

```bash
# Regenerate types
pnpm supabase gen types typescript --local > packages/database/types/supabase.ts
```

## Next Steps (When Ready to Scale)

1. **Add CI/CD Pipeline**

   - GitHub Actions for automated testing
   - Preview deployments for PRs
   - Automated database migrations

2. **Enhanced Monitoring**

   - APM with DataDog or New Relic
   - Structured logging with winston
   - Performance monitoring

3. **Infrastructure as Code**

   - Terraform for resource management
   - Docker containerization
   - Kubernetes for orchestration

4. **Security Hardening**
   - WAF implementation
   - DDoS protection
   - Regular security audits

## For now, focus on shipping features quickly while maintaining basic monitoring and error tracking.

## 🚀 DevOps & Deployment Enhancements

### 📦 Container Strategy

Use multi-stage Docker builds:

- Stage 1: Build (Node/Yarn/PNPM)
- Stage 2: Runtime (minimal Node image)

Ensure images are optimized and scanned for vulnerabilities (use `snyk` or `trivy`).

### 🔄 Zero Downtime Deployments

Use blue-green or rolling deployment strategies for API and frontend services to minimize disruption.

Recommended tools:

- Google Cloud Run
- Kubernetes with Istio/Argo Rollouts
- Fly.io for fast preview environments

### 🔐 Secrets and Env Configuration

Leverage secret managers (GCP, AWS, Doppler) and inject secrets at runtime rather than build time.

Avoid storing sensitive values in `.env` or Docker images.

### 🛠 CI/CD Automation

Use GitHub Actions with reusable workflows for:

- Build
- Lint & test
- Deploy to staging/production

Support PR preview environments for frontend via Vercel/Fly or ephemeral containers.

### 📊 Observability

Add tracing, logs, and metrics reporting:

- OpenTelemetry + collector
- Log aggregation (Loki, GCP Logging)
- Sentry for error tracking
