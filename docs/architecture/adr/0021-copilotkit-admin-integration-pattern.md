# ADR 0021 – CopilotKit-Driven Admin Workflows

> **Status:** Proposed
> **Date:** 2025-07-03
> **Owner:** Engineering / Architecture Guild

---

## 1  Context
LeaderForge already exposes basic CopilotKit demos but lacks a production-grade pattern for privileged **admin** operations (user entitlements, tenant provisioning, theming).
We must integrate CopilotKit + LangGraph **once** in a way that is:

* **Agent-native** – all orchestration in LangGraph, never in UI or API routes.
* **Schema-driven UI** – frontend renders whatever widgets the agent returns; no hard-coded forms.
* **Extensible** – new admin tasks should be "tool + schema", **not** UI rewrites.
* **Secure** – server-side auth; tools run with service-role supabase key, never in the browser.

## 2  Decision
Adopt a dedicated **AdminAgent** ( LangGraph ) that orchestrates a suite of stateless backend Tools and returns a **UI-Schema payload** consumed by CopilotKit's _Frontend Actions_ side-panel.

### Key elements
1. **Invocation surface**
   – Chat bubble (CopilotKit) bottom-right opens modal.
   – User issues intents like "Create tenant 'Acme'".
2. **AdminAgent**
   – Routes intent → specific Tool.
   – Emits JSON of type `AdminUISchema` (subset of `UniversalWidgetSchema`).
3. **Tools**
   – `EntitlementTool`, `TenantProvisionTool`, `ThemeConfigTool` (initial set).
   – Each exposes minimal methods (e.g. `setEntitlements(userId, entitlements[])`).
4. **Widgets**
   – Introduce generic `FormWidget` and `TableWidget` in registry.
   – CopilotKit renders them inside its side-panel using **Shared-State** pattern.
5. **Feedback loop**
   – Widget submission posts to `/api/agent/admin` ⇒ AdminAgent continues flow / returns confirmation schema.

## 3  Considered Options
| Option | Pros | Cons |
|--------|------|------|
| **A. Dedicated AdminAgent + schema widgets (chosen)** | Aligns with agent-native, reusable, minimal frontend coupling | Requires new widgets + schema ext. |
| B. Hard-coded React admin pages | Quick spike | Violates architecture, not extensible |
| C. Use CopilotKit "Tool-Based Generative UI" without LangGraph | Less backend code | Loses single-source orchestration, scatters logic |

## 4  Consequences
* **Positive**
  – Admin surface unified; adding a new task = register Tool + update schema.
  – CopilotKit integration becomes real (not demo).
  – Frontend stays generic, future-proof.
* **Negative / Risks**
  – Initial effort to build Form/Table widgets.
  – Must secure Tools (RBAC) – admin only.
  – Need clear versioning of AdminUISchema.

## 5  Success Metrics
* < 2 frontend changes to add a new admin flow.
* Admin tasks callable via chat; side-panel renders with no React edits.
* 100 % SSR; zero client-side secrets.

## 6  Follow-Up Actions
1. Merge implementation plan (`docs/engineering/implementation-plans/copilotkit-admin-integration-plan.md`).
2. Scaffold widgets + schema PR.
3. Build Tools & AdminAgent.
4. Security review / ADR update → **Accepted** once pilot flows ship.