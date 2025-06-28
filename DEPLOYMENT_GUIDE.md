# LeaderForge Deployment Guide

## Architecture Overview

LeaderForge uses a **two-service architecture** with automatic environment detection:

1. **Web Application** (Next.js) → Deploy to **Vercel**
2. **LangGraph Agent Service** → Deploy to **Render**

The system automatically detects production vs development environments and uses the appropriate service URLs.

## 🏆 **Current Production Architecture: Vercel + Render**

### ✅ **Deployed Services**
- **Web App**: `https://leaderforge.vercel.app` (Vercel)
- **Agent Service**: `https://leaderforge-langgraph-2.onrender.com` (Render)

### 🔧 **Automatic Environment Detection**
The system automatically uses the correct URLs based on environment:
- **Production**: `https://leaderforge-langgraph-2.onrender.com`
- **Development**: `http://127.0.0.1:8000`
- **Override**: Set `LANGGRAPH_URL` environment variable to override

## 🚀 Quick Production Deployment

### Prerequisites
- GitHub repository connected to Vercel
- GitHub repository connected to Render
- All environment variables configured

### Deployment Process
1. **Push to main branch** - Both services auto-deploy
2. **Vercel** deploys web app automatically
3. **Render** deploys agent service automatically
4. **Environment detection** handles URL configuration

### No Manual Configuration Required
- ✅ URLs are automatically configured for production
- ✅ Development still uses localhost
- ✅ Override capability available if needed

## 📋 Service Configuration

### Vercel (Web Application)
**Repository**: Auto-deploy from `main` branch
**Build Settings**:
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Root Directory: `apps/web`
- Node.js Version: **18.x**

**Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TRIBE_SOCIAL_TOKEN=your_tribe_token
# LANGGRAPH_URL=custom_url  # Optional override
```

### Render (Agent Service)
**Repository**: Auto-deploy from `main` branch, `agent/` directory
**Configuration** (via `render.yaml`):
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

**Environment Variables** (set in Render dashboard):
```bash
NODE_ENV=production
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TRIBE_SOCIAL_TOKEN=your_tribe_token
TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
```

## 🔍 Verification

### Test Agent Service Health
```bash
curl https://leaderforge-langgraph-2.onrender.com/health
# Expected: {"status": "ok", "service": "langgraph-agent"}
```

### Test Web Application
1. Visit `https://leaderforge.vercel.app`
2. Navigate to any content section
3. Should see real content (agent service working) or fallback (agent service unavailable)

### Check Environment Detection
The system logs will show which URL is being used:
- **Production**: `Using agent service: https://leaderforge-langgraph-2.onrender.com`
- **Development**: `Using agent service: http://127.0.0.1:8000`

## 🚨 Troubleshooting

### Agent Service Issues
**Cold Starts**: Render free tier may have 10-30 second delays after inactivity
- **Solution**: First request may be slow, subsequent requests are fast
- **Mitigation**: Consider upgrading to paid tier for production scale

**Service Unavailable**: Check Render dashboard for deployment status
- **Logs**: View real-time logs in Render dashboard
- **Health Check**: Verify `/health` endpoint responds

### Web Application Issues
**Environment Variables**: Verify all required variables are set in Vercel
**Build Errors**: Check Vercel deployment logs for build failures
**API Errors**: Check Vercel function logs for runtime errors

### Cross-Service Communication
**Network Errors**: Verify agent service is accessible from Vercel
**Authentication**: Ensure auth headers are properly forwarded
**Timeouts**: Check for network latency issues between services

## 🔧 Alternative Deployment Options

### Option 1: LangGraph Cloud (Future)
```bash
# When scale justifies the cost ($39/month)
langgraph deploy
# Update LANGGRAPH_URL to LangGraph Cloud URL
```

### Option 2: Railway
```bash
# Alternative to Render
railway up
# Update LANGGRAPH_URL to Railway URL
```

### Option 3: Self-hosted
```bash
# For full control
docker build -t langgraph-agent agent/
docker run -p 8000:8000 langgraph-agent
# Update LANGGRAPH_URL to your server URL
```

## 📊 Monitoring

### Key Metrics
- **Vercel**: Function duration, error rates, build times
- **Render**: Service uptime, response times, memory usage
- **Cross-service**: Request success rates, latency

### Health Checks
- **Agent Service**: `GET /health` every 5 minutes
- **Web App**: Monitor error rates and response times
- **Database**: Monitor Supabase connection health

## 💰 Cost Optimization

### Current Setup (Free Tier)
- **Vercel**: Free tier (100GB bandwidth, 1000 serverless functions)
- **Render**: Free tier (750 hours/month, automatic sleep)
- **Total**: $0/month for MVP scale

### Scaling Considerations
- **Render Pro**: $7/month for no sleep, faster builds
- **Vercel Pro**: $20/month for team features, analytics
- **LangGraph Cloud**: $39/month for enterprise agent hosting

## 📚 Related Documentation
- [ADR-0013: Production Deployment Architecture](docs/architecture/adr/0013-production-deployment-architecture.md)
- [Architecture Overview](docs/architecture/overview/agent-native-composition-architecture.md)
- [Environment Configuration](packages/env/index.ts)