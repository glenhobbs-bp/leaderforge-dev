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

## 6  Use-Case Catalogue (Comprehensive v0.2)

| ID | User Story (Intent) | Primary Actor | CopilotKit Feature(s) | LangGraph / Tool Role | Notes / Data Sources |
|----|--------------------|---------------|-----------------------|-----------------------|----------------------|
| U-01 | "Find videos on servant leadership **at minute 3:15**" → returns cards & deep-linked timestamp | Learner | Chat + Streaming; video timestamp anchors | ContentLibraryAgent resolves query, embeds `startAt` param | **NEW:** returns `location` field for HLS seek |
| U-02 | "How close am I to completing Module 2?" | Learner | Inline widget render | ProgressAgent aggregates Supabase stats | Progress nudge |
| U-03 | "Add this video to my Learning Path" suggestion click | Learner | Suggestions API | PathMutateTool | Inline action suggestion |
| U-04 | AI proactively sends PowerPrompt day 3 question | Platform → Learner | PowerPrompt sequence, HITL as needed | PowerPromptAgent schedules, streams | PRD §3 |
| U-05 | "I didn't get my commission payout this month – why?" | Customer Support Rep | External API call + explanation UI | FlightCommerceAgent → CommissionLookup tool | Looks up payout, explains $25 threshold |
| U-06 | "How many new sign-ups in my downline this month?" | Sales Rep | External lookup answer | FlightCommerceAgent → DownlineStats tool | Returns numeric + chart |
| U-07 | "Open Productivity Path" navigation via chat | Learner | Intent parsing | NavAgent returns nav schema | Conversational navigation |
| U-08 | Team leader: "Meeting with Glen in 15 min – give talking points" | Leader | Context aggregation, generative summary | MeetingPrepAgent pulls completions, progress | Uses video + worksheet + action data |
| U-09 | Conflict-resolution coaching during live chat | Leader | Real-time guidance | CoachingAgent pattern prompts | PRD §5 |
| U-10 | Delegation planner: "Create delegation plan for project X" | Leader | Generative UI (table) | DelegationToolAgent | PRD §6 |
| U-11 | Strategy session: "Run scenario planning for 2025" | Exec | Multi-stage workflow | StrategyAgent + ChartTool | PRD §7 |
| U-12 | "Create marketing campaign outline" | Marketer | Content generation | MarketingAgent | PRD §9 |
| U-13 | "Show team culture health" dashboard | Leader | Generative UI charts | CultureMetricsAgent | PRD §6 |
| U-14 | Financial ROI analysis: "Evaluate purchase of new LMS" | Finance Lead | Data viz | FinanceAgent | PRD §10 |
| U-15 | Background alert: compliance risk detected → chat details | Analyst | Alert surface & deep-dive | MonitoringAgent | PRD §4 |
| U-16 | Doc summary: "Summarize attached policy PDF" | Any | File upload + doc QA | DocAgent | PRD §15 |
| U-17 | Calendar helper: "Reschedule my 1:1s to next week" | Leader | External calendar integration | CalendarAgent | PRD §14 |
| U-18 | HITL approval: publish AI-drafted newsletter | Comms Lead | renderAndWaitForResponse workflow | PublishAgent post-approval | PRD §12 |
| U-19 | Real-time co-editing of goals list | Team | Shared-state CoAgent | GoalsAgent sync | PRD §21 |
| U-20 | Kingdom leadership counsel: "Apply Matthew 20 to this decision" | Faith Leader | Specialized KB search | ScriptureAgent | PRD §17 |
| U-21 | Outreach planning: "Plan community service event" | Outreach Coord | Workflow builder | OutreachAgent | PRD §18 |
| U-22 | Life-coach goal review | Individual | Personal coaching flow | LifeCoachAgent | PRD §19 |
| U-23 | Multi-agent collaboration: HR + Finance resolve hiring budget | HR & Finance | Agent hand-off | HRAgent ↔ FinanceAgent | PRD §20 |
| U-24 | Analytics query: "CopilotKit usage last 30 days" | Admin | Usage analytics | AnalyticsAgent | PRD §22 |
| U-25 | DevOps chat-ops: "Redeploy staging" | Engineer | Chat command → webhook | CI/CD Agent | Legacy dev-ops note |

> **MVP Focus (Phase 3-4 audits):** U-01 → U-08 establish end-to-end patterns (search, progress, external API, meeting prep, suggestions, PowerPrompts).

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