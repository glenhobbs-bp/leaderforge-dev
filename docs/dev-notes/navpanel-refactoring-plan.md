# NavPanel Component Refactoring Plan & Specification

## Overview
This document outlines the comprehensive refactoring plan for the `NavPanel` component (`apps/web/components/ui/NavPanel.tsx`) to address critical security, performance, and architectural compliance issues by implementing **database-driven navigation**.

## 🎯 New NavPanel Component Specification

### Core Requirements
1. **Database-Driven Navigation**: Replace arbitrary `navSchema` props with `nav_options` table queries
2. **Preserve Current Styling**: Maintain exact visual appearance, collapse/expand behavior, and UX
3. **Section-Based Organization**: Support sections with `section` and `section_order` from database
4. **Ungrouped Fallback**: Show items without sections in ungrouped format (current behavior)
5. **Entitlement Filtering**: Only show navigation items user is entitled to access

### Database Schema Integration

The component will consume data from the `nav_options` table:

```sql
-- Navigation options table structure (reference)
CREATE TABLE core.nav_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_key TEXT REFERENCES core.context_configs(context_key) ON DELETE CASCADE,
  nav_key TEXT NOT NULL,           -- Unique identifier for navigation item
  label TEXT NOT NULL,             -- Display text
  icon TEXT,                       -- Icon name (Lucide icons)
  href TEXT,                       -- Route/URL
  section TEXT,                    -- Section grouping (optional)
  order INTEGER DEFAULT 0,        -- Order within section
  section_order INTEGER DEFAULT 0, -- Order of sections themselves
  required_entitlements TEXT[],    -- Array of required entitlement IDs
  agent_id UUID,                   -- Optional agent reference
  description TEXT,                -- Optional description
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Navigation Transformation Logic

```typescript
// Transform database nav_options to NavPanelSchema
function transformNavOptionsToSchema(navOptions: NavOption[]): NavPanelSchema {
  // 1. Group by section
  const sectionMap = new Map<string, NavOption[]>();

  navOptions.forEach((option) => {
    const sectionKey = option.section || 'default';
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, []);
    }
    sectionMap.get(sectionKey)!.push(option);
  });

  // 2. Sort sections by section_order
  const sectionOrders = new Map<string, number>();
  navOptions.forEach((option) => {
    const sectionKey = option.section || 'default';
    if (!sectionOrders.has(sectionKey)) {
      sectionOrders.set(sectionKey, option.section_order || 0);
    }
  });

  const sortedSections = Array.from(sectionOrders.entries())
    .sort(([,orderA], [,orderB]) => orderA - orderB);

  // 3. Build sections array
  const sections = sortedSections.map(([sectionKey]) => {
    const items = sectionMap.get(sectionKey) || [];

    // Sort items within section by order
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
      title: sectionKey === 'default' ? null : sectionKey.toUpperCase(),
      items: items.map(option => ({
        id: option.nav_key,
        label: option.label,
        icon: option.icon,
        href: option.href,
        description: option.description
      }))
    };
  });

  return {
    type: "NavPanel",
    props: {
      header: { greeting: "Welcome back" },
      sections,
      footer: {
        actions: [{
          label: 'Sign Out',
          action: 'signOut',
          icon: 'log-out'
        }]
      }
    }
  };
}
```

### Component Interface Changes

```typescript
// NEW: Database-driven interface
interface NavPanelProps {
  contextKey: string;              // Drives database query
  contextOptions?: ContextOption[];
  contextValue?: string;
  onContextChange?: (id: string) => void;
  onNavSelect?: (navOptionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string | null;
  // REMOVED: navSchema prop (replaced by database query)
}

// Usage pattern changes from:
// <NavPanel navSchema={arbitrarySchema} contextValue="brilliant" />
// To:
// <NavPanel contextKey="brilliant" userId={user.id} />
```

### Styling & UX Preservation

**CRITICAL**: All current styling, layout, animations, and behaviors must be preserved:

✅ **Preserve These Exactly**:
- Collapse/expand animation and state management
- Section title styling (`text-[10px] font-normal uppercase tracking-widest text-gray-400`)
- Navigation item hover/active states
- Icon positioning and sizing
- Scrollbar styling (`custom-scrollbar`)
- Avatar loading states and caching
- Footer positioning and actions
- Tooltips in collapsed mode
- Context selector dropdown
- All CSS classes and responsive behavior

✅ **Current Layout Structure**:
```tsx
// Maintain exact same JSX structure:
<div className="flex flex-col h-full bg-white border-r border-gray-200">
  {/* Header with greeting and avatar */}
  {/* Context selector */}
  {/* Navigation sections */}
  <div className="flex-1 overflow-y-auto px-1 py-1 space-y-4 custom-scrollbar">
    {sections.map((section, idx) => (
      <div key={section.title || `section-${idx}`} className="mb-0.5">
        {section.title && !isCollapsed && (
          <div className="text-[10px] font-normal uppercase tracking-widest text-gray-400 mb-1 pl-2 select-none">
            {section.title}
          </div>
        )}
        {/* Navigation items */}
      </div>
    ))}
  </div>
  {/* Footer */}
</div>
```

### Error Handling & Loading States

```typescript
export function useNavigation(contextKey: string) {
  const { navOptions, loading, error } = useNavOptions(contextKey);

  // Transform to schema with proper error handling
  const navSchema = useMemo(() => {
    if (error) {
      // Fallback to minimal navigation on database errors
      return createFallbackNavSchema();
    }

    if (!navOptions || loading) {
      return null; // Show loading state
    }

    return transformNavOptionsToSchema(navOptions);
  }, [navOptions, loading, error]);

  return { navSchema, loading, error };
}
```

### Authentication Integration

```typescript
// Extracted auth service (already implemented)
import { authService } from '../app/lib/authService';

// In NavPanel component:
const handleFooterAction = async (action: string) => {
  if (action === 'signOut') {
    try {
      await authService.signOut(supabase);
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error('Sign out failed:', error);
      // Show error toast
    }
  }
};
```

## 🚨 Critical Issues Status

### 1. Avatar Reload Performance Issue
- **Status**: ✅ **COMPLETED** - Global avatar caching implemented

### 2. Architectural Non-Compliance (HIGH PRIORITY)
- **Problem**: Component violates simplified entitlement system principles
- **Status**: 🔄 **IN PROGRESS** - Database-driven approach ready for implementation
- **Solution**: Replace `navSchema` prop with `contextKey` prop and database queries

### 3. React Key Prop Errors
- **Status**: ✅ **COMPLETED** - Fixed with globally unique keys

### 4. Route Conflicts
- **Status**: ✅ **COMPLETED** - Cleaned up conflicting dynamic routes

## 📋 Implementation Plan

### Phase 1: Database-Driven Navigation (Current Focus)

#### Step 1: Update NavPanel Component Interface
- Remove `navSchema` prop from `NavPanelProps`
- Add `contextKey` prop for database queries
- Update component to use `useNavigation` hook

#### Step 2: Implement Navigation Hook
- ✅ `useNavigation` hook created
- ✅ Transformation logic implemented
- ✅ Error handling and loading states

#### Step 3: Update NavPanel Implementation
- Replace prop-based navigation with hook-based approach
- Preserve all existing styling and behavior
- Add proper loading and error states
- Test section ordering and ungrouped fallback

#### Step 4: Update All NavPanel Usages
- Remove `navSchema` props from all parent components
- Update to use `contextKey` approach
- Verify entitlement filtering works correctly

### Phase 2: Authentication Service Integration
- ✅ `authService` implemented
- Integrate with NavPanel footer actions
- Remove inline Supabase auth logic

### Phase 3: Testing & Validation
- Test section ordering with database data
- Verify ungrouped items display correctly
- Test entitlement filtering
- Validate all styling preserved
- Performance testing

## 🎯 Success Criteria

✅ **Security**: Navigation options are filtered by user entitlements
✅ **Architecture**: No arbitrary `navSchema` props - all navigation from database
✅ **Sections**: Support for grouped sections with proper ordering
✅ **Fallback**: Ungrouped display when sections not defined
✅ **Styling**: Exact preservation of current visual design and behavior
✅ **Performance**: Proper caching and loading states
✅ **Maintainability**: Clean separation between UI and business logic

## 📊 Risk Assessment

| Risk Level | Issues | Impact |
|------------|---------|---------|
| 🔴 **High** | Entitlement bypass, unauthorized access | Security vulnerability |
| 🟡 **Medium** | Styling regressions during refactor | User experience |
| 🟢 **Low** | Code maintainability, future scaling | Development efficiency |

## ✅ Completed Tasks

- [x] **Avatar Performance Issue** - Implemented global caching system
- [x] **React Key Prop Errors** - Fixed with globally unique keys
- [x] **Route Conflicts** - Resolved dynamic route naming issues
- [x] **Navigation Hook** - Created `useNavigation` with transformation logic
- [x] **Auth Service** - Extracted authentication logic to service layer

## 🔄 Current Status

**Last Updated**: 2025-01-20
**Overall Progress**: ✅ **Database-driven infrastructure complete + working variant**

### Recent Progress ✅
- ✅ **Route conflicts resolved** - Build environment stable
- ✅ **NavPanelDB variant created** - Working database-driven component
- ✅ **useNavigation hook integration** - Successfully transforms database to UI schema
- ✅ **Build verification** - All components compile successfully
- ✅ **Incremental approach proven** - Stable development workflow established

### Current State
| Component | Status | Notes |
|-----------|---------|--------|
| `useNavigation` hook | ✅ Complete | Transforms nav_options to UI schema |
| `authService` | ✅ Complete | Centralized authentication logic |
| `NavPanelDB` | ✅ Complete | Working database-driven variant |
| `NavPanel` (original) | 🔄 Pending | Ready for database-driven conversion |

**Next Step**: Replace original NavPanel with database-driven implementation using proven approach

---

**Implementation Note**: Following the senior engineer rule - clarify scope, locate exact insertion points, make minimal contained changes, verify correctness, and deliver clearly.

## 📝 Notes

- All security-related issues must be resolved before moving to agent integration
- Performance improvements can be implemented incrementally
- Code quality improvements should be done in parallel with feature development
- Regular testing required after each phase completion

## 🔗 Related Documents

- `simplified-entitlement-system.md` - Architecture requirements
- `architecture-foundations_UPDATED.md` - Overall system design
- `business-rules-documentation_UPDATED.md` - Business logic requirements