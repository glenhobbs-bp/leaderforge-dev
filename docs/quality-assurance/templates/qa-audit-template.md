# QA-XXXX: [Feature/Component Name] Audit

**Date:** YYYY-MM-DD
**Auditor:** [QA Engineer Name]
**Status:** 🔄 IN PROGRESS | 🟢 PASS | 🟡 CONDITIONAL PASS | ⚠️ CONDITIONAL PASS WITH BLOCKERS | 🔴 FAIL
**Feature:** [Brief description of what was audited]

## Executive Summary

[High-level summary of findings, key issues, and recommendations]

## Audit Scope

- **Feature:** [Specific feature or component tested]
- **Components:** [List of components, services, APIs involved]
- **Test Environment:** [Development/Staging/Production environment details]
- **User Context:** [Test user details, permissions, entitlements]
- **Test Duration:** [How long the audit took]
- **Test Coverage:** [What was and wasn't tested]

## Test Results

### ✅ **PASSED - Core Functionality**

1. **[Functionality Area 1]**
   - ✅ [Specific test case 1]
   - ✅ [Specific test case 2]
   - ✅ [Specific test case 3]

2. **[Functionality Area 2]**
   - ✅ [Specific test case 1]
   - ✅ [Specific test case 2]

### 🚨 **FAILED - Critical Issues**

#### 1. **[Issue Name]** - [SEVERITY]
```
[Error message or evidence]
```
- **Severity:** 🔴 CRITICAL | 🟡 HIGH | 🟠 MEDIUM | 🟢 LOW
- **Impact:** [Description of impact on users/system]
- **Risk Level:** [DEPLOYMENT BLOCKER | ARCHITECTURAL VIOLATION | TECHNICAL DEBT | etc.]

#### 2. **[Issue Name]** - [SEVERITY]
```
[Error message or evidence]
```
- **Severity:** [Level]
- **Impact:** [Description]
- **Risk Level:** [Assessment]

## Performance Analysis

- **[Metric 1]:** [Value] ([acceptable/concerning/critical])
- **[Metric 2]:** [Value] ([assessment])
- **[Metric 3]:** [Value] ([assessment])
- **Memory Usage:** [Assessment]
- **Response Times:** [Assessment]

## Architectural Compliance Assessment

| Principle | Status | Notes |
|-----------|---------|-------|
| Agent-Native Orchestration | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Details] |
| Schema-Driven UI | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Details] |
| Database-Driven Navigation | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Details] |
| Separation of Concerns | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Details] |
| SSR Authentication | ✅ PASS / ⚠️ PARTIAL / ❌ FAIL | [Details] |

## Code Quality Issues

### Dead Code Detection
- [List any unused imports, variables, functions, files found]

### Logic Inconsistencies
- [List any contradictory business rules or logic issues]

### Error Handling
- [Assessment of error handling coverage and quality]

### Type Safety
- [TypeScript usage, any type violations]

## Security Assessment

- [Authentication checks]
- [Authorization verification]
- [Data protection validation]
- [Input validation testing]
- [Session management review]

## Production Readiness

### Quality Gates Status
- [ ] **Architecture:** [%] - [Notes]
- [ ] **Performance:** [%] - [Notes]
- [ ] **Security:** [%] - [Notes]
- [ ] **Code Quality:** [%] - [Notes]
- [ ] **Testing:** [%] - [Notes]

### Deployment Readiness: ✅ READY | ⚠️ CONDITIONAL | ❌ BLOCKED

## Required Actions

### 🔴 **CRITICAL - Must Fix Before Deployment**

1. **[Action Item 1]**
   - **Action:** [Specific steps needed]
   - **Owner:** [Team/Person responsible]
   - **Timeline:** [Deadline]
   - **Verification:** [How to confirm fix]

### 🟡 **HIGH - Address in Next Iteration**

2. **[Action Item 2]**
   - **Action:** [Specific steps needed]
   - **Owner:** [Team/Person responsible]
   - **Timeline:** [Deadline]
   - **Verification:** [How to confirm fix]

### 🟠 **MEDIUM - Technical Debt**

3. **[Action Item 3]**
   - **Action:** [Specific steps needed]
   - **Owner:** [Team/Person responsible]
   - **Timeline:** [Deadline]
   - **Verification:** [How to confirm fix]

## Test Evidence

### [Evidence Category 1]
```
[Log entries, screenshots, metrics, or other evidence]
```

### [Evidence Category 2]
```
[Additional evidence]
```

## Recommendations

1. **Immediate:** [Actions needed right now]
2. **Short-term:** [Actions for next sprint/iteration]
3. **Long-term:** [Architectural or process improvements]

## Sign-Off

- **QA Assessment:** [Final assessment]
- **Deployment Recommendation:** [Ready/Conditional/Blocked]
- **Next Review:** [When to re-assess]
- **Stakeholder Approval:** [If applicable]

---

**Audit Trail:**
- [Date]: [Action taken]
- [Date]: [Status update]
- [Date]: [Resolution/completion]