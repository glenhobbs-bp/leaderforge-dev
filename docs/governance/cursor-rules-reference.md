# Cursor Rules Reference

This document explains all the Cursor AI rules available in this project for automated development assistance.

## Overview

Cursor rules are automatically enforced by the Cursor AI during development. They are organized by persona to ensure role-appropriate guidance and reduce duplication.

## Available Rules

### Core Persona Rules

#### `.cursor/rules/senior-architect-rule.mdc`
**Purpose:** Architectural integrity and system design decisions
- Agent-native platform architecture principles
- System-wide constraints and consistency gates
- Architectural decision escalation framework
- Technical debt prevention
- ADR requirements

#### `.cursor/rules/senior-engineer-rule.mdc`
**Purpose:** Implementation standards and development practices
- Task execution methodology
- Essential technical patterns (backend, frontend, database)
- Development environment hygiene
- Code quality and documentation standards

#### `.cursor/rules/senior-product-manager-rule.mdc`
**Purpose:** Product strategy and user experience decisions
- User-centric development approach
- Feature specification and acceptance criteria
- Cross-functional coordination

#### `.cursor/rules/senior-qa-rule.mdc`
**Purpose:** Testing methodology and quality assurance
- Test strategy and coverage requirements
- Quality gates and validation processes

#### `.cursor/rules/senior-qa-rule-documentation.mdc`
**Purpose:** Documentation quality and maintenance
- Documentation discipline and standards
- Content accuracy and consistency
- Legacy content management

#### `.cursor/rules/senior-designer-rule.mdc`
**Purpose:** Design system and user interface standards
- Visual design consistency
- User experience patterns
- Design system governance

## How Cursor Rules Work

1. **Automatic Enforcement:** Rules are automatically applied during AI-assisted development
2. **Persona-Based:** Each rule targets specific roles and responsibilities
3. **Context-Aware:** Rules provide guidance relevant to the current development context
4. **Complementary:** Rules work together to ensure comprehensive coverage

## Rule Organization Principles

- **Persona-Based:** Rules organized by development role (architect, engineer, PM, QA, designer)
- **No Duplication:** Each concept appears in only one rule file
- **Clear Ownership:** Each rule has a specific scope and responsibility
- **Hierarchical:** Architectural rules take precedence over implementation rules

## Recent Consolidation

Previously scattered technology-specific rules (backend, frontend, database) have been consolidated into persona-based rules to:
- Reduce duplication
- Improve clarity
- Ensure consistent enforcement
- Simplify maintenance

## Usage Guidelines

- Rules are automatically applied - no manual intervention required
- When in doubt, defer to the senior architect rule for system-wide decisions
- Implementation details follow the senior engineer rule patterns
- All personas work together to ensure comprehensive quality coverage

## Updating Rules

### **Modification Process**
1. **Edit `.cursor/rules/*.mdc` files** directly for rule updates
2. **Test changes** in development session to verify behavior
3. **Document changes** in commit messages for team awareness
4. **Update this reference** if new rules are added

### **Rule Development Guidelines**
- **Be Specific** - Clear, actionable guidance rather than vague principles
- **Provide Context** - Explain why rules exist and when they apply
- **Include Examples** - Show correct and incorrect patterns
- **Stay Current** - Regular review and updates as architecture evolves

## Getting Help

### **Rule Conflicts**
If Cursor rules conflict with project requirements:
1. Review the specific rule for context and rationale
2. Discuss with appropriate senior role owner
3. Update rule if needed, or adjust approach to align
4. Document decision in ADR if architectural

### **Rule Interpretation**
For questions about rule application:
- **Senior Architect** - For architectural and technical rules
- **Senior Product Manager** - For product and UX rules
- **Senior Engineer** - For implementation and quality rules
- **Senior QA** - For testing and documentation rules

### **Suggesting New Rules**
To propose new rules:
1. Create draft `.mdc` file with proposed rule
2. Test with team members in development sessions
3. Refine based on feedback and real-world usage
4. Submit for review by appropriate senior role owner

## Rule Categories

### **By Scope**
- **Universal** - Apply to all development work (agent-native-project-rules)
- **Role-Based** - Apply when working in specific senior roles
- **Domain-Specific** - Apply to specific technical areas (frontend, backend, database)

### **By Purpose**
- **Quality Assurance** - Prevent bugs and maintain code quality
- **Architectural Compliance** - Ensure adherence to system design
- **Process Enforcement** - Standardize development procedures
- **Knowledge Sharing** - Distribute senior expertise to all team members

## Best Practices

### **For Developers**
- **Trust the Rules** - They encode collective wisdom and experience
- **Ask Questions** - If rules seem unclear or incorrect, get clarification
- **Provide Feedback** - Help improve rules based on real usage
- **Stay Updated** - Review rule changes and understand their impact

### **For Senior Roles**
- **Keep Rules Current** - Regular review and updates as standards evolve
- **Provide Context** - Explain rationale behind rules for better adoption
- **Monitor Effectiveness** - Track whether rules achieve intended outcomes
- **Facilitate Learning** - Use rules as teaching tools for team development

---

**Remember**: These rules exist to elevate the quality of our development and ensure consistency across the team. When Cursor suggests following a rule, it's applying the collective wisdom of our senior team members.

**Quick Access**: All cursor rules are located in the `.cursor/rules/` directory in your project root.