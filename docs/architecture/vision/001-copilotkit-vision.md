# ADR-V001 — CopilotKit Vision & Target-State Blueprint

**Status:** Draft
**Created:** 2025-01-17
**Owner:** Engineering / Product

---

## 1  Purpose
Define the North-Star vision, target architecture, and concrete use-cases for CopilotKit within the LeaderForge Agent-Native Platform. This document will serve as the baseline for the Phase 3 audit and future implementation roadmap.

---

## 2  Background (Current "As-Is")
* CopilotKit currently included as **demo-level** integration — `CopilotKitProvider` wraps the app (see `apps/web/app/CopilotKitProvider.tsx`).
* Chat endpoint served at `/api/copilotkit` but limited to default agent.
* Claims of "full CopilotKit integration" in marketing/docs are **misleading** (see ADR-0020, MASTER_WORKPLAN).
* LangGraph is our authoritative backend orchestration layer; CopilotKit acts purely as the **frontend conduit** for user intents & streaming responses.

---

## 3  Reference Inputs
### 3.1  Existing Documentation & Code
* `docs/engineering/MASTER_WORKPLAN.md` — Phase 3 scope & risk notes.
* ADR-0020 — identifies CopilotKit claim gaps.
* `apps/web/app/CopilotKitProvider.tsx`, `AIExperience.tsx` — current usage.
* Legacy references in `docs/legacy/*` (to be catalogued).

### 3.2  External Capability Survey
* CopilotKit Cloud portal — multi-model chat, "3-panel UX", dev console.
  <https://cloud.copilotkit.ai/>
* LangGraph Platform — streaming, background runs, burst handling, HITL.
  <https://langchain-ai.github.io/langgraph/concepts/langgraph_platform/>

---

## 4  LeaderForge Architectural Principles (Constraint Summary)
1. **Agent-Native Orchestration** — All business logic in LangGraph agents.
2. **Schema-Driven UI** — Frontend renders only agent-returned schemas.
3. **Separation of Concerns** — Tools stateless; UI never calls tools directly.
4. **Three-Panel UX** — Conversation · Config · Assistant Output.

---

## 5  Target-State Vision ("To-Be")
| Pillar | Description | CopilotKit Role | LangGraph Role |
|--------|-------------|-----------------|----------------|
| **Contextual Chat** | User converses with platform-aware assistant | Chat UI, streaming tokens | Conversation agent (LangGraph) |
| **Action Suggestions** | Inline suggestions (e.g., "Add to Learning Path") | CopilotKit suggestions API | Tool-calling agent |
| **Navigation Helper** | Chat-driven navigation / content discovery | Intents → Nav agent | Nav-Graph agent |
| **Human-in-Loop Workflows** | Escalate to mentor / admin | CopilotKit HITL prompt | Background agent run |
| **Content Creation** | AI-assisted worksheet authoring | Rich-text chat | Content-creation agent |

---

## 6  Use-Case Catalogue (Draft)
### U-1  Leadership Library Search
* **Actor:** Learner
* **Intent:** "Find videos on servant leadership."
* **Flow:** CopilotKit chat → SearchIntent → LangGraph Content Agent → Schema-driven cards.

### U-2  Progress Nudge
* **Actor:** Learner
* **Intent:** "How close am I to completing Module 2?"
* **Flow:** Chat → ProgressAgent → returns stats → CopilotKit shows inline progress widget.

*(Additional use-cases to be added during discovery)*

---

## 7  Gap Analysis Checklist (To Drive Audit)
- [ ] Frontend correctly streams LangGraph token responses via CopilotKit.
- [ ] CopilotKit suggestion API wired to actionable intents.
- [ ] HITL endpoints mapped but disabled for now.
- [ ] No business logic in CopilotKit components.

---

## 8  Next Steps
1. **Catalogue all existing CopilotKit references** (code & docs).
2. **Populate Section 6** with full use-case set (MVP vs Future).
3. **Run Audit** against Gap Analysis.
4. **Draft Implementation Roadmap & ADRs.**

---

*End of Draft V001*