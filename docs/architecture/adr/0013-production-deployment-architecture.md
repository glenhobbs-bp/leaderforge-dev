# ADR-0013: Production Deployment Architecture

## Status
Accepted

## Context

LeaderForge uses a two-service architecture that requires careful consideration for production deployment:

1. **Web Application** (Next.js) - Frontend, API routes, authentication, database access
2. **LangGraph Agent Service** - AI agent orchestration, content generation, schema composition

The system needs:
- Reliable, scalable deployment for both services
- Proper environment configuration management
- Cost-effective hosting solutions
- Seamless communication between services
- Automatic deployments from Git

## Decision

We will deploy LeaderForge using a **Vercel + Render** architecture:

### Web Application → Vercel
- **Platform**: Vercel (vercel.com)
- **Repository**: Auto-deploy from `main` branch
- **Domain**: `leaderforge.vercel.app`
- **Features**: Edge functions, automatic scaling, CDN, preview deployments

### LangGraph Agent Service → Render
- **Platform**: Render (render.com)
- **Repository**: Auto-deploy from `main` branch, `agent/` directory
- **Domain**: `https://leaderforge-langgraph-2.onrender.com`
- **Features**: Automatic scaling, health checks, free tier available

### Environment Configuration Strategy
- **Automatic Environment Detection**: Production URLs are automatically used when `NODE_ENV=production` or `VERCEL_ENV=production`
- **Override Capability**: `LANGGRAPH_URL` environment variable can override automatic detection
- **Development Fallback**: Local development automatically uses `http://127.0.0.1:8000`

## Implementation Details

### 1. Environment Configuration (`packages/env/index.ts`)
```typescript
LANGGRAPH_API_URL: (() => {
  // Explicit override takes precedence
  if (process.env.LANGGRAPH_URL) {
    return process.env.LANGGRAPH_URL;
  }

  // Production environment detection
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return 'https://leaderforge-langgraph-2.onrender.com';
  }

  // Development fallback
  return 'http://127.0.0.1:8000';
})()
```

### 2. Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: leaderforge-langgraph
    runtime: node
    plan: free
    rootDir: agent
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health
```

### 3. Vercel Configuration
- **Build Command**: `npm run build`
- **Root Directory**: `apps/web`
- **Node.js Version**: 18.x
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
  - `TRIBE_SOCIAL_TOKEN`

## Architecture Benefits

### Vercel for Web App
✅ **Optimal Next.js hosting** - Built specifically for Next.js applications
✅ **Edge network** - Global CDN with automatic optimization
✅ **Serverless scaling** - Automatic scaling based on demand
✅ **GitHub integration** - Automatic deployments and preview builds
✅ **Zero configuration** - Works out of the box with Next.js

### Render for Agent Service
✅ **Simple deployment** - Direct from Git with minimal configuration
✅ **Free tier** - Cost-effective for development and small-scale production
✅ **Health checks** - Built-in monitoring and restart capabilities
✅ **Environment management** - Secure environment variable handling
✅ **Automatic scaling** - Scales based on traffic patterns

### Communication Flow
```
User → Vercel (Web App) → Render (Agent Service) → Response
```

1. User interacts with web application hosted on Vercel
2. Web app API routes invoke agent service on Render
3. Agent service processes requests and returns schema/content
4. Web app renders response to user

## Alternatives Considered

### LangGraph Cloud
- **Pros**: Official LangChain hosting, advanced observability
- **Cons**: $39/month minimum cost, overkill for current scale
- **Decision**: Rejected due to cost for MVP phase

### Railway
- **Pros**: Good developer experience, simple deployment
- **Cons**: Required paid plan for web services
- **Decision**: Rejected due to cost constraints

### Self-hosted VPS
- **Pros**: Full control, potentially lower cost at scale
- **Cons**: Requires infrastructure management, monitoring setup
- **Decision**: Rejected due to operational overhead

## Consequences

### Positive
- **Cost-effective**: Both platforms offer generous free tiers
- **Reliable**: Enterprise-grade hosting with automatic scaling
- **Simple**: Minimal configuration and maintenance required
- **Flexible**: Easy to migrate or scale individual services
- **Observable**: Built-in monitoring and logging capabilities

### Negative
- **Cold starts**: Render free tier may have 10-30 second cold start delays
- **Vendor lock-in**: Dependent on two separate hosting providers
- **Network latency**: Cross-service communication adds network overhead

### Monitoring Requirements
- **Health checks**: Monitor both Vercel and Render service availability
- **Performance**: Track response times for cross-service communication
- **Error rates**: Monitor failed requests between services
- **Cold starts**: Track and optimize Render service wake-up times

## Success Criteria
- [ ] Web application deploys automatically from `main` branch
- [ ] Agent service deploys automatically from `main` branch
- [ ] Cross-service communication works reliably in production
- [ ] Environment configuration automatically detects production vs development
- [ ] Total hosting costs remain under $50/month for MVP scale
- [ ] Service availability exceeds 99% uptime

## Future Considerations
- **Scale migration**: Plan for LangGraph Cloud migration when usage justifies cost
- **Multi-region**: Consider deploying agent service to multiple regions for latency
- **Caching**: Implement Redis or similar for agent response caching
- **Load balancing**: Consider multiple agent service instances for high availability

## Related ADRs
- ADR-0001: Agent-Native Composition System
- ADR-0002: Modular Monolith Architecture
- ADR-0007: API Route Organization