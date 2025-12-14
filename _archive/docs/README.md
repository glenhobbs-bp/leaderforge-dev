# LeaderForge Documentation

**File:** docs/README.md
**Purpose:** Main documentation navigation and overview
**Owner:** Senior Architect
**Tags:** documentation, navigation, overview
**Last Updated:** 2024-01-15

## Welcome to LeaderForge Documentation

This documentation is organized by team role and document type to help you quickly find the information you need. Each section contains role-specific guidance, processes, and reference materials.

## Quick Navigation

### 🏛️ [Governance](governance/) - Cross-Team Rules & Standards
Essential rules and standards that apply to all teams:
- **Team Rules**: Senior Architect, Product Manager, Engineer, QA rules
- **Standards**: Code of conduct, documentation, security, performance
- **Process**: Decision making, escalation, compliance

### 📊 [Product Management](product-management/) - Strategy & Requirements
Product strategy, user research, and feature requirements:
- **PRDs**: Product Requirements Documents for major features
- **Research**: User personas, journey maps, competitive analysis
- **Metrics**: Success metrics and KPIs
- **Roadmap**: Product roadmap and feature backlog

### 🎨 [Product Design](product-design/) - UX/UI Design & Patterns
User experience design and design system documentation:
- **Design System**: Widgets, colors, typography, context branding
- **UX Patterns**: Navigation, conversation design, accessibility
- **Widget Patterns**: Reusable UI patterns and composition guidelines
- **Context Theming**: Multi-context design and brand differentiation

### 🏗️ [Architecture](architecture/) - System Design & Decisions
System architecture and technical decision documentation:
- **Overview**: High-level architecture and technology stack
- **ADRs**: Architecture Decision Records with full decision history
- **Patterns**: Reusable architectural and development patterns
- **Integrations**: External service integration guides

### ⚙️ [Engineering](engineering/) - Implementation & How-To
Development guides, implementation plans, and technical reference:
- **Implementation Plans**: Detailed plans for major features and refactors
- **How-To Guides**: Step-by-step development instructions
- **API Reference**: Comprehensive API documentation
- **Database**: Schema docs, migrations, policies

### 🧪 [Quality Assurance](quality-assurance/) - Testing & Quality
Quality processes, testing strategies, and quality gates:
- **Testing Strategy**: Overall testing approach and automation
- **Test Plans**: Feature-specific test plans and procedures
- **Quality Gates**: Code review, release, security checklists
- **Bug Tracking**: Bug triage processes and known issues

## Finding What You Need

### By Role
- **Product Managers**: Start with [Product Management](product-management/) and [Governance](governance/)
- **Designers**: Focus on [Product Design](product-design/) and [Product Management](product-management/)
- **Architects**: Begin with [Architecture](architecture/) and [Governance](governance/)
- **Engineers**: Check [Engineering](engineering/) and [Architecture](architecture/)
- **QA Engineers**: Review [Quality Assurance](quality-assurance/) and [Engineering](engineering/)

### By Task
- **Planning Features**: [Product Management PRDs](product-management/prds/) → [Architecture ADRs](architecture/adr/) → [Engineering Plans](engineering/implementation-plans/)
- **Implementing Features**: [Engineering How-To](engineering/how-to/) → [Architecture Patterns](architecture/patterns/) → [QA Test Plans](quality-assurance/test-plans/)
- **Making Decisions**: [Governance Rules](governance/) → [Architecture ADRs](architecture/adr/) → Document Decision
- **Troubleshooting**: [Engineering Reference](engineering/api-reference/) → [QA Known Issues](quality-assurance/bug-tracking/) → [Architecture Integrations](architecture/integrations/)

### By Document Type
- **📋 Requirements**: [Product Management](product-management/)
- **🏛️ Architecture**: [Architecture Overview](architecture/overview/) and [ADRs](architecture/adr/)
- **📝 Implementation**: [Engineering Plans](engineering/implementation-plans/)
- **📚 Reference**: [Engineering API Reference](engineering/api-reference/)
- **✅ Quality**: [QA Strategy](quality-assurance/testing-strategy/) and [Gates](quality-assurance/quality-gates/)

## Document Standards

### File Headers
All documents must include standardized headers:
```markdown
**File:** [file path]
**Purpose:** [one-line description]
**Owner:** [role/team responsible]
**Tags:** [searchable tags]
**Last Updated:** [YYYY-MM-DD]
```

### Naming Conventions
- **Files**: kebab-case (e.g., `agent-native-composition.md`)
- **Directories**: lowercase with hyphens
- **Cross-references**: Always use relative links

### Maintenance
- **Quarterly Reviews**: Each section owner reviews their docs
- **Monthly Manifest**: Auto-generated file manifest updates
- **Archive Policy**: Archive docs older than 1 year unless marked reference

## Getting Started

### New Team Members
1. **Read Governance**: Start with [governance rules](governance/) for your role
2. **Review Standards**: Understand [documentation standards](governance/documentation-standards.md)
3. **Find Your Section**: Navigate to your role-specific documentation
4. **Complete Training**: Work with your manager on role-specific training

### Contributing Documentation
1. **Follow Standards**: Use required file headers and naming conventions
2. **Update Manifest**: Run `npm run generate-manifest` after changes
3. **Cross-Reference**: Link to related documents in other sections
4. **Review Process**: Get appropriate section owner approval

### Historical Reference
- **[Legacy Archive](.legacy/)** - Contains deprecated documentation superseded by this organized structure. Reference only for historical context - do not use for current development.

### Feedback & Improvements
- **Documentation Issues**: Create issues for outdated or unclear docs
- **Process Improvements**: Suggest improvements to section owners
- **Cross-Team Needs**: Escalate to governance for cross-team documentation needs

## Recent Updates

- **2024-01-15**: Complete documentation restructure by persona
- **2024-01-15**: ADR system implementation with 7 foundational decisions
- **2024-01-15**: New governance framework with team-specific rules

---

**Questions?** Check the [governance escalation process](governance/README.md#escalation-process) or reach out to the appropriate section owner.