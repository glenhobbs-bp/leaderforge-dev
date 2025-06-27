# LangGraph Cloud Deployment Guide

## Overview

LangGraph Cloud is LangChain's hosted service for deploying LangGraph applications. This eliminates the need for self-hosting and provides enterprise-grade reliability.

## 🚀 Quick Setup

### 1. Create LangSmith Account

1. Visit [smith.langchain.com](https://smith.langchain.com)
2. Sign up or log in
3. Create a new organization/workspace

### 2. Get API Key

1. Go to Settings → API Keys
2. Create a new API key
3. Copy the key and base URL

### 3. Prepare Your Agent for Cloud Deployment

```bash
# Install LangGraph CLI
npm install -g @langchain/langgraph-cli

# Login to LangGraph Cloud (use your existing LANGSMITH_API_KEY)
export LANGCHAIN_API_KEY="$LANGSMITH_API_KEY"  # Uses your existing key
langgraph auth
```

### 4. Deploy to LangGraph Cloud

```bash
# From your agent directory
cd agent

# Deploy your graph
langgraph deploy

# Get the deployment URL
langgraph deployments list
```

### 5. Update Environment Variables

In Vercel, set:
```bash
LANGGRAPH_URL=https://your-deployment.langchain.app
LANGSMITH_API_KEY=your-existing-api-key  # You already have this
```

## 📋 Detailed Setup

### Agent Configuration

Update `agent/langgraph.json`:
```json
{
  "node_version": "20",
  "dependencies": ["."],
  "graphs": {
    "content_agent": "./src/index.ts:default"
  },
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "env:SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY": "env:ANTHROPIC_API_KEY",
    "TRIBE_SOCIAL_TOKEN": "env:TRIBE_SOCIAL_TOKEN"
  }
}
```

### Environment Variables in LangGraph Cloud

Set these in your LangGraph Cloud deployment:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
ANTHROPIC_API_KEY=your_anthropic_key
TRIBE_SOCIAL_TOKEN=your_tribe_token
TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
```

### Update AgentService

Modify `apps/web/app/lib/agentService.ts` to use LangGraph Cloud API:

```typescript
private async invokeLangGraphAgent(
  agent: Agent,
  request: AgentInvocationRequest
): Promise<AgentInvocationResponse> {
  // LangGraph Cloud uses different API endpoints
  const response = await fetch(`${this.langGraphUrl}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LANGCHAIN_API_KEY}`
    },
    body: JSON.stringify({
      assistant_id: 'content_agent', // Your graph name
      input: {
        userId: request.userId,
        tenantKey: request.tenantKey,
        navOptionId: request.navOptionId,
        intent: request.message
      }
    })
  });

  return response.json();
}
```

## 💰 Pricing Comparison

### LangGraph Cloud
- **Free Tier**: 10,000 traces/month
- **Team**: $39/month + usage
- **Enterprise**: Custom pricing
- **Usage**: ~$0.01-0.10 per agent invocation

### Self-Hosted (Railway)
- **Fixed Cost**: $5-20/month regardless of usage
- **Scaling**: Manual configuration required
- **Monitoring**: DIY setup

### Break-Even Analysis
- **Low Usage** (< 1,000 requests/month): LangGraph Cloud cheaper
- **Medium Usage** (1,000-10,000 requests/month): Similar cost
- **High Usage** (> 10,000 requests/month): Self-hosted cheaper

## 🔍 Monitoring & Debugging

### LangSmith Integration

LangGraph Cloud automatically integrates with LangSmith:

1. **Trace Visibility**: See every agent invocation
2. **Performance Metrics**: Response times and success rates
3. **Error Tracking**: Detailed error logs and stack traces
4. **Usage Analytics**: Request patterns and costs

### Example Monitoring Dashboard

```typescript
// Add tracing to your agent calls
import { trace } from 'langsmith';

const tracedAgentCall = trace(
  async (input) => {
    return await agentService.invokeAgent(agentId, input);
  },
  { name: 'content_agent_invocation' }
);
```

## 🔧 Development Workflow

### Local Development
```bash
# Test locally first
cd agent
npm run dev

# Deploy to staging
langgraph deploy --env staging

# Deploy to production
langgraph deploy --env production
```

### CI/CD Integration
```yaml
# .github/workflows/deploy-agent.yml
name: Deploy LangGraph Agent

on:
  push:
    branches: [main]
    paths: ['agent/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install LangGraph CLI
        run: npm install -g @langchain/langgraph-cli

      - name: Deploy to LangGraph Cloud
        env:
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
        run: |
          cd agent
          langgraph deploy --env production
```

## 🚨 Migration Strategy

### Phase 1: Start with LangGraph Cloud
1. Quick deployment and testing
2. Validate the architecture
3. Monitor usage patterns

### Phase 2: Evaluate at Scale
1. Monitor costs vs. self-hosted
2. Assess performance requirements
3. Consider compliance needs

### Phase 3: Migrate if Needed
1. Use the self-hosted configs already prepared
2. Railway/Render deployment ready to go
3. Gradual migration with traffic splitting

## ✅ Quick Decision Matrix

**Choose LangGraph Cloud if:**
- [ ] Getting to market quickly is priority
- [ ] You have < 10,000 requests/month
- [ ] You want built-in observability
- [ ] You prefer managed services
- [ ] Your team is small (< 5 developers)

**Choose Self-Hosted if:**
- [ ] You have > 50,000 requests/month
- [ ] You need custom runtime configurations
- [ ] You have DevOps expertise
- [ ] Cost predictability is important
- [ ] You need on-premise deployment

## 🎯 Recommended Path

```bash
# 1. Start with LangGraph Cloud (fastest)
cd agent
langgraph deploy

# 2. Update Vercel environment
LANGGRAPH_URL=https://your-deployment.langchain.app

# 3. Monitor for 1-2 months

# 4. Migrate to self-hosted if needed
railway up  # Using configs already prepared
```

This gives you the best of both worlds: fast time to market with an easy migration path if your needs change.