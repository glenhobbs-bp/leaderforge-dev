# Architecture Decision Records (ADR) Index

**File:** docs/architecture/adr/README.md
**Purpose:** Index and guidelines for Architecture Decision Records
**Owner:** Senior Architect
**Tags:** ADR, architecture, decisions, index

## Overview

Architecture Decision Records (ADRs) document significant architecture and technology decisions made for the LeaderForge platform. Each ADR captures the context, options considered, decision made, and rationale to provide transparency and historical context for future development.

## ADR Guidelines

### When to Create an ADR
- **Architecture changes**: System design, component relationships, data flow
- **Technology decisions**: Framework, library, or tool choices
- **Pattern establishment**: New development patterns or conventions
- **Integration approaches**: External service integration strategies
- **Performance/security decisions**: Non-functional requirement implementations

### ADR Lifecycle
1. **Proposed**: Decision under consideration
2. **Accepted**: Decision approved and being implemented
3. **Rejected**: Decision considered but not adopted
4. **Superseded**: Decision replaced by newer ADR
5. **Deprecated**: Decision no longer relevant but kept for reference

## Active ADRs

| Number | Title | Status | Date | Impact |
|--------|-------|--------|------|---------|
| [ADR-0001](0001-agent-native-composition-system.md) | Agent-Native Composition System | Accepted | 2024-01-15 | High |
| [ADR-0002](0002-modular-monolith-architecture.md) | Modular Monolith Architecture | Accepted | 2024-01-15 | High |
| [ADR-0003](0003-separate-asset-registries.md) | Separate Widget and Tool Registries | Accepted | 2024-01-15 | Medium |
| [ADR-0004](0004-database-backed-compositions.md) | Database-Backed User Compositions | Accepted | 2024-01-15 | Medium |
| [ADR-0005](0005-hybrid-communication-pattern.md) | Hybrid Communication Pattern | Accepted | 2024-01-15 | Medium |
| [ADR-0006](0006-bullmq-message-queue.md) | BullMQ for Message Queue Implementation | Accepted | 2024-01-15 | Low |
| [ADR-0007](0007-api-route-organization.md) | API Route Organization Pattern | Accepted | 2024-01-15 | Low |

## Superseded ADRs

| Number | Title | Superseded By | Date |
|--------|-------|---------------|------|
| _None yet_ | | | |

## Templates and Resources

- **[ADR Template](adr-template.md)**: Standard template for new ADRs
- **[Senior Architect Rule](../../governance/senior-architect-rule.md)**: Guidelines for architectural decisions
- **[Architecture Overview](../overview/agent-native-composition-architecture.md)**: High-level architecture documentation

## Creating a New ADR

1. **Copy the template**: `cp adr-template.md XXXX-your-decision-title.md`
2. **Assign number**: Use next sequential number (check index above)
3. **Fill out content**: Complete all sections thoroughly
4. **Update this index**: Add entry to appropriate table
5. **Link from related docs**: Update relevant documentation with ADR links

## ADR Review Process

1. **Draft Review**: Technical leads review draft ADR
2. **Stakeholder Review**: Affected teams review and provide input
3. **Final Approval**: Senior architect approves final version
4. **Status Update**: Move from "Proposed" to "Accepted"
5. **Implementation Tracking**: Monitor implementation progress

---

**Note**: ADRs are living documents. Update status and add amendments as decisions evolve.