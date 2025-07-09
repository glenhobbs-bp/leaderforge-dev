# Agent Pattern Selection Guide

**Document Version:** 1.0
**Last Updated:** 2025-07-09
**Related:** [ADR-0025: Agent Complexity Spectrum & Performance Optimization](../architecture/adr/0025-agent-complexity-spectrum-optimization.md)

## 🎯 Quick Decision Matrix

| **Feature Type** | **Complexity** | **AI Needs** | **Performance** | **Pattern** | **Examples** |
|------------------|----------------|--------------|-----------------|-------------|--------------|
| Settings/CRUD    | Low           | None         | Critical        | **Static Page** | User preferences, context management |
| Dashboards       | Medium        | Minimal      | Important       | **Direct Schema** | Executive dashboard, progress tracking |
| AI Features      | Medium        | Moderate     | Moderate        | **LLM Agent** | Content suggestions, smart responses |
| Workflows        | High          | Complex      | Background      | **LangGraph** | Multi-step processes, decision trees |

## 📊 Performance Comparison

```
🚀 Load Time Comparison:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Static Page │   Direct    │    LLM      │  LangGraph  │
│    ~80ms    │   ~200ms    │   ~600ms    │   ~1200ms   │
└─────────────┴─────────────┴─────────────┴─────────────┘

📦 Bundle Impact:
Static:     Base + Feature code only
Direct:     + Widget dispatcher + Schema processor
LLM:        + Anthropic SDK + Context resolution
LangGraph:  + Full agent runtime + Tool registry
```

## 🏗️ Pattern Specifications

### 1. Static Page Agent 🏃‍♂️ **FASTEST**

**Best For:** Simple CRUD operations, settings management, user preferences

**Architecture:**
```typescript
// Next.js app/feature/page.tsx
export default function FeaturePage() {
  const { entitlements } = useEntitlements();

  if (!entitlements.includes('feature_access')) {
    return <UnauthorizedComponent />;
  }

  return <FeatureComponent />;
}
```

**Database Configuration:**
```sql
-- Agent definition
INSERT INTO core.agents (type, name, config) VALUES (
  'static_page',
  'feature_static',
  jsonb_build_object(
    'route', '/feature/path',
    'entitlements', ARRAY['feature_access'],
    'performance_tier', 'high'
  )
);

-- Navigation option
UPDATE core.nav_options SET
  nav_key = 'feature/path',
  agent_id = '<agent_id>'
WHERE id = '<nav_option_id>';
```

**Security:** Page-level entitlement checking + component-level permissions

**Performance Targets:**
- Initial Load: <200ms
- Bundle Size: <50KB
- Lighthouse Score: >95

---

### 2. Direct Schema Agent ⚡ **BALANCED**

**Best For:** Dynamic dashboards, data visualization, configurable UI

**Architecture:**
```typescript
// Agent returns hardcoded schema
const schema = {
  type: 'Dashboard',
  data: await loadDashboardData(),
  config: { layout: 'grid', theme: 'executive' }
};

// Rendered via UniversalSchemaRenderer
<UniversalSchemaRenderer schema={schema} />
```

**Database Configuration:**
```sql
INSERT INTO core.agents (type, name) VALUES (
  'direct',
  'executive_dashboard'
);
```

**Performance Targets:**
- Initial Load: <300ms
- Bundle Size: <150KB
- Widget Count: 5-10 widgets

---

### 3. LLM Agent 🤖 **AI-POWERED**

**Best For:** Content generation, smart responses, contextual features

**Architecture:**
```typescript
// Agent calls Claude with context
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet',
  messages: [{ role: 'user', content: prompt }],
  tools: availableTools
});

return parseSchemaFromResponse(response);
```

**Database Configuration:**
```sql
INSERT INTO core.agents (type, model, tools) VALUES (
  'llm',
  'claude-3-sonnet',
  '["content_tool", "user_data_tool"]'
);
```

**Performance Targets:**
- Initial Load: <800ms
- Response Time: <3s
- Context Resolution: <100ms

---

### 4. LangGraph Agent 🔄 **WORKFLOWS**

**Best For:** Multi-step processes, complex decision trees, orchestrated workflows

**Architecture:**
```python
# LangGraph workflow definition
@workflow
def complex_process(state):
    data = load_data_node(state)
    analysis = analyze_node(data)
    decision = decision_node(analysis)
    return finalize_node(decision)
```

**Database Configuration:**
```sql
INSERT INTO core.agents (type, name, config) VALUES (
  'langgraph',
  'workflow_processor',
  '{"graph_url": "https://langgraph.api/workflow"}'
);
```

**Performance Targets:**
- Workflow Duration: <30s
- Step Response: <5s
- Error Recovery: Automatic

## 🧭 Decision Process

### Step 1: Analyze Feature Requirements

**Questions to Ask:**
1. **Does this feature need AI/LLM processing?**
   - No → Consider Static Page or Direct Schema
   - Yes → Consider LLM or LangGraph

2. **Is this primarily CRUD operations?**
   - Yes → **Static Page** (unless dynamic composition needed)
   - No → Continue evaluation

3. **Does this require multi-step workflows?**
   - Yes → **LangGraph Agent**
   - No → Continue evaluation

4. **How critical is performance?**
   - Critical (SEO, first impression) → **Static Page**
   - Important (dashboards) → **Direct Schema**
   - Moderate (AI features) → **LLM Agent**

### Step 2: Apply Decision Matrix

```
┌─────────────────┬─────────────────┬─────────────────┐
│   SIMPLE        │     DYNAMIC     │    COMPLEX      │
├─────────────────┼─────────────────┼─────────────────┤
│ Static Page     │ Direct Schema   │ LLM Agent       │
│ • Settings      │ • Dashboards    │ • Content Gen   │
│ • Preferences   │ • Analytics     │ • Smart Reply   │
│ • User Profile  │ • Reports       │ • Suggestions   │
└─────────────────┴─────────────────┴─────────────────┘
                            │
                     ┌─────────────────┐
                     │   WORKFLOWS     │
                     ├─────────────────┤
                     │ LangGraph Agent │
                     │ • Multi-step    │
                     │ • Orchestration │
                     │ • Complex Logic │
                     └─────────────────┘
```

### Step 3: Validate Architecture Compliance

**All patterns must:**
- ✅ Integrate with entitlement system
- ✅ Follow security patterns
- ✅ Support tenant isolation
- ✅ Include error handling
- ✅ Provide loading states

## 🔄 Migration Patterns

### Direct Agent → Static Page

**When to Migrate:**
- No AI processing required
- Performance is critical
- CRUD-heavy operations
- Simple user interactions

**Migration Steps:**
1. Create Next.js page at target route
2. Move business logic to API routes
3. Update agent type to `static_page`
4. Set `nav_key` in navigation option
5. Test entitlement integration

### LLM Agent → LangGraph

**When to Migrate:**
- Workflow complexity increases
- Multiple tool coordination needed
- State management required
- Error recovery critical

## 📋 Implementation Checklist

### Static Page Pattern
- [ ] Page created at correct route (`app/[path]/page.tsx`)
- [ ] Entitlement checking implemented
- [ ] API routes follow standard patterns
- [ ] Loading states implemented
- [ ] Error handling added
- [ ] Performance tested (<200ms)

### Direct Schema Pattern
- [ ] Agent returns valid schema structure
- [ ] Widget components registered
- [ ] Schema transformation implemented
- [ ] Data loading optimized
- [ ] Widget interactions working

### LLM Agent Pattern
- [ ] Anthropic integration configured
- [ ] Context resolution working
- [ ] Tool registry populated
- [ ] Response parsing implemented
- [ ] Error handling robust

### LangGraph Pattern
- [ ] Workflow definition created
- [ ] State management implemented
- [ ] Tool coordination working
- [ ] Error recovery tested
- [ ] Performance monitoring active

## 🚨 Anti-Patterns (Avoid These)

❌ **Using LangGraph for simple CRUD**
❌ **Static pages for dynamic content**
❌ **Direct schema for AI workflows**
❌ **LLM agents for simple lookups**
❌ **Mixing patterns in single feature**
❌ **Bypassing entitlement systems**
❌ **Hardcoding business logic in UI**

## 📈 Success Metrics

Track these metrics for each pattern:

**Static Page:**
- Load time < 200ms
- Lighthouse score > 95
- Bundle size minimal

**Direct Schema:**
- Render time < 300ms
- Widget count optimized
- Schema size reasonable

**LLM Agent:**
- Response time < 3s
- Context accuracy > 95%
- Tool success rate > 98%

**LangGraph:**
- Workflow completion < 30s
- Step success rate > 99%
- Error recovery working

## 🎓 Examples in Codebase

### Static Page Examples
- `/context/preferences` - PromptContexts management
- `/user/profile` - User profile settings
- `/tenant/settings` - Tenant configuration

### Direct Schema Examples
- Executive Dashboard - Multi-widget composition
- Progress Tracking - Dynamic charts and metrics
- Content Library - Filterable grid layouts

### LLM Agent Examples
- Content Suggestions - Smart recommendations
- Smart Reply - Context-aware responses
- Analysis Generation - AI-powered insights

### LangGraph Examples
- Onboarding Workflow - Multi-step user setup
- Content Processing - Complex content pipelines
- Decision Trees - Multi-criteria evaluation

---

**Remember:** Choose the simplest pattern that meets your requirements. Performance and maintainability are more important than complexity for its own sake.