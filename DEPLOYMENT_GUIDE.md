# LeaderForge Deployment Guide

## Architecture Overview

LeaderForge uses a **two-service architecture**:

1. **Web Application** (Next.js) → Deploy to **Vercel**
2. **LangGraph Agent Service** → Deploy to **LangGraph Cloud** (recommended) or self-host

The web app communicates with the LangGraph service via HTTP API calls.

## 🏆 **Recommended: LangGraph Cloud**

For most use cases, we recommend starting with **LangGraph Cloud** for faster deployment and better observability. See `LANGGRAPH_CLOUD_SETUP.md` for detailed instructions.

### Quick LangGraph Cloud Setup
```bash
# 1. Get API key from smith.langchain.com
export LANGCHAIN_API_KEY="your-key"

# 2. Deploy agent
./deploy-langgraph-cloud.sh

# 3. Update Vercel environment variables
# 4. Redeploy Vercel
```

## 🚀 Quick Deployment Steps

### 1. Deploy LangGraph Service to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy the agent service
railway up

# Note the deployed URL (e.g., https://your-service.railway.app)
```

### 2. Update Vercel Environment Variables

In your Vercel dashboard, add:

```bash
LANGGRAPH_URL=https://your-service.railway.app
```

### 3. Redeploy Vercel

Push your changes to trigger a new Vercel deployment.

## 📋 Detailed Setup

### Railway Deployment

1. **Create Railway Account**: Visit [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Railway will auto-detect the `agent/` directory
   - Use the provided `railway.json` configuration

3. **Environment Variables** (set in Railway dashboard):
   ```bash
   NODE_ENV=production
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   TRIBE_SOCIAL_TOKEN=your_tribe_token
   TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
   ```

4. **Custom Domain** (optional):
   - Railway provides: `https://your-service.railway.app`
   - Or configure custom domain in Railway settings

### Vercel Configuration

1. **Environment Variables**:
   ```bash
   LANGGRAPH_URL=https://your-service.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Root Directory: `apps/web`
   - Node.js Version: **18.x**

## 🔍 Verification

### Test LangGraph Service

```bash
# Health check
curl https://your-service.railway.app/health

# Expected response:
{"status": "ok", "service": "langgraph-agent"}
```

### Test Web Application

1. Visit your Vercel URL
2. Navigate to any content section
3. Should see either:
   - ✅ Real content (if LangGraph working)
   - ⚠️ Fallback message (if LangGraph unavailable)

## 🔧 Alternative Deployment Options

### Option 1: Railway (Recommended)
- ✅ Easy setup with GitHub integration
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ Free tier available

### Option 2: Render
```bash
# Render configuration (render.yaml)
services:
  - type: web
    name: langgraph-agent
    env: node
    buildCommand: cd agent && npm install
    startCommand: cd agent && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Option 3: Google Cloud Run
```bash
# Build and deploy
cd agent
docker build -t gcr.io/YOUR_PROJECT/langgraph-agent .
docker push gcr.io/YOUR_PROJECT/langgraph-agent
gcloud run deploy --image gcr.io/YOUR_PROJECT/langgraph-agent --port 8000
```

### Option 4: Self-hosted VPS
```bash
# On your server
git clone your-repo
cd leaderforge-dev/agent
npm install
npm start

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "langgraph-agent" -- start
pm2 startup
pm2 save
```

## 🚨 Troubleshooting

### LangGraph Service Issues

1. **Service won't start**:
   ```bash
   # Check logs in Railway dashboard
   # Verify all environment variables are set
   # Ensure port 8000 is exposed
   ```

2. **Health check failing**:
   ```bash
   # Test locally first
   cd agent
   npm start
   curl http://localhost:8000/health
   ```

3. **Web app can't connect**:
   ```bash
   # Verify LANGGRAPH_URL in Vercel settings
   # Check Railway service is running
   # Test direct connection to Railway URL
   ```

### Environment Variables

```bash
# Required for LangGraph service:
NODE_ENV=production
SUPABASE_SERVICE_ROLE_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Required for Web app:
LANGGRAPH_URL=https://your-service.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## 📊 Monitoring

### Railway Monitoring
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for downtime

### Vercel Monitoring
- Function logs in Vercel dashboard
- Performance metrics
- Error tracking

## 🔄 CI/CD Pipeline

### Automatic Deployments

1. **Railway**: Auto-deploys on push to main branch
2. **Vercel**: Auto-deploys on push to main branch
3. **Environment sync**: Update environment variables in both platforms

### Manual Deployment

```bash
# Deploy LangGraph service
railway up

# Deploy web app
vercel --prod
```

## 💰 Cost Estimation

### Railway (LangGraph Service)
- **Hobby Plan**: $5/month (512MB RAM, 1GB storage)
- **Pro Plan**: $20/month (8GB RAM, 100GB storage)

### Vercel (Web App)
- **Hobby Plan**: Free (100GB bandwidth)
- **Pro Plan**: $20/month (1TB bandwidth)

**Total**: ~$25-40/month for full production deployment

## ✅ Success Criteria

Deployment is successful when:

- [ ] Railway service responds to health checks
- [ ] Vercel app loads without errors
- [ ] Navigation options work with real content
- [ ] Fallback mechanism works when service unavailable
- [ ] All environment variables configured correctly
- [ ] HTTPS/SSL working on both services