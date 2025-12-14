# How-To Guides

This directory contains practical, step-by-step guides for common development tasks in the LeaderForge platform.

**File:** docs/engineering/how-to/README.md
**Purpose:** Index of step-by-step development guides
**Owner:** Engineering Team
**Tags:** how-to, guides, development, tutorials
**Last Updated:** 2024-01-15

## Available Guides

### Widget Development
- **[Schema-Driven Widgets](./schema-driven-widgets.md)** - Complete guide for creating, registering, and using schema-driven widgets
  - Creating new widgets with backwards compatibility
  - Widget registration and discovery
  - Agent integration patterns
  - Schema design best practices
  - Testing strategies
  - Universal schema structure reference

### Coming Soon
- **Component System** - Building reusable UI components
- **Agent Development** - Creating and deploying new agents
- **API Integration** - Connecting external services
- **Database Migrations** - Managing schema changes
- **Performance Optimization** - Improving application performance
- **Testing Strategies** - Comprehensive testing approaches

### UI Development
- **[How to Add or Change Components](../../how-to-add-or-change-components.md)** - Widget and component development
- **[How to Add or Change Styles](../../how-to-add-or-change-styles.md)** - Styling and theming guides
- **[How to Add or Change Themes](../../how-to-add-or-change-themes.md)** - Theme customization

### System Development
- **[How to Add or Change Tools](../../how-to-add-or-change-tools.md)** - Tool development and registration
- **[How to Add or Change Contexts](../../how-to-add-or-change-contexts.md)** - Context configuration and management

## Guide Structure

Each how-to guide follows this structure:
1. **Overview** - What the guide covers
2. **Prerequisites** - What you need to know first
3. **Step-by-step instructions** - Detailed implementation steps
4. **Examples** - Working code examples
5. **Testing** - How to verify your implementation
6. **Troubleshooting** - Common issues and solutions
7. **Reference** - Additional resources and appendices

## Contributing

When adding new how-to guides:
1. Use the established template structure
2. Include practical, working examples
3. Provide troubleshooting sections
4. Add comprehensive testing instructions
5. Update this README with the new guide

## Quick Reference

- **Widget Registration**: Add to `WidgetDispatcher.tsx` and export from `index.ts`
- **Schema Structure**: All widgets must implement the universal schema pattern
- **Testing**: Use the `/test-widgets` page for integration testing
- **File Headers**: Include standardized headers with Purpose, Owner, and Tags

---

**Note**: These guides are actively maintained. If you find outdated information or have suggestions for new guides, please create an issue or contact the engineering team.