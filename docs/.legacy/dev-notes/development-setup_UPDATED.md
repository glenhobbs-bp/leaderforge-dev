# LeaderForge Development Setup & Toolchain

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/your-org/leaderforge.git
cd leaderforge
npm install
npm run setup:env
npm run dev
```

---

## 🛠️ Required Tools

### Core Development Tools

```bash
# Node.js 20+ (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# pnpm (faster, more efficient than npm)
npm install -g pnpm

# Turborepo (monorepo management)
pnpm add -g turbo
```

### Cursor IDE Setup

1. **Install Cursor** from [cursor.sh](https://cursor.sh)
2. **Install Extensions**:

   ```
   - Tailwind CSS IntelliSense
   - Prisma
   - ESLint
   - Prettier
   - GitLens
   - Error Lens
   - Thunder Client (API testing)
   ```

3. **Configure Cursor Settings**:

   ```json
   {
     "cursor.aiProvider": "anthropic",
     "cursor.aiModel": "claude-3-opus",
     "cursor.contextLength": "long",
     "cursor.includeProjectContext": true,
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

4. **Add Project Context** (`.cursorcontext`):

   ```
   This is LeaderForge, an agent-first learning platform.
   Key principles:
   - Conversation over navigation
   - Multi-context support (Business, Spiritual, MLM)
   - Agent orchestration with LangGraph
   - Built with Next.js 14, CopilotKit, and Supabase

   See .cursorrules for coding standards.
   ```

---

## 📦 Project Initialization

### 1. Create Monorepo Structure

```bash
# Initialize monorepo
mkdir leaderforge && cd leaderforge
pnpm init
pnpm add -D turbo

# Create workspace structure
mkdir -p apps/web apps/api packages/shared packages/database packages/ai-core
```

### 2. Configure Turborepo

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 3. Setup Next.js Frontend

```bash
cd apps/web
pnpm create next-app . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install UI dependencies
pnpm add @copilotkit/react-core @copilotkit/react-ui
pnpm add @copilotkit/runtime
pnpm add lucide-react framer-motion
pnpm add zustand @tanstack/react-query
pnpm add socket.io-client

# Install shadcn/ui
pnpm dlx shadcn-ui@latest init
```

### 4. Setup API Server

```bash
cd apps/api
pnpm init
pnpm add express cors helmet compression
pnpm add @langchain/core @langchain/openai langchain
pnpm add @supabase/supabase-js
pnpm add socket.io
pnpm add resend # For email/magic links
pnpm add -D @types/express @types/node typescript tsx nodemon
```

### 5. Configure Shared Packages

```bash
cd packages/shared
pnpm init
# Create shared types, utilities, and constants
```

---

## 🔧 Environment Configuration

### 1. Create Environment Files

Create `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI/LLM
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# External Services
TRIBE_API_URL=https://api.tribesocial.io
TRIBE_API_KEY=your_tribe_api_key
TRIBE_PLATFORM_MOVEMENT=36
TRIBE_PLATFORM_LEADERFORGE=37
TRIBE_PLATFORM_WEALTH=38
MLM_PLATFORM_API_KEY=your_mlm_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_ENABLE_MLM=true
NEXT_PUBLIC_ENABLE_COMMUNITY=true

# Email Service (for magic links)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@leaderforge.com

# Optional 2FA
NEXT_PUBLIC_ENABLE_2FA=false
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 2. Setup Git Hooks

```bash
# Install husky for pre-commit hooks
pnpm add -D husky lint-staged
pnpm dlx husky install

# Configure pre-commit
pnpm dlx husky add .husky/pre-commit "pnpm lint-staged"
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

---

## 🏗️ Database Setup

### 1. Initialize Supabase

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize local project
supabase init

# Start local Supabase
supabase start
```

### 2. Create Database Schema

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS modules;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Users table with multi-context support
CREATE TABLE core.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  enabled_modules TEXT[] DEFAULT ARRAY['movement'],
  current_module TEXT DEFAULT 'movement',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations for flexible hierarchy
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  parent_org_id UUID REFERENCES core.organizations(id),
  level INTEGER DEFAULT 0,
  path TEXT[],
  module_id TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User organization membership
CREATE TABLE core.user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id),
  org_id UUID NOT NULL REFERENCES core.organizations(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  CONSTRAINT unique_user_org UNIQUE (user_id, org_id)
);

-- Email validation for magic links
CREATE TABLE core.email_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  validation_type TEXT NOT NULL,
  user_id UUID REFERENCES core.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  validated_at TIMESTAMPTZ
);

-- Content table
CREATE TABLE modules.content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT,
  available_modules TEXT[] DEFAULT ARRAY['movement'],
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE modules.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES core.users(id),
  content_id UUID REFERENCES modules.content(id),
  module_context TEXT NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, module_context)
);

-- Conversation events (append-only)
CREATE TABLE core.conversation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES core.users(id),
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  module_context TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.conversation_events ENABLE ROW LEVEL SECURITY;
```

### 3. Generate TypeScript Types

```bash
cd packages/database
pnpm add -D @supabase/supabase-js
pnpm dlx supabase gen types typescript --local > types/supabase.ts
```

---

## 🧪 Testing Setup

### 1. Install Testing Dependencies

```bash
# Unit testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event @testing-library/react-hooks

# E2E testing
pnpm add -D playwright @playwright/test

# API testing
pnpm add -D supertest @types/supertest
```

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. Create Test Utilities

```typescript
// tests/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

---

## 🚀 Development Workflow

### 1. Start Development Servers

```bash
# Terminal 1: Start all services
pnpm dev

# Terminal 2: Start Supabase locally
supabase start

# Terminal 3: Start Redis (for caching)
docker run -p 6379:6379 redis
```

### 2. Development Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "setup:env": "node scripts/setup-env.js",
    "db:migrate": "cd packages/database && pnpm migrate",
    "db:seed": "cd packages/database && pnpm seed",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  }
}
```

### 3. Cursor Workflow Tips

#### Quick Agent Creation

```bash
# Use Cursor's AI to generate agent boilerplate
# Type: "Create a new agent for handling user progress tracking"
# Cursor will generate the full agent class with proper patterns
```

#### Conversation Flow Testing

```typescript
// Create test conversations in Cursor
// Type: "Generate test cases for content discovery conversation"
// Cursor will create realistic conversation flows
```

#### Component Generation

```bash
# Use Cursor to generate UI components
# Type: "Create a chat message component with thinking animation"
# Cursor will generate component with proper types and styling
```

---

## 📊 Monitoring & Debugging

### 1. Development Tools

```typescript
// Add debug logging for agents
if (process.env.NODE_ENV === "development") {
  console.log("[Agent]", agentId, "Processing:", message);
  console.log("[Agent]", agentId, "Response:", response);
}
```

### 2. Chrome DevTools Setup

- Install React Developer Tools
- Install Redux DevTools (for Zustand)
- Use Network tab to monitor WebSocket connections

### 3. Logging Configuration

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
```

---

## 🚢 Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests passing (>80% coverage)
- [ ] No console.logs in production code

### Performance

- [ ] Lighthouse score >90
- [ ] Bundle size analyzed and optimized
- [ ] Images optimized and lazy loaded
- [ ] API responses <500ms

### Security

- [ ] Environment variables secured
- [ ] API routes protected
- [ ] Input validation implemented
- [ ] RLS policies tested

### Documentation

- [ ] README updated
- [ ] API documentation current
- [ ] Deployment guide complete
- [ ] Cursor rules documented

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Type Errors with CopilotKit

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm type-check
```

#### 2. Supabase Connection Issues

```bash
# Check Supabase status
supabase status

# Reset local database
supabase db reset
```

#### 3. Agent Not Responding

```typescript
// Check agent registration
console.log("Registered agents:", agentRegistry.list());

// Verify message routing
logger.debug("Routing message to:", targetAgent);
```

---

## 📚 Resources

### Documentation

- [Next.js 14 Docs](https://nextjs.org/docs)
- [CopilotKit Docs](https://docs.copilotkit.ai)
- [LangGraph Guide](https://langchain.com/docs/langgraph)
- [Supabase Docs](https://supabase.com/docs)

### Community

- Project Discord: [Join Here]
- Weekly Dev Syncs: Thursdays 2PM EST
- Code Reviews: Via GitHub PRs

### Learning Resources

- [Agent Architecture Patterns](./docs/agent-patterns.md)
- [Conversation Design Guide](./docs/conversation-design.md)
- [Multi-Context Best Practices](./docs/multi-context.md)

---

## 🧪 Dev Environment Improvements

### 🧱 Dev Containers

Include a `.devcontainer/` directory to define a containerized development environment compatible with [Cursor](https://www.cursor.so), [VS Code Dev Containers](https://containers.dev/), or [GitHub Codespaces](https://github.com/features/codespaces). This should specify:

- Node version and dependencies
- Docker services (e.g., PostgreSQL, Redis)
- Volume mappings
- Useful CLI tools

### 🚀 TurboRepo Pipelines

Use `turbo.json` to optimize build/test/lint pipelines. Define dependency relationships and cache configuration:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "test": {}
  }
}
```

### 🔍 Lint + Format Presets

Adopt shared linting and formatting rules:

- ESLint with base config in `libs/eslint-config-custom`
- Prettier config in root `.prettierrc`
- Husky for pre-commit hooks with lint + test

### 📖 Add Developer Handbook

Create a top-level `docs/` folder containing:

- Environment setup
- Running dev server
- Testing strategy
- FAQ + known issues

Name it: `docs/developer-guide.md`
