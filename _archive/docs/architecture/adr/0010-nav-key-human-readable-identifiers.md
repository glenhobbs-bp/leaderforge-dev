# ADR-0010: Navigation Options Use nav_key Human-Readable Identifiers

**File:** docs/architecture/adr/0010-nav-key-human-readable-identifiers.md
**Purpose:** Architecture Decision Record for using nav_key as stable, human-readable identifiers
**Owner:** Senior Architect
**Tags:** ADR, navigation, identifiers, database, nav_key

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2025-01-22 |
| **Status** | Accepted |
| **Decision Type** | Architecture |
| **Impact Level** | Medium |
| **Stakeholders** | Frontend Team, Backend Team, Agent Developers |
| **Supersedes** | N/A |

## Context

**Background:** During navigation system development, we discovered inconsistency between database schema and code expectations. The database had `href` fields containing paths like `/leadercoach`, `/library`, while TypeScript interfaces expected `nav_key` fields with stable identifiers like `"leader-coach"`, `"brilliant-library"`.

**Problem Statement:** Navigation system architecture needed clarification on:
- Whether to use database UUIDs or human-readable identifiers for navigation routing
- How to maintain stable identifiers that survive database migrations
- Whether `href` paths or `nav_key` identifiers should be primary for agent/API lookups
- How to balance system performance with debugging/configuration ease

**Goals:**
- Establish clear separation between system identifiers and human-readable identifiers
- Enable stable navigation routing that survives database changes
- Support agent-based content routing with readable configuration
- Maintain performance while enabling intuitive debugging

**Constraints:**
- Must maintain backward compatibility during migration
- Navigation performance must remain <50ms for lookups
- Must align with existing UUID-based architectural patterns
- Must support agent-native composition system requirements

## Decision

**Summary:** Use database UUIDs for all system operations and relationships, while nav_key serves as stable, human-readable identifiers for routing, configuration, and debugging.

**Details:**
- **Database ID (UUID)**: Primary key for all system operations, foreign key relationships
- **nav_key**: Human-readable, stable identifier for routing and configuration
- **API Routing**: Uses nav_key for lookups (agent content API, navigation matching)
- **Configuration**: Agents and admin interfaces reference nav_key for clarity
- **Database Migration**: Rename existing `href` column to `nav_key` with proper constraints

## Options Considered

### Option 1: nav_key Human-Readable Identifiers (Selected)
**Description:** Use nav_key as stable, human-readable identifiers while keeping UUIDs for system operations

**Pros:**
- **Stable Identifiers**: nav_key values survive database recreation/migrations
- **Human Readable**: "leadership-library" vs "dca7d42e-2337-44ad-b6e4-7f3e7b47998b"
- **Agent Configuration**: Easier to configure agents with readable identifiers
- **Debugging**: Logs and errors are immediately understandable
- **Future Admin UI**: Admin screens can display/edit readable identifiers

**Cons:**
- **Dual Identifier System**: Complexity of managing both UUID and nav_key
- **Migration Required**: Must migrate existing href data to nav_key format
- **Unique Constraints**: Must prevent duplicate nav_keys within tenants

**Risk Level:** Low

### Option 2: UUID-Only System
**Description:** Use only database UUIDs for all navigation operations

**Pros:**
- **Simplicity**: Single identifier system
- **Performance**: Direct UUID lookups are fastest
- **Consistency**: Matches other system entity patterns
- **No Migration**: No database changes required

**Cons:**
- **Debugging Nightmare**: Logs filled with meaningless UUIDs
- **Agent Configuration**: Impossible to configure agents with UUIDs
- **Admin Interfaces**: Need complex UUID→name translation everywhere
- **Configuration Drift**: UUIDs change between environments

**Risk Level:** Medium

### Option 3: href Path-Based Routing
**Description:** Keep existing href fields with URL paths as identifiers

**Pros:**
- **No Migration**: Use existing database structure
- **URL Alignment**: Direct mapping to potential URL routes
- **Familiarity**: Teams already understand path-based routing

**Cons:**
- **URL Coupling**: Navigation tied to URL structure unnecessarily
- **Path Complexity**: "/leadercoach" less clear than "leader-coach" for agents
- **Flexibility Loss**: Can't easily change URLs without breaking navigation
- **Agent Confusion**: Agents work with paths instead of semantic identifiers

**Risk Level:** Medium

## Decision Rationale

**Primary Factors:**
1. **Agent-Native Architecture**: Agents need human-readable identifiers for configuration
2. **Debugging Experience**: Development team productivity requires readable identifiers
3. **Stability**: nav_key identifiers survive environment changes and migrations
4. **Administrative Interfaces**: Future admin UIs benefit from readable identifiers

**Trade-offs Accepted:**
- **Dual System Complexity**: Accept complexity of UUID + nav_key for long-term benefits
- **Migration Cost**: One-time migration cost for long-term architectural alignment
- **Storage Overhead**: Minimal additional storage for nav_key strings

**Assumptions:**
- Navigation options are relatively stable (not created/deleted frequently)
- Performance impact of string-based lookups is negligible for navigation volume
- Development and debugging productivity gains outweigh system complexity

## Implementation Impact

### Technical Impact
- **Database Changes**: Rename `href` to `nav_key`, add unique constraints and indexes
- **API Updates**: Content API uses nav_key for navigation option lookups
- **Frontend Changes**: Navigation hooks use nav_key as primary identifier, fallback to UUID
- **Performance**: No significant impact; navigation lookups are infrequent

### Process Impact
- **Development**: Developers reference readable nav_key in logs and configuration
- **Agent Configuration**: Agents configured with human-readable navigation identifiers
- **Testing**: Test scripts can use readable identifiers instead of UUIDs
- **Deployment**: Environment-independent navigation configuration

### Team Impact
- **Learning**: Team learns dual identifier pattern (UUID for system, nav_key for human)
- **Debugging**: Improved debugging experience with readable navigation identifiers
- **Configuration**: Easier agent and feature configuration with semantic identifiers

## Success Criteria

**Technical Metrics:**
- All navigation API calls use nav_key successfully
- No performance degradation in navigation lookup times
- Zero navigation routing errors after migration

**Development Metrics:**
- Reduced debugging time for navigation-related issues
- Easier agent configuration with readable identifiers
- Improved log readability for navigation operations

**Timeline:**
- **Migration Completion**: Database migration completed successfully
- **Code Alignment**: All navigation code uses nav_key within 1 week
- **Verification**: All navigation features working correctly

## Risk Assessment

### Low Risks
- **Migration Complexity**: Well-tested column rename with proper constraints
  - **Mitigation**: Run migration in staging first, verify all navigation works
  - **Contingency**: Rollback script ready if issues arise

### Medium Risks
- **Dual Identifier Confusion**: Developers might mix UUID and nav_key usage
  - **Mitigation**: Clear documentation, TypeScript interfaces, code reviews
  - **Contingency**: Linting rules to catch incorrect identifier usage

## Follow-up Actions

- [x] **Database Migration**: Rename href to nav_key with proper constraints
- [ ] **Code Verification**: Ensure all navigation code uses nav_key correctly
- [ ] **Documentation Update**: Update navigation development guide
- [ ] **Testing**: Verify all navigation features work with nav_key
- [ ] **Admin Interface**: Future admin screens use nav_key for display/editing

## References

- **Related ADRs:** [ADR-0001 Agent-Native Composition](0001-agent-native-composition-system.md)
- **Documentation:** [Navigation Development Guide](../../engineering/how-to/navigation-patterns.md)
- **Legacy Reference:** docs/.legacy/dev-notes/architecture-foundations_UPDATED.md
- **Migration Script:** add_nav_key_column.sql

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-22 | Senior Architect | Initial version |

---

**Note:** This decision establishes the pattern for human-readable identifiers in agent-native systems while maintaining UUID-based system operations.