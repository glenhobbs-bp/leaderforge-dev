# Implementation Plan – CopilotKit Admin Integration (Phase 3.1)

**Status:** Draft
**Created:** 2025-07-03
**Owner:** Engineering Team

---

## 1  Objectives
Deliver the first production-ready CopilotKit integration focused on three admin use-cases:
1. Configure a user's entitlements
2. Create a new tenant
3. Change tenant theme colours

All while establishing an extensible pattern (see ADR-0021) so future admin tasks are "Tool + Schema" additions.

## 2  High-Level Architecture
```mermaid
flowchart TD
  subgraph Frontend (Next.js)
    A[Chat Bubble]
    B[CopilotKit Modal]
    C[Side Panel – Shared State]
    A --> B --> C
  end
  subgraph CopilotKit Runtime (Edge fn)
    D[Intent JSON]
  end
  subgraph LangGraph Backend
    D --> E(AdminAgent)
    E -->|calls| F1[EntitlementTool]
    E -->|calls| F2[TenantProvisionTool]
    E -->|calls| F3[ThemeConfigTool]
    E --> G[AdminUISchema JSON]
  end
  G --> C
```

## 3  Work Breakdown Structure (WBS)
| # | Task | Owner | Est. hrs | Deliverable |
|---|------|-------|----------|-------------|
| 1 | Extend `UniversalWidgetSchema` with `Form` & `Table` | FE Lead | 3 | Schema PR + TS types |
| 2 | Generic `FormWidget` + `TableWidget` components, registry entry | FE Dev | 6 | Widgets with zod validation |
| 3 | Scaffold **AdminAgent** (LangGraph) | BE Lead | 4 | `packages/agent-core/agents/AdminAgent.ts` |
| 4 | Implement `EntitlementTool` | BE | 5 | Tool + Supabase RPC calls |
| 5 | Implement `TenantProvisionTool` | BE | 5 | Tool + SQL migration script |
| 6 | Implement `ThemeConfigTool` | BE | 4 | Tool + update `tenant_theme` table |
| 7 | Edge route `/api/agent/admin` → AdminAgent | BE | 2 | API route handler |
| 8 | CopilotKit runtimeUrl wiring & intent routing | FE | 3 | Update `CopilotKitProvider.tsx` |
| 9 | End-to-end flow tests (Playwright) | QA | 6 | Test suite |
|10 | Security/RBAC review | SecOps | 2 | Checklist signed |
|11 | Docs update & ADR-0021 acceptance PR | Tech Writer | 2 | Updated docs |

_Total Estimation:_ **38 hrs** (~5 dev-days)

## 4  Milestones & Timeline
| Date | Milestone |
|------|-----------|
| Day 0 | Plan & ADR merged |
| Day 1 | Schema + widget scaffolding merged |
| Day 2 | AdminAgent + EntitlementTool functional |
| Day 3 | Tenant & Theme tools done – flow demo |
| Day 4 | QA, security review, docs – **MVP complete** |

## 5  Dependencies & Risks
* Supabase service-role key must be available in edge runtime (securely).
* Widget validation relies on Zod – ensure bundle size remains acceptable.
* RBAC: Only `is_admin` users can invoke AdminAgent.

## 6  Acceptance Criteria
* Chat command "`/entitlement user123 add premium_content`" opens side-panel Form preloaded & saves successfully.
* Chat "`create tenant AcmeCorp`" walks wizard & provisioning succeeds.
* Chat "`set theme primary #3478f6`" updates theme and hot-reloads colours in UI.
* Zero business logic lives in API route or frontend component; all in Agent + Tools.
* Playwright E2E tests pass in CI.

## 7  Out of Scope
* Non-admin CopilotKit features (content search, coaching).
* Multi-tenant theming preview – handled in Phase 3.2.

---

> **Next Step:** Create feature branch `feat/copilotkit-admin-mvp`, start with schema & widget scaffolding.