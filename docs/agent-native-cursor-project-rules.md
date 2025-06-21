# Agent Native Platform: Cursor Project Rules

## Core Principles
- **Agent-Native Orchestration:** All business logic and data access must be orchestrated by agents, not hardcoded in the UI or API endpoints.
- **Schema-Driven UI:** The frontend renders only what is described in the agent's returned schema. No UI logic or business rules in the frontend.
- **Modular Tools:** Tools are reusable, context-aware backend helpers. Tools must not contain UI logic or cross-module dependencies.
- **Separation of Concerns:** UI, agent orchestration, tools, and data access must remain strictly decoupled.
- **Observability:** All agent runs and tool calls must be observable and auditable (e.g., via LangSmith).

## Backend Rules
- Do not put business logic in API endpoints—APIs must only invoke agents and return their schema.
- All orchestration (tool usage, workflow, data merging) must be in agents (LangGraph or LLM-based).
- Tools must be stateless, composable, and context-driven.
- Never bypass the agent layer for data access or business logic.

## Frontend Rules
- Never call tools or the database directly from the frontend.
- All data and UI state must come from the agent's schema.
- UI components must be generic and render based on schema, not hardcoded logic.
- All user actions must be sent as intents/messages to the agent via the API.
- Themes (colors, typography, etc.) must not be hardcoded and must be managed as configuration. UI theming must be dynamic and agent/context-driven, not static or per-component.

## Tool Rules
- Tools must be pure backend helpers—no UI, no cross-module logic.
- Tools must be registered and versioned for agent use.
- Tools must not assume knowledge of agent workflows or UI.

## Agent Rules
- Agents must orchestrate all business logic, tool usage, and schema composition.
- Agents must be registered centrally and versioned.
- Agents must not contain UI rendering logic—only schema composition.
- Agents must be observable and debuggable.

## API Rules
- API endpoints must be thin: receive user intent, invoke the agent, return the schema.
- No business logic, data access, or tool calls in API handlers.

## Development Environment Rules
- **Session Hygiene:** Use `./monitor-sessions.sh` regularly to check for session buildup. Run `./cleanup-sessions.sh` if more than 5 shell sessions are detected.
- **Clean Startup:** Always use `./start-dev.sh` to start development services. Never start services manually in multiple terminals.
- **Graceful Shutdown:** Always use `./stop-dev.sh` to stop development services. Never leave orphaned processes running.
- **Daily Cleanup:** Run session cleanup at the start of each development session to prevent resource accumulation.
- **Port Conflicts:** If ports 3000 or 8000 are occupied, run cleanup scripts before attempting manual process killing.
- **Build Cache:** Clear Next.js cache (`rm -rf apps/web/.next`) when experiencing route conflicts or stale build issues.

## Testing & Review
- All new features must be tested end-to-end via agent invocation.
- No feature is complete unless it is agent-native and schema-driven.
- Code reviews must check for architectural purity and separation of concerns.
- Development environment must be clean before testing (use `./monitor-sessions.sh` to verify).

## Do's and Don'ts
- **Do:** Add new features by composing agents and tools, not by adding logic to UI or API.
- **Do:** Use configuration and schema for extensibility.
- **Do:** Use provided session management scripts for development workflow.
- **Don't:** Hardcode business rules or UI logic in the frontend or API.
- **Don't:** Bypass the agent layer for "quick fixes" or expediency.
- **Don't:** Couple tools to specific agents or UI components.
- **Don't:** Start development services manually in multiple terminals.
- **Don't:** Leave orphaned terminal sessions or processes running.

## New Feature Checklist
- [ ] All business logic is in the agent, not the UI or API.
- [ ] UI is schema-driven and generic.
- [ ] Tools are modular, stateless, and context-aware.
- [ ] API endpoints are thin and agent-native.
- [ ] Feature is observable in LangSmith or equivalent.
- [ ] Code review confirms architectural purity.
- [ ] Themes (colors, typography, etc.) are managed as configuration and dynamic.
- [ ] Development environment is clean (verified with `./monitor-sessions.sh`).

---

**These rules are mandatory for all contributors. Violations must be flagged and remediated before merge.**