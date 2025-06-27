# Architecture Compliance Checklist

**Purpose:** Periodic review checklist to ensure architectural integrity and prevent technical debt accumulation
**Owner:** Senior Engineering Team
**Review Frequency:** Weekly (development) / Monthly (maintenance)
**Last Updated:** 2025-06-26

---

## 🏗️ **Agent-Native Architecture Compliance**

### **Agent Orchestration**
- [ ] All business logic orchestrated by agents, not hardcoded in UI/API
- [ ] No business rules embedded in frontend components
- [ ] API routes are thin - only invoke agents and return schemas
- [ ] Agent decisions drive all content composition and user flows
- [ ] Multi-step workflows handled by agent state management (LangGraph)

### **Schema-Driven UI**
- [ ] Frontend renders only what's described in agent schemas
- [ ] No hardcoded UI logic or business rules in components
- [ ] All dynamic content comes from agent responses
- [ ] UI components are generic and configurable via schema
- [ ] Theme and styling managed as configuration, not hardcoded

### **Tool Modularity**
- [ ] Tools are stateless, context-aware backend helpers
- [ ] No UI logic embedded in tools
- [ ] No cross-module dependencies in tools
- [ ] Tools are reusable across different agents
- [ ] Tool registry properly maintained and versioned

---

## 🔐 **Authentication & Authorization**

### **SSR-First Authentication**
- [ ] All authentication uses server-side rendering patterns
- [ ] No client-side auth mixing with server-side patterns
- [ ] Consistent `createAuthenticatedSupabaseClient()` usage across services
- [ ] Session hydration follows standard cookie extraction pattern
- [ ] No mixed authentication approaches causing session mismatches

### **Entitlement Enforcement**
- [ ] All content access filtered by user entitlements
- [ ] Agents operate only within user's entitled scope
- [ ] No entitlement bypass in "quick fixes"
- [ ] Organization-level entitlements properly cascaded
- [ ] Entitlement caching strategy consistently applied

### **Security Patterns**
- [ ] No hardcoded user IDs or bypass mechanisms
- [ ] All database access goes through authenticated clients
- [ ] Service role usage limited to system operations only
- [ ] RLS policies enforced at database level
- [ ] No authentication tokens exposed to client-side

---

## 🎯 **Separation of Concerns**

### **API Route Purity**
- [ ] API routes contain no business logic
- [ ] Routes only: receive intent → invoke agent → return schema
- [ ] No database access in API route handlers
- [ ] No tool calls directly from API routes
- [ ] Error handling delegated to service layer

### **Service Layer Boundaries**
- [ ] Services handle single domain responsibility
- [ ] No cross-service direct database access
- [ ] Consistent authentication patterns across all services
- [ ] Service methods are pure functions where possible
- [ ] Inter-service communication through defined interfaces

### **Component Responsibilities**
- [ ] UI components purely presentational
- [ ] Business logic extracted to services/agents
- [ ] State management follows established patterns
- [ ] No API calls embedded in UI components
- [ ] Hooks handle data fetching, not business rules

---

## 📊 **Data Access Patterns**

### **Database Access Consistency**
- [ ] All data access through established service layer
- [ ] No direct Supabase client usage in components
- [ ] Repository pattern followed consistently
- [ ] No ORM bypass or ad-hoc queries
- [ ] Schema access properly validated (`core.`, `public.`)

### **Caching Strategy**
- [ ] Consistent caching patterns across services
- [ ] Cache invalidation properly handled
- [ ] No stale data served to users
- [ ] Performance-critical paths properly cached
- [ ] Cache keys follow naming conventions

---

## 🎨 **UI & Component Architecture**

### **Layout Consistency**
- [ ] NavPanel + ContentPanel layout pattern maintained
- [ ] CopilotKit integration uses pure API (no modifications)
- [ ] No custom layouts that break established patterns
- [ ] Mobile responsiveness follows design system
- [ ] Theme system consistently applied

### **Component Modularity**
- [ ] Components broken into composable parts
- [ ] No monolithic components exceeding complexity thresholds
- [ ] Component registry properly maintained
- [ ] Universal schema compliance across components
- [ ] No direct component imports (use registry)

### **Universal Registry-Driven System (Critical)**
- [ ] UniversalSchemaRenderer requires ZERO modification when adding new widgets
- [ ] New widgets can be registered and immediately discoverable/usable
- [ ] All widget-specific logic contained within the widget registry
- [ ] No hardcoded widget types in universal rendering components
- [ ] Schema transformation handled entirely by registry/dispatcher layer

### **Schema-Props Boundary Compliance (ADR-0009)**
- [ ] Widget schemas contain only agent-controllable properties
- [ ] Component props contain only implementation details
- [ ] No schema properties duplicated in component props
- [ ] Schema-to-props transformation functions implemented
- [ ] Components receive transformed props, not raw schemas
- [ ] Agent-controllable properties NOT hardcoded in components
- [ ] Framework-specific concerns NOT exposed in schemas
- [ ] Universal schema structure followed consistently

### **Design System Adherence**
- [ ] Color palette consistently applied
- [ ] Typography hierarchy maintained
- [ ] Spacing system followed (Tailwind utilities)
- [ ] Animation/transition standards applied
- [ ] Accessibility standards met

---

## 🔄 **Agent-Native Composition**

### **Modular Monolith Structure**
- [ ] Components in registry, not microservices
- [ ] Agent-discoverable component system maintained
- [ ] No hardcoded component compositions
- [ ] Universal schema compliance enforced
- [ ] Component versioning strategy followed

### **Agent Communication**
- [ ] Agents use established communication patterns
- [ ] No direct agent-to-agent calls bypassing orchestration
- [ ] State management through LangGraph where appropriate
- [ ] Agent context properly scoped and managed
- [ ] Tool usage follows established patterns

---

## 📁 **File & Documentation Standards**

### **File Header Requirements**
- [ ] All files include standardized header comments
- [ ] Purpose, Owner, and Tags properly specified
- [ ] Modified files have updated headers
- [ ] File manifest updated after significant changes
- [ ] Documentation reflects current implementation

### **Code Organization**
- [ ] Directory structure follows established patterns
- [ ] Related functionality properly grouped
- [ ] No circular dependencies
- [ ] Import/export patterns consistent
- [ ] Type definitions centrally managed

---

## 🚀 **Performance & Scalability**

### **Query Optimization**
- [ ] N+1 queries eliminated
- [ ] Batch operations used where appropriate
- [ ] Database indexes support query patterns
- [ ] Connection pooling properly configured
- [ ] Query performance monitoring in place

### **Frontend Performance**
- [ ] Bundle size within acceptable limits
- [ ] Code splitting implemented for large features
- [ ] Image optimization following standards
- [ ] Lazy loading applied appropriately
- [ ] Core Web Vitals meet targets

---

## 🔍 **Observability & Debugging**

### **Logging Standards**
- [ ] Consistent logging patterns across services
- [ ] Agent runs observable in LangSmith
- [ ] Error tracking properly implemented
- [ ] Performance monitoring in place
- [ ] Debug information sufficient for troubleshooting

### **Development Tools**
- [ ] TypeScript strict mode enabled
- [ ] Linting rules consistently applied
- [ ] Testing coverage meets standards
- [ ] Development environment automation working
- [ ] Session management scripts functioning

---

## 🔧 **Registry-Driven Development Workflow**

### **Adding New Widgets (Must Follow)**
1. **Widget Implementation** - Create widget component with proper TypeScript interfaces
2. **Registry Registration** - Add widget to WidgetRegistry with transformation functions
3. **Schema Definition** - Define Universal Widget Schema structure for the widget
4. **Testing** - Verify widget works through agent-generated schemas
5. **Documentation** - Update widget registry documentation

### **Forbidden Practices**
- ❌ **Never modify UniversalSchemaRenderer** for new widget types
- ❌ **Never add widget-specific imports** to universal components
- ❌ **Never hardcode widget logic** outside the registry
- ❌ **Never bypass schema transformation** layer
- ❌ **Never create widget-specific rendering paths** in universal components

### **Registry-First Principles**
- ✅ **All widget discovery** happens through registry APIs
- ✅ **All schema transformation** happens in registry layer
- ✅ **All widget routing** happens through dispatcher pattern
- ✅ **All new functionality** accessible immediately after registration
- ✅ **All rendering logic** contained within individual widget components

---

## 📋 **Review Process**

### **Weekly Development Review**
1. **New Features** - Verify compliance with all checklist items
2. **Technical Debt** - Identify and prioritize architectural drift
3. **Performance** - Review metrics and identify bottlenecks
4. **Security** - Audit authentication and authorization patterns
5. **Documentation** - Update architecture decisions and patterns

### **Monthly Maintenance Review**
1. **Dependency Audit** - Update and security review
2. **Schema Evolution** - Database and API schema changes
3. **Performance Baseline** - Establish new benchmarks
4. **Tool Registry** - Cleanup and optimization
5. **Training** - Team knowledge sharing on patterns

---

## ⚠️ **Red Flags - Immediate Escalation Required**

### **Architecture Violations**
- ❌ Business logic in API routes or UI components
- ❌ Mixed authentication patterns
- ❌ Direct database access bypassing service layer
- ❌ Hardcoded configurations or entitlement bypasses
- ❌ Cross-module coupling
- ❌ Schema-props boundary violations (ADR-0009)
- ❌ Components accessing raw schemas instead of transformed props
- ❌ Agent-controllable properties hardcoded in component logic
- ❌ UniversalSchemaRenderer modified to support new widget types
- ❌ Widget-specific transformation logic outside the registry
- ❌ Hardcoded widget type handling in universal components

### **Performance Issues**
- ❌ API response times > 2 seconds
- ❌ Bundle size increases > 20%
- ❌ Database query time > 500ms
- ❌ Memory leaks in long-running processes
- ❌ Unhandled error rates > 1%

### **Security Concerns**
- ❌ Authentication tokens in client-side code
- ❌ Entitlement enforcement bypassed
- ❌ RLS policies not enforced
- ❌ Service role keys exposed
- ❌ Unvalidated user input

---

## 📝 **Compliance Scoring**

### **Scoring System**
- **Green (90-100%)** - Excellent architectural compliance
- **Yellow (70-89%)** - Minor issues, plan improvements
- **Red (<70%)** - Architectural debt, immediate action required

### **Review Documentation**
- Date of review: `_____________`
- Reviewer(s): `_____________`
- Overall score: `_____________`
- Action items: `_____________`
- Next review date: `_____________`

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- Zero mixed authentication patterns
- 100% schema-driven UI implementation
- <2 second API response times
- Zero hardcoded business logic in routes
- 100% entitlement enforcement coverage
- 100% registry-driven widget system (no universal renderer modifications)
- Zero widget-specific code outside the registry layer

### **Development Metrics**
- Weekly compliance score trend
- Time to implement new features
- Technical debt reduction rate
- Team adherence to patterns
- Architecture decision documentation completeness

---

**Remember:** This checklist is a living document. Update it as our architecture evolves and new patterns emerge. The goal is maintaining architectural integrity while enabling rapid, safe development.