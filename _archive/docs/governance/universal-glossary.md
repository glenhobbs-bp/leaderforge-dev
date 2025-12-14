# Universal Glossary

**File:** docs/governance/universal-glossary.md
**Purpose:** Single source of truth for all LeaderForge terminology across teams
**Owner:** Senior Architect
**Tags:** glossary, terminology, definitions, architecture
**Last Updated:** 2024-01-15

## Overview

This glossary defines all terminology used across LeaderForge documentation, codebase, and team communication. It serves as the single source of truth for consistent language across all teams and personas.

---

## Core Architecture Terms

### **Agent**
AI-powered entity that orchestrates user interactions, composes UI, and executes workflows. Agents use tools and compose widgets based on user context and intent.

### **Asset**
Top-level term encompassing all reusable platform components including widgets, tools, and compositions.

### **Asset Discovery**
Service that enables agents to find and utilize available widgets and tools based on context and requirements.

### **Composition**
Dynamic UI layout created by agents by combining multiple widgets based on user context, intent, and data. Replaces the previous term "Context Component."

### **Tenant**
A branded deployment variant of the platform (e.g., "LeaderForge," "Brilliant Movement"). Each tenant has its own theme, content, and configuration.

### **Tool**
Backend service or function that agents can invoke to perform specific operations (database queries, API calls, calculations, etc.).

### **Module**
A collection of training content including videos, guides, and learning materials organized around a specific topic or skill set.

### **Widget**
Reusable UI component that renders based on schema provided by agents. Building blocks for compositions. Replaces the previous term "Component."

---

## User Interface Terms

### **Chat Panel**
Right panel in the 3-panel layout that hosts the conversational AI interface powered by CopilotKit.

### **Content Panel**
Main panel that displays the application content based on the active composition.

### **Tenant Selector**
UI element that allows switching between available tenants (e.g., LeaderForge ↔ Brilliant Movement).

### **Navigation Panel (Nav Panel)**
Left panel in the 3-panel layout that shows module branding and navigation options.

### **Navigation Option (Nav Option)**
A menu item within the Navigation Panel that represents a different section or view.

### **Panel**
A distinct UI region in the 3-panel layout (Navigation Panel, Content Panel, Chat Panel).

### **Three-Panel Layout**
The core UI structure consisting of Navigation Panel (left), Content Panel (center), and Chat Panel (right).

---

## Branding & Design Terms

### **Design Tokens**
Named variables that store design decisions (colors, typography, spacing) to ensure consistency across the platform.

### **Tenant Branding**
Visual identity elements specific to each tenant including colors, logos, typography, and visual style.

### **Tenant Icon**
Small logo used in the Navigation Panel when collapsed or in compact displays.

### **Tenant Logo**
Full-size logo used in the Navigation Panel when expanded.

### **Tenant Subtitle**
Short tagline or description displayed below the tenant title.

### **Tenant Title**
The human-readable name of the tenant (e.g., "Brilliant Movement," "LeaderForge").

### **Theme Palette**
Set of visual design tokens (colors, gradients, spacing) specific to a tenant.

---

## Technical Architecture Terms

### **ADR (Architecture Decision Record)**
Structured document that captures architectural decisions with context, rationale, and consequences.

### **Agent Native**
Architectural approach where AI agents orchestrate all business logic and UI composition rather than hardcoded workflows.

### **Agent Orchestrator**
Service that routes messages to appropriate agents and manages agent execution workflows.

### **Agent Registry**
Central service that registers and discovers available agents in the system.

### **API Route**
HTTP endpoint that receives requests, invokes agents, and returns responses. Routes should be thin and delegate to agents.

### **Composition Schema**
JSON schema that defines the structure and data requirements for a specific composition.

### **Modular Monolith**
Architectural pattern with a single codebase organized into clearly bounded modules with independent logic but shared infrastructure.

### **Schema-Driven UI**
UI rendering approach where agents provide schemas that define what widgets to render and how to configure them.

### **Tool Registry**
Central service that registers and discovers available tools that agents can use.

### **Widget Registry**
Central service that registers and discovers available widgets for UI composition.

---

## Data & Content Terms

### **Content Library**
Collection of learning materials, videos, documents, and resources available within a tenant.

### **User Context**
Situational information that agents use to provide relevant responses and compositions (user state, current tenant, conversation history, etc.). Note: Different from "Tenant" (branded deployment variant).

### **Entitlement**
Permission or access right that determines what features, content, or capabilities a user can access.

### **Tenant Configuration**
JSON configuration that defines tenant-specific settings, branding, navigation, and available features.

### **Progression**
User's advancement through learning materials or program requirements within a tenant or specific module.

### **Provisioning**
Process of granting access rights and entitlements to users for specific tenants or features.

---

## User Experience Terms

### **Conversation-First**
Design principle where all platform functionality is accessible through natural language interaction.

### **Dynamic Content**
UI elements and data that are generated in response to user interaction or agent decisions.

### **Intent**
User's goal or desired action as interpreted by AI agents from natural language input.

### **Personalization**
Customization of user experience based on individual preferences, progress, and behavior.

### **Progressive Disclosure**
UX pattern that reveals information incrementally to avoid overwhelming users.

### **User Journey**
Complete path a user takes through the platform to accomplish their goals.

---

## Development Terms

### **Component Library**
Collection of reusable UI widgets with consistent styling and behavior patterns.

### **Hot Reloading**
Development feature that updates the application in real-time as code changes are made.

### **Mobile-First**
Design and development approach that starts with mobile constraints and scales up to larger screens.

### **Responsive Design**
UI design that adapts to different screen sizes and device capabilities.

### **Style Classes**
CSS utility classes (typically Tailwind) that define visual appearance and layout behavior.

---

## Quality & Process Terms

### **Acceptance Criteria**
Specific conditions that must be met for a feature to be considered complete and acceptable.

### **Code Review**
Process of examining code changes for quality, security, and architectural compliance before merging.

### **Quality Gate**
Checkpoint in the development process that ensures specific quality standards are met before proceeding.

### **Technical Debt**
Code or architectural decisions that prioritize short-term delivery over long-term maintainability.

### **User Story**
Brief description of a feature from the user's perspective, typically following "As a [user], I want [goal] so that [benefit]" format.

---

## Business Terms

### **Customer Journey**
End-to-end experience a customer has with the LeaderForge platform across all touchpoints.

### **Engagement Metrics**
Measurements of how users interact with the platform (session duration, conversation frequency, feature usage).

### **Feature Flag**
Mechanism to enable or disable features for specific users or groups without code deployment.

### **Go-to-Market (GTM)**
Strategy and plan for launching new features or modules to users.

### **Key Performance Indicator (KPI)**
Measurable value that indicates how effectively the platform is achieving business objectives.

### **Product-Market Fit**
Degree to which a product satisfies market demand and user needs.

### **Retention Rate**
Percentage of users who continue using the platform over a specific time period.

### **User Acquisition**
Process and strategies for gaining new users for the platform.

---

## Integration Terms

### **API Integration**
Connection between LeaderForge and external services or systems.

### **SSO (Single Sign-On)**
Authentication method that allows users to access multiple systems with one set of credentials.

### **Supabase**
Backend-as-a-service platform providing database, authentication, and storage for LeaderForge.

### **Tribe Social**
External content management system integrated with LeaderForge for video content and analytics.

### **Webhook**
HTTP callback that allows external systems to notify LeaderForge of events or data changes.

---

## Deprecated Terms

These terms are no longer used and should be updated in existing documentation:

- **Component** → Use "Widget" for UI elements
- **Context Component** → Use "Composition" for agent-assembled UI layouts
- **Section** → Use "Navigation Option" for nav menu items

---

## Usage Guidelines

### For Documentation
- **Always use** terms as defined in this glossary
- **Link to definitions** when introducing terms in new documents
- **Update deprecated terms** when editing existing documents
- **Propose new terms** through governance process

### For Code
- **Use consistent naming** that aligns with glossary terms
- **Avoid abbreviations** unless they're well-established (e.g., API, UI)
- **Include JSDoc comments** that reference glossary definitions
- **Update variable names** when terms evolve

### For Communication
- **Use precise terminology** in team discussions and documentation
- **Explain terms** when communicating with external stakeholders
- **Reference this glossary** when clarifying terminology questions
- **Suggest updates** when you encounter ambiguous or missing terms

---

## Glossary Maintenance

### Update Process
1. **Identify Need**: New concepts, changed architecture, or ambiguous terms
2. **Propose Definition**: Clear, concise definition with context
3. **Review Process**: Architecture and product team review
4. **Update Glossary**: Add/modify definitions with effective date
5. **Communicate Changes**: Notify all teams of terminology updates
6. **Update Documentation**: Systematic update of existing documents

### Review Schedule
- **Monthly**: Review new terms and proposed changes
- **Quarterly**: Comprehensive review of all definitions
- **Major Releases**: Align terminology with architectural changes

### Quality Standards
- **Clear Definitions**: Unambiguous, concise explanations
- **Cross-References**: Link related terms appropriately
- **Context Provided**: Explain when and why terms are used
- **Examples Given**: Include usage examples where helpful

---

**Remember**: Consistent terminology improves communication, reduces confusion, and helps new team members understand the platform architecture and business domain more quickly.