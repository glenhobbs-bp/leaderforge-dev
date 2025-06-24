# Legacy Documentation Archive

**File:** docs/.legacy/README.md
**Purpose:** Archive of deprecated documentation superseded by organized structure
**Owner:** Senior Architect
**Tags:** archive, legacy, deprecated, historical
**Last Updated:** 2024-01-15

## Overview

This directory contains documentation that has been superseded by the new persona-based organization structure implemented in late 2024. These files are preserved for historical reference but should not be used for current development.

## What's Archived Here

### **Organizational Artifacts**
- `documentation-restructure-plan.md` - The plan for reorganizing documentation
- `documentation-restructure-summary.md` - Summary of the restructure completion
- `design-system-reorganization-summary.md` - Summary of design system and glossary work

### **Superseded Rule Documents**
- `senior-architect-rule.md` → Now in `.cursor/rules/senior-architect-rule.mdc`
- `senior-product-manager-rule.md` → Now in `.cursor/rules/senior-product-manager-rule.mdc`

**Note**: Senior rules were first moved to governance/, then moved to `.cursor/rules/` for automatic Cursor AI enforcement.

### **Architecture Documentation**
- `adr-template.md` → Now in `architecture/adr/adr-template.md`
- `agent-native-composition-architecture.md` → Now in `architecture/overview/`
- `universal-progress-tool-architecture.md` → Content integrated into organized docs

### **Product Documentation**
- `prd-agent-native-composition-system.md` → Now in `product-management/prds/`

### **Engineering Documentation**
- `component-system-refactor-plan.md` → Now in `engineering/implementation-plans/`
- `how-to-*.md` files → Now organized in `engineering/how-to/`

### **Agent & Development Documentation**
- `agent-framework-deployment-guide.md` → Content integrated into organized docs
- `agent-native-cursor-project-rules.md` → Content integrated into governance
- `agent-native-leader-brief.md` → Historical presentation materials
- `agent-native-leader-brief-presentation.md` → Historical presentation materials
- `file-header-template.md` → Standards now in governance

### **Dev Notes Archive**
The entire `dev-notes/` directory has been moved here as its contents were either:
- **Outdated**: Using old terminology and architectural patterns
- **Superseded**: Covered by organized documentation in proper sections
- **Development artifacts**: Temporary notes that served their purpose

#### Notable dev-notes content:
- `ui-glossary-and-styling.md` → Replaced by universal glossary and design system
- `architecture-foundations_UPDATED.md` → Integrated into architecture section
- `business-rules-documentation_UPDATED.md` → Content distributed appropriately
- Various configuration and setup guides → Integrated into proper sections

## Why These Were Moved

### **Improved Organization**
- Content now organized by persona (architect, product manager, engineer, designer, QA)
- Clear ownership and maintenance responsibility
- Better discoverability through logical structure

### **Eliminated Duplication**
- Multiple files covering similar topics consolidated
- Single source of truth established
- Reduced maintenance burden

### **Updated Standards**
- New terminology (Tenant, Widget, Composition) consistently applied
- Modern architectural patterns reflected
- Current tooling and processes documented

### **Quality Improvements**
- Standardized file headers and documentation format
- Clear cross-references between related topics
- Proper governance and review processes

## Historical Context

### **Original Structure (Pre-2024)**
Documentation was organically grown with:
- Topic-based files scattered in root directory
- Development notes mixed with formal documentation
- Multiple partial overlapping guides
- Inconsistent terminology and standards

### **Migration Period (Late 2024)**
- Systematic reorganization by persona and function
- Terminology standardization (Context → Tenant, Component → Widget)
- Quality improvements and governance establishment
- Legacy content archived for reference

### **Current Structure**
- **governance/** - Cross-team rules and standards
- **architecture/** - System design and technical decisions
- **product-management/** - Requirements and product strategy
- **engineering/** - Implementation guides and technical how-tos
- **product-design/** - UX/UI design system and patterns
- **quality-assurance/** - Testing standards and processes

## Access Guidelines

### **When to Reference Legacy Content**
- ✅ **Historical research** - Understanding past architectural decisions
- ✅ **Migration validation** - Ensuring nothing important was lost
- ✅ **Pattern evolution** - Seeing how standards developed over time

### **When NOT to Use Legacy Content**
- ❌ **Current development** - Use organized documentation instead
- ❌ **New team member training** - Start with current governance docs
- ❌ **Architecture decisions** - Reference current ADRs and architecture docs

### **If You Need Something From Legacy**
1. **Check organized docs first** - Content likely exists in new structure
2. **Search by topic** - Use manifest.md to find current location
3. **Ask in team channels** - Others may know where content moved
4. **Update current docs** - If something important is missing, add it properly

## Maintenance

### **Retention Policy**
- **Keep indefinitely** - These files provide valuable historical context
- **No updates** - Legacy content should not be modified
- **Reference only** - Link to current documentation for any ongoing needs

### **Future Cleanup**
If storage becomes an issue, consider:
- Archiving to external storage after 2+ years
- Keeping only major architectural documents
- Maintaining index of what was archived where

---

**Remember**: This archive exists to preserve our work and provide context for future decisions. The real documentation is now properly organized and maintained in the main documentation structure.