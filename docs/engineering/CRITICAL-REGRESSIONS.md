# CRITICAL REGRESSIONS - IMMEDIATE ATTENTION REQUIRED

## 🚨 REGRESSION: Admin Scope Permissions Lost

**Status**: CRITICAL SECURITY ISSUE
**Priority**: P0 - Must fix before any production use
**Date Identified**: January 2025

### Problem
The entitlement management system has regressed from proper scope-based admin permissions back to simple `isAdmin` checks. This is a **SECURITY VULNERABILITY**.

### Current Broken State
```typescript
// BROKEN: Only checks if user is any kind of admin
const isAdmin = adminLevel !== 'none';
if (!isAdmin) { return error; }
```

### Required Fix
```typescript
// CORRECT: Should check scope-based permissions
const canManageUser = await checkAdminScope(currentUser, targetUserId, adminLevel);
if (!canManageUser) { return error; }
```

### Admin Scope Requirements
1. **i49_super_admin**: Can manage all users across all tenants
2. **platform_admin**: Can manage users within their platform/tenant only
3. **tenant_admin**: Can manage users within their tenant instance only
4. **account_admin**: Can manage users within their account/organization only

### Impact
- Account admins can currently see/modify entitlements of users in OTHER accounts
- Tenant admins can see/modify users across different tenants
- Major data isolation breach

### Files Affected
- `apps/web/app/api/copilotkit/route.ts` - Lines with `isAdmin` checks
- `apps/web/app/api/admin/entitlements/list/route.ts` - Admin permission logic
- `apps/web/app/api/admin/entitlements/update/route.ts` - Update permission logic
- `packages/agent-core/tools/EntitlementTool.ts` - Should validate scope before operations

### Action Required
1. **IMMEDIATE**: Add scope validation to all entitlement endpoints
2. Implement `checkAdminScope()` function with proper database queries
3. Test all admin permission combinations
4. Add comprehensive scope-based tests

**DO NOT DEPLOY TO PRODUCTION WITHOUT FIXING THIS**