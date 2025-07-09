# DynamicTenantPage Performance & Architecture Refactor Plan

**Status**: Planning → Implementation
**Priority**: Critical (Performance bottleneck for 100k+ static page users)
**Estimated Timeline**: 3 sprints (4 weeks total)

## 🚨 **Critical Issues Identified**

### 1. Performance Bottleneck
- **Current**: Static pages load in ~580ms (7x slower than 80ms target)
- **Root Cause**: Monolithic orchestrator executes full auth/preferences/navigation pipeline for all page types
- **Impact**: Poor user experience for high-traffic static pages

### 2. Non-Atomic Widget Architecture
- **Current**: Widget action handlers hardcoded in DynamicTenantPage switch statement
- **Root Cause**: Violates modularity - widget logic scattered across core orchestrator
- **Impact**: Adding widgets requires modifying core files, exponential maintenance complexity

### 3. Hard-Coded Configuration
- **Current**: `contextNames` bypasses database `core.tenants.display_name`
- **Root Cause**: Uses deprecated "context" terminology instead of "tenant"
- **Impact**: Cannot add tenants dynamically, configuration drift

## 📋 **Implementation Plan**

### **Phase 1: Immediate Fixes (2 days)**
*Target: Stop architectural drift, establish foundation*

#### **1.1 Replace Hard-Coded contextNames** ⏳
- **Goal**: Use database `display_name` instead of hard-coded mapping
- **Files**: `DynamicTenantPage.tsx`
- **Test Point**: Welcome schema shows correct tenant display names
- **Risk**: Low (simple data source change)

#### **1.2 Extract Widget Action Registry** ⏳
- **Goal**: Move widget handlers from switch statement to registry pattern
- **Files**:
  - Create: `packages/widget-core/ActionRegistry.ts`
  - Modify: `DynamicTenantPage.tsx`
- **Test Point**: All existing widget actions (video, worksheet, progress) work unchanged
- **Risk**: Medium (requires careful handler extraction)

#### **1.3 Add Performance Monitoring** ⏳
- **Goal**: Measure current performance to validate improvements
- **Files**: Create performance monitoring utilities
- **Test Point**: Performance metrics logged for each agent type
- **Risk**: Low (monitoring only, no behavior changes)

### **Phase 2: Static Page Performance Optimization (1 week)**
*Target: Achieve 80ms static page load time*

#### **2.1 Create StaticPageRenderer** ⏳
- **Goal**: Bypass orchestration overhead for static pages
- **Files**:
  - Create: `components/StaticPageRenderer.tsx`
  - Modify: `DynamicTenantPage.tsx` (early return for static pages)
- **Test Point**: Static pages load in ~80ms, maintain full functionality
- **Risk**: Medium (requires careful auth/routing preservation)

#### **2.2 Implement Progressive Enhancement** ⏳
- **Goal**: Fast initial render, async feature loading
- **Strategy**: Render static content immediately, hydrate navigation/preferences async
- **Test Point**: Perceived 80ms load, full features in 300ms
- **Risk**: Medium (complex state management)

#### **2.3 Performance Gates** ⏳
- **Goal**: Prevent performance regressions in CI/CD
- **Files**: Add build-time performance validation
- **Test Point**: Build fails if performance targets exceeded
- **Risk**: Low (validation only)

### **Phase 3: Comprehensive Refactoring (2 weeks)**
*Target: Modular, maintainable architecture*

#### **3.1 Break Down DynamicTenantPage** ⏳
- **Goal**: Split 1,229-line monolith into focused components
- **Components**:
  - `AuthenticationGuard.tsx` (~200 lines)
  - `UserPreferencesManager.tsx` (~300 lines)
  - `NavigationOrchestrator.tsx` (~400 lines)
  - `ContentRenderer.tsx` (~200 lines)
  - `ModalManager.tsx` (~129 lines)
- **Test Point**: All functionality preserved, improved maintainability
- **Risk**: High (major architectural change)

#### **3.2 Agent-Native Architecture** ⏳
- **Goal**: Conditional feature loading based on agent type
- **Files**: Create `LayoutOrchestrator.tsx` with agent-specific feature sets
- **Test Point**: Bundle size reduced 15-30%, performance improved across all agent types
- **Risk**: High (complex conditional loading)

#### **3.3 Comprehensive Performance Monitoring** ⏳
- **Goal**: Real-time performance tracking and alerting
- **Features**: Dashboard, automated alerts, performance budgets
- **Test Point**: Full observability into performance by agent type
- **Risk**: Low (monitoring infrastructure)

## 🎯 **Performance Targets**

| Agent Type | Current | Target | Improvement |
|------------|---------|--------|-------------|
| Static Page | 580ms | 80ms | 86% |
| Direct Schema | 400ms | 200ms | 50% |
| LLM Agent | 600ms | 600ms | 0% (acceptable) |
| LangGraph | 1200ms | 1200ms | 0% (acceptable) |

## 🧪 **Testing Strategy**

### **Unit Testing**
- Widget action registry functionality
- Performance monitoring utilities
- Static page renderer components

### **Integration Testing**
- Full user workflows for each agent type
- Performance under load (100+ concurrent users)
- Progressive enhancement state transitions

### **Performance Testing**
- Load time measurements for each phase
- Bundle size analysis
- Memory usage profiling

## 📊 **Success Metrics**

### **Immediate (Phase 1)**
- ✅ Zero hard-coded tenant configurations
- ✅ Widget actions abstracted from core orchestrator
- ✅ Performance baseline established

### **Short-term (Phase 2)**
- ✅ Static pages load in <100ms (target 80ms)
- ✅ No functionality regressions
- ✅ Performance gates prevent regressions

### **Medium-term (Phase 3)**
- ✅ DynamicTenantPage <500 lines (from 1,229)
- ✅ 15-30% bundle size reduction
- ✅ Linear widget complexity scaling

## ⚠️ **Risk Mitigation**

### **High-Risk Changes**
- **Phase 3.1**: Large architectural refactor
- **Mitigation**: Feature flags, gradual rollout, comprehensive testing
- **Rollback Plan**: Keep original DynamicTenantPage as fallback

### **Performance Regressions**
- **Risk**: Optimization attempts could slow other agent types
- **Mitigation**: Performance gates, comprehensive benchmarking
- **Monitoring**: Real-time alerts for performance degradation

### **Breaking Changes**
- **Risk**: Widget action registry could break existing widgets
- **Mitigation**: Backward compatibility layer, thorough testing
- **Validation**: All existing actions must work unchanged

## 📅 **Timeline**

### **Sprint 1 (Week 1)**
- Days 1-2: Phase 1 implementation
- Days 3-5: Phase 2.1 Static page renderer

### **Sprint 2 (Week 2)**
- Days 1-3: Phase 2.2 Progressive enhancement
- Days 4-5: Phase 2.3 Performance gates

### **Sprint 3 (Weeks 3-4)**
- Week 3: Phase 3.1 Component breakdown
- Week 4: Phase 3.2 Agent-native architecture

## 🔄 **Continuous Validation**

- **After each phase**: Performance regression testing
- **Before each sprint**: Architectural review checkpoint
- **Weekly**: Performance metrics review
- **End of project**: Full architectural compliance audit

---

**Next Steps**: Begin Phase 1.1 - Replace hard-coded contextNames with database values