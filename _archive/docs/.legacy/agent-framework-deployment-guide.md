# Agent Framework Deployment Guide

## 🎯 Overview

This guide covers the deployment of the LeaderForge Agent Framework, specifically the `leaderforgeContentLibrary` agent with clean invocation from NavPanel via the `core.nav_options.agent_id` field.

## 🏗️ Architecture Summary

### Agent-Native Flow
1. **User clicks nav option** → NavPanel sends request to `/api/agent/content`
2. **API looks up nav option** → Gets `agent_id` from `core.nav_options`
3. **API loads agent config** → From `core.agents` table
4. **API routes to agent type** → LangGraph HTTP API (port 8000)
5. **LangGraph agent executes** → Uses TribeSocialContentTool
6. **Agent returns ComponentSchema** → Grid with Card items
7. **Frontend renders schema** → ComponentSchemaRenderer displays content

### Key Components
- **Database**: `core.agents` and `core.nav_options` tables
- **LangGraph Agent**: `agent/src/index.ts` (HTTP API on port 8000)
- **Agent Service**: `apps/web/app/lib/agentService.ts`
- **API Endpoint**: `apps/web/app/api/agent/content/route.ts`
- **Tools**: `packages/agent-core/tools/TribeSocialContentTool.ts`

## 📋 Deployment Steps

### Step 1: Database Setup

Execute the following SQL scripts in your Supabase database:

```sql
-- 1. Create the leaderforgeContentLibrary agent
\i create_leaderforge_content_agent.sql

-- 2. Update nav options with agent references
\i update_nav_options_agent_id.sql
```

**Verification**:
```sql
-- Verify agent exists
SELECT name, display_name, type, enabled FROM core.agents WHERE name = 'leaderforgeContentLibrary';

-- Verify nav options have agent_id
SELECT context_key, label, agent_id FROM core.nav_options WHERE agent_id IS NOT NULL;
```

### Step 2: Start Development Services

```bash
# Start both web and LangGraph servers
./start-dev.sh

# OR start manually:
# Terminal 1: Web server
cd apps/web && npm run dev

# Terminal 2: LangGraph server
cd agent && npx @langchain/langgraph-cli dev --port 8000
```

**Verification**:
- Web server: http://localhost:3000
- LangGraph server: http://localhost:8000
- LangGraph info: http://localhost:8000/info

### Step 3: Test Agent Framework

#### Manual Testing

1. **Login to the application**
2. **Switch to LeaderForge context** (if not default)
3. **Click "Content Library" in navigation**
4. **Verify agent response**:
   - Should show loading state
   - Should display grid of video cards
   - Each card should have title, description, thumbnail
   - Cards should have "Watch Video" actions

#### API Testing

```bash
# Test agent invocation directly
curl -X POST http://localhost:3000/api/agent/content \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "contextKey": "leaderforge",
    "navOptionId": "nav-option-uuid",
    "intent": {"message": "Show me the content library"}
  }'
```

#### LangGraph Testing

```bash
# Test LangGraph directly
curl -X POST http://localhost:8000/threads \
  -H "Content-Type: application/json" \
  -d '{}'

# Then run the agent
curl -X POST http://localhost:8000/threads/{thread_id}/runs \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "default",
    "input": {
      "userId": "test-user",
      "contextKey": "leaderforge",
      "navOptionId": "test-nav"
    }
  }'
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "No agent assigned to navigation option"
**Cause**: `nav_options.agent_id` is NULL
**Fix**: Run `update_nav_options_agent_id.sql`

#### 2. "Agent not found"
**Cause**: Agent doesn't exist in `core.agents`
**Fix**: Run `create_leaderforge_content_agent.sql`

#### 3. "LangGraph invocation failed"
**Cause**: LangGraph server not running
**Fix**: Start LangGraph server on port 8000

#### 4. "Authentication required"
**Cause**: User session not properly restored
**Fix**: Check cookie configuration and Supabase setup

#### 5. Empty content grid
**Cause**: TribeSocialContentTool configuration issue
**Fix**: Check `TRIBE_SOCIAL_TOKEN` and `TRIBE_SOCIAL_API_URL` environment variables

### Debug Logs

Monitor these log outputs:

```bash
# Web server logs
[API/agent/content] Request: {...}
[API/agent/content] Found nav option: {...}
[API/agent/content] Found agent: {...}
[AgentService] Created LangGraph run: {...}

# LangGraph logs
[ContentAgent] Fetching content for context: leaderforge
[ContentAgent] Retrieved content count: 15
[ContentAgent] Generated schema with 15 items
```

## 🧪 Testing Checklist

### Functional Tests
- [ ] Nav option click triggers agent
- [ ] Agent loads from database correctly
- [ ] LangGraph HTTP API responds
- [ ] TribeSocialContentTool fetches data
- [ ] ComponentSchema renders properly
- [ ] Error states display correctly

### Performance Tests
- [ ] Agent response time < 3 seconds
- [ ] Content loading shows progress
- [ ] No memory leaks in LangGraph
- [ ] Database queries optimized

### Security Tests
- [ ] Authentication required
- [ ] User can only access entitled content
- [ ] No sensitive data in logs
- [ ] RLS policies enforced

## 📊 Monitoring

### Key Metrics
- **Agent Response Time**: Target < 3 seconds
- **Success Rate**: Target > 95%
- **Content Freshness**: TribeSocial sync status
- **Error Rate**: Monitor failed agent invocations

### Log Monitoring
- Watch for `[AgentService]` errors
- Monitor `[ContentAgent]` performance
- Track `[TribeSocialContentTool]` API calls

## 🚀 Production Deployment

### Environment Variables
```bash
# Required for agent framework
LANGGRAPH_URL=http://localhost:8000
TRIBE_SOCIAL_TOKEN=your-token
TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Production Considerations
- Use production LangGraph deployment (not localhost)
- Configure proper error monitoring
- Set up agent performance alerting
- Implement agent response caching
- Monitor database performance

## ✅ Success Criteria

The agent framework is successfully deployed when:

1. **Database Integration**: Agents stored in `core.agents`, nav options reference via `agent_id`
2. **Clean Invocation**: NavPanel → AgentService → LangGraph → ComponentSchema
3. **Pure Architecture**: No hardcoded content, all data via tools
4. **Performance**: Sub-3-second response times
5. **Reliability**: 95%+ success rate
6. **Observability**: Full logging and monitoring

## 📝 Next Steps

After successful deployment:
- [ ] Add more agent types (llm, tool, workflow)
- [ ] Implement agent versioning and rollback
- [ ] Add agent performance analytics
- [ ] Create agent configuration UI
- [ ] Implement agent A/B testing
- [ ] Add real-time content sync via webhooks