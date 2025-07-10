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

## P2 - Debug Logging Cleanup Required

**Issue**: Extensive debugging logs added during authentication flow investigation need cleanup.

**Current State**:
- Multiple components have comprehensive debug logging for authentication troubleshooting
- Console logs include detailed user preferences flow, mounting sequences, and API calls
- Debugging was essential for fixing critical mounting issue but creates noise in production

**Files Affected**:
- `apps/web/components/DynamicTenantPage.tsx` - Extensive component lifecycle logging
- `apps/web/hooks/useUserPreferences.ts` - API call debugging
- `apps/web/app/api/user/[user_id]/preferences/route.ts` - Authentication flow logging
- Various authentication-related components with debug output

**Impact**:
- Console noise in production environment
- Potential performance impact from excessive logging
- User experience may be affected by visible debug output

**Required Cleanup Actions**:
1. Remove or reduce debug logging in `DynamicTenantPage.tsx`
2. Clean up API debugging in user preferences endpoints
3. Remove temporary debugging in authentication hooks
4. Maintain minimal essential logging for error tracking
5. Consider implementing conditional debug logging based on environment

**Priority**: P2 - Should be cleaned up after major features/refactors complete

---

## P2 - HTTP Method Conventions Compliance Audit (ADR-0026)

**Issue**: Comprehensive audit and remediation of API endpoints to comply with new HTTP method conventions established in ADR-0026.

**Current State**:
- ADR-0026 established hybrid agent-native HTTP method conventions
- Context preferences API partially updated (POST → PATCH for single updates)
- 50+ API endpoints need systematic review for compliance
- TypeScript types and validation utilities created but not fully integrated

**Scope of Work**:
1. **Systematic Endpoint Audit**: Review all API endpoints against ADR-0026 conventions
2. **Method Corrections**: Update endpoints using incorrect HTTP methods
3. **Client-Side Updates**: Update frontend code to use correct HTTP methods
4. **Validation Integration**: Integrate TypeScript validation utilities
5. **Documentation Updates**: Update API documentation to reflect new conventions

**Files Requiring Audit**:
- All files in `apps/web/app/api/` directory (50+ endpoints)
- Frontend API client code in `apps/web/lib/apiClient/`
- Hook implementations using API endpoints
- Component code making direct API calls

**Implementation Plan**:
1. **Phase 1**: Complete audit of all existing endpoints
2. **Phase 2**: Create migration plan with priority order
3. **Phase 3**: Gradual migration during normal development cycles
4. **Phase 4**: Integration testing and validation

**Success Criteria**:
- [ ] All API endpoints follow ADR-0026 conventions
- [ ] TypeScript validation integrated and passing
- [ ] Client-side code updated to use correct methods
- [ ] Documentation reflects new conventions
- [ ] No breaking changes for existing functionality

**Priority**: P2 - Should be addressed as dedicated sprint work after critical features complete

**Related Work**:
- ADR-0026: HTTP Method Conventions for API Endpoints
- TypeScript types created in `apps/web/lib/types/api.ts`
- Context preferences API partially updated

---

## Documentation Standards

- All regressions must include impact assessment
- Security regressions are automatically P0 priority
- Include specific file paths and technical details
- Document both current broken state and required fix
- Update this document as regressions are discovered or resolved