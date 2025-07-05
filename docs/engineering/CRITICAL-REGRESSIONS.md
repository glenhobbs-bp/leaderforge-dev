# CRITICAL REGRESSIONS

This document tracks critical regressions that must be addressed before production deployment.

## P0 - CRITICAL SECURITY REGRESSION: Admin Scope Permissions

**Issue**: The system has regressed from proper scope-based admin permissions back to simple `isAdmin` checks.

**Previous Implementation**:
- Proper scope-based permissions (is_super_admin, platform_admin, tenant_admin, account_admin)
- Account admins could only manage users within their specific account/tenant
- Clear separation of admin levels and their allowed operations

**Current Broken State**:
- Simple boolean `isAdmin` checks throughout the codebase
- Account admins can potentially manage users across different accounts
- No scope validation for admin operations

**Security Impact**:
- **CRITICAL** - Account admins could manage users outside their authorized scope
- Potential data breach if account admin gains access to other accounts' users
- Violation of multi-tenant security boundaries

**Files Affected**:
- All admin-related API endpoints
- Entitlement management system
- User management interfaces
- Permission checking utilities

**Required Fix**:
1. Restore scope-based admin permission system
2. Implement proper tenant/account boundary checks
3. Audit all admin operations for scope validation
4. Add comprehensive tests for admin permission boundaries

**Priority**: P0 - MUST BE FIXED BEFORE PRODUCTION

---

## P1 - CopilotKit Inconsistent AI Responses

**Issue**: CopilotKit AI provides inconsistent and sometimes contradictory responses for entitlement management.

**Current Behavior**:
- Entitlement form loads and functions correctly (✅ WORKING)
- API calls successful, data loads properly (✅ WORKING)
- User can manipulate entitlements via checkboxes (✅ WORKING)
- **BUT**: AI responses below the form are inconsistent:
  - Sometimes: Appropriate response acknowledging the form
  - Sometimes: "It seems there was an issue retrieving the information. Please try again later"
  - Sometimes: "To view your entitlements, please check the interactive checkbox list that should now be available to you"

**Root Cause**:
- Two separate systems running simultaneously:
  1. **Form System** (working correctly) - EntitlementCheckboxForm with direct API calls
  2. **CopilotKit AI** (inconsistent) - AI trying to interpret entitlement requests independently

**Impact**:
- Confusing user experience with contradictory messages
- Users may think the system is broken when it's actually working
- Undermines confidence in the entitlement management system

**Technical Details**:
- Form successfully loads 24 entitlements
- API calls return 200 status codes
- Data manipulation works correctly
- Issue is purely with AI response generation, not functionality

**Required Fix**:
1. Ensure CopilotKit AI understands when the form is successfully rendered
2. Standardize AI responses for entitlement management actions
3. Prevent AI from generating error messages when form is working
4. Consider consolidating entitlement management to single approach

**Priority**: P1 - Should be fixed before production for optimal UX

---

## Documentation Standards

- All regressions must include impact assessment
- Security regressions are automatically P0 priority
- Include specific file paths and technical details
- Document both current broken state and required fix
- Update this document as regressions are discovered or resolved