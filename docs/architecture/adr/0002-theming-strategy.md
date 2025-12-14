# ADR-0002: Theming Strategy (Option 2 - Tenant + Org Override)

## Status
**Accepted** - December 2024

## Context

LeaderForge is a multi-tenant LMS where:
- **Tenants** (like i49 Group) are training providers who want their own branding
- **Organizations** are customer companies whose employees use the platform
- Users should see appropriate branding based on their context

### Requirements
1. Tenants must be able to white-label the platform
2. Organizations may want to see their company logo
3. Design consistency should be maintained
4. Implementation complexity should be manageable for MVP

## Decision

Implement **Option 2: Tenant-Level Full Theming + Organization-Level Partial Override**

### Theme Hierarchy
```
Platform Defaults → Tenant Theme (Full) → Organization Override (Partial)
```

### Tenant-Level Theming (Full Control)
| Property | Description |
|----------|-------------|
| `logo_url` | Primary logo |
| `favicon_url` | Browser favicon |
| `display_name` | Tenant name |
| `primary` | Main brand color |
| `secondary` | Secondary color |
| `accent` | Highlight color |
| `background` | Page background |
| `surface` | Card/panel backgrounds |
| `text_primary` | Main text color |
| `text_secondary` | Muted text color |
| `font_family` | Typography choice |
| `border_radius` | UI corner style |

### Organization-Level Override (Partial)
| Property | Description |
|----------|-------------|
| `logo_url` | Override tenant logo |
| `primary_color` | Override primary only |
| `display_name` | Organization name |
| `use_tenant_theme` | Toggle to disable overrides |

## Implementation

### Database Schema
```sql
-- Tenant theme (full)
CREATE TABLE core.tenants (
  id UUID PRIMARY KEY,
  tenant_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  theme JSONB DEFAULT '{}'::jsonb,
  -- theme contains full ThemeConfig
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization branding (partial override)
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES core.tenants(id),
  name TEXT NOT NULL,
  branding JSONB DEFAULT '{}'::jsonb,
  -- branding contains: logo_url, primary_color, display_name, use_tenant_theme
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Theme Resolution
```typescript
function resolveTheme(tenant: Tenant, org?: Organization): Theme {
  // Start with platform defaults
  let theme = PLATFORM_DEFAULTS;
  
  // Apply tenant theme
  if (tenant.theme) {
    theme = { ...theme, ...tenant.theme };
  }
  
  // Apply org overrides (if enabled)
  if (org?.branding && !org.branding.use_tenant_theme) {
    if (org.branding.logo_url) {
      theme.logo_url = org.branding.logo_url;
    }
    if (org.branding.primary_color) {
      theme.primary = org.branding.primary_color;
    }
  }
  
  return theme;
}
```

### CSS Custom Properties
```css
:root {
  --primary: theme.primary;
  --secondary: theme.secondary;
  --accent: theme.accent;
  --background: theme.background;
  --surface: theme.surface;
  --text-primary: theme.text_primary;
  --text-secondary: theme.text_secondary;
}
```

## Consequences

### Positive
- **White-label ready**: Tenants can fully brand the platform
- **Org identity**: Organizations see their logo
- **Design consistency**: Tenant controls most styling
- **Manageable complexity**: Limited org override reduces edge cases
- **Extensible**: Schema supports full org theming for future

### Negative
- **Limited org control**: Organizations can only change logo and primary color
- **Potential conflicts**: Org primary color might not work well with tenant theme

### Mitigations
- Provide color contrast validation in admin UI
- Allow tenants to disable org overrides if needed
- Document recommended color combinations

## Alternatives Considered

### Option 1: Tenant-Only Theming
**Rejected**: Organizations expect to see their company logo. This is a common enterprise requirement.

### Option 3: Full Flexibility (Both Full Theme)
**Deferred**: More complexity than needed for MVP. Schema supports this for future expansion.

## Future Considerations

If Option 3 is needed later:
1. Extend `organizations.branding` to include full theme properties
2. Update theme resolution to apply more org properties
3. Add org theme editor to admin UI

No database migration needed - just enable more fields.

## Related Decisions

- ADR-0001: Fresh Start Architecture
- Design System documentation (Step 1.3)

