# LeaderForge Critical Architecture Foundations

## 🏛️ Core Architecture: Modular Monolith

### Why Modular Monolith?
- **Simplicity**: Single deployment, easier debugging
- **Performance**: No network calls between modules
- **Flexibility**: Can extract modules to services later if needed
- **Pure Libraries**: Keep CopilotKit and LangGraph untouched for easy upgrades

### Module Boundaries
```typescript
// Each module is self-contained with clear interfaces
interface Module {
  name: string;
  routes: Router;
  events: EventEmitter;
  jobs: JobDefinition[];
  dependencies: string[]; // Other modules this depends on
}

// Modules communicate only through:
// 1. Event bus (async)
// 2. Shared database with clear ownership
// 3. Well-defined service interfaces
```

### 1. Journaling with Local Storage & Voice Transcription

**Foundation Requirements NOW:**
```typescript
// packages/shared/types/storage.types.ts
interface SecureStorage {
  encrypt(data: any): Promise<EncryptedData>;
  decrypt(data: EncryptedData): Promise<any>;
  sync(): Promise<SyncResult>;
}

// Establish patterns even if not implementing
interface JournalEntry {
  id: string;
  content: string;
  voiceUrl?: string;
  transcript?: string;
  localOnly: boolean;
  encrypted: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict';
}
```

**Architecture Impact:**
- **Offline-First Pattern**: Design all features to work offline with sync
- **Encryption Strategy**: Use Web Crypto API for client-side encryption
- **Sync Protocol**: Implement CRDT or operational transformation for conflict resolution
- **Storage Abstraction**: Create interface that can use IndexedDB, localStorage, or future solutions

**Implementation Approach:**
```typescript
// packages/ai-core/storage/secure-storage.ts
export class SecureStorage {
  private crypto = new ClientCrypto();
  private syncEngine = new SyncEngine();
  
  async store(key: string, data: any, options: StorageOptions) {
    if (options.encrypt) {
      data = await this.crypto.encrypt(data, options.userKey);
    }
    
    // Store locally first
    await this.localStore.set(key, data);
    
    // Queue for sync
    if (!options.localOnly) {
      await this.syncEngine.queue(key, data);
    }
  }
}
```

### 2. Configuration-Driven Module System

**Module Schema Definition:**
```typescript
// packages/shared/schemas/module.schema.ts
interface ModuleConfig {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  agents: AgentConfig[];
  content: ContentConfig;
  features: FeatureFlags;
  entitlements: string[];
  customization: {
    branding: BrandingConfig;
    terminology: Record<string, string>;
    layouts: LayoutConfig[];
  };
}

// Module registry
interface ModuleRegistry {
  modules: Map<string, ModuleConfig>;
  loadModule(config: ModuleConfig): Promise<Module>;
  validateModule(config: unknown): ModuleConfig;
}
```

**Dynamic Module Loader:**
```typescript
// apps/web/lib/module-loader.ts
export class ModuleLoader {
  async loadFromConfig(configUrl: string): Promise<Module> {
    const config = await this.fetchConfig(configUrl);
    const validated = this.validateConfig(config);
    
    return {
      id: validated.id,
      agents: await this.loadAgents(validated.agents),
      theme: this.loadTheme(validated.theme),
      routes: this.generateRoutes(validated.navigation),
      entitlements: validated.entitlements
    };
  }
}
```

**JSON Configuration Example:**
```json
{
  "id": "wealth-with-god",
  "name": "wealth",
  "displayName": "Wealth With God",
  "icon": "💰",
  "theme": {
    "primary": "#1a237e",
    "secondary": "#3949ab",
    "accent": "#ff5722"
  },
  "agents": [
    {
      "id": "financial-coach",
      "name": "Financial Coach",
      "capabilities": ["budget_analysis", "investment_guidance", "biblical_finance"],
      "prompts": {
        "system": "You are a biblical financial advisor..."
      }
    }
  ],
  "content": {
    "categories": ["Stewardship", "Investing", "Giving", "Debt Freedom"],
    "sources": ["wealth-content-library"]
  },
  "entitlements": ["wealth-basic", "wealth-premium"]
}
```

### 3. Flexible Entitlement & Licensing System

**Database Schema:**
```sql
-- Organizations with flexible hierarchy
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  org_type TEXT NOT NULL, -- 'company', 'team', 'church', 'small_group', etc.
  parent_org_id UUID REFERENCES core.organizations(id),
  level INTEGER DEFAULT 0,
  path TEXT[], -- Array of org IDs from root
  module_id TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User organization membership
CREATE TABLE core.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id),
  org_id UUID NOT NULL REFERENCES core.organizations(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES core.users(id),
  joined_at TIMESTAMPTZ,
  CONSTRAINT unique_user_org UNIQUE (user_id, org_id)
);

-- Provisioning models per module
CREATE TABLE core.provisioning_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN (
    'org_hierarchy',    -- LeaderForge: Company->Team->User
    'direct_user',      -- Brilliant School: Direct to users
    'delegated_admin'   -- Wealth: Admin manages users
  )),
  config JSONB NOT NULL DEFAULT '{}'
);

-- Organization entitlements (seats/licenses)
CREATE TABLE core.org_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES core.organizations(id),
  entitlement_id UUID NOT NULL REFERENCES core.entitlements(id),
  quantity INTEGER DEFAULT 1, -- Number of seats
  allocated INTEGER DEFAULT 0, -- How many assigned
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT check_allocation CHECK (allocated <= quantity)
);

-- Enhanced user entitlements
ALTER TABLE core.user_entitlements 
  ADD COLUMN org_entitlement_id UUID REFERENCES core.org_entitlements(id);

-- Email validation for secure provisioning
CREATE TABLE core.email_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  validation_type TEXT NOT NULL,
  user_id UUID REFERENCES core.users(id),
  org_id UUID REFERENCES core.organizations(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  validated_at TIMESTAMPTZ
);
```

**Runtime Enforcement:**
```typescript
// Flexible provisioning strategies
export class ProvisioningService {
  private strategies = {
    'org_hierarchy': new HierarchicalProvisioning(),
    'direct_user': new DirectProvisioning(),
    'delegated_admin': new DelegatedAdminProvisioning()
  };
  
  async provision(params: ProvisioningParams) {
    const model = await this.getProvisioningModel(params.moduleId);
    const strategy = this.strategies[model.type];
    
    // Execute with audit trail
    return this.db.transaction(async (trx) => {
      const result = await strategy.provision(params);
      await this.auditLog.record(params, result);
      return result;
    });
  }
}

// Magic link authentication
export class MagicLinkAuth {
  async sendMagicLink(email: string) {
    const validation = await this.emailValidation.create({
      email,
      type: 'magic_link',
      token: generateSecureToken()
    });
    
    await this.emailService.send({
      to: email,
      template: 'magic_link',
      data: { url: `${BASE_URL}/auth/magic/${validation.token}` }
    });
  }
  
  async validateToken(token: string) {
    const validation = await this.emailValidation.validate(token);
    return this.createSession(validation.userId);
  }
}
```

**Key Features:**
- **Flexible Hierarchy**: Not hardcoded to company/team
- **Three Provisioning Models**: Covers all use cases
- **Email Validation**: Required for all provisioning
- **Magic Links**: Simple, secure authentication
- **Optional 2FA**: Per organization settings
- **Seat Management**: Track and allocate licenses

### 4. Code Review Automation

**Recommended Stack:**
- **CodeRabbit**: Good for AI-powered reviews
- **Danger.js**: More customizable, can enforce project-specific rules
- **GitHub Actions**: Custom checks for architecture compliance

**Custom Architecture Checks:**
```yaml
# .github/workflows/architecture-check.yml
name: Architecture Compliance
on: [pull_request]

jobs:
  check-patterns:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Agent Pattern Compliance
        run: |
          npx ts-node scripts/check-agent-patterns.ts
      
      - name: Check Module Configuration
        run: |
          npx ts-node scripts/validate-module-configs.ts
      
      - name: Check Entitlement Usage
        run: |
          npx ts-node scripts/check-entitlements.ts
```

## 🔧 Additional Critical Foundations

## 🔧 Additional Critical Foundations

### 5. Tribe Social CMS Integration

**Why Critical Now:** Content management system for 600+ videos
```typescript
// packages/shared/services/tribe-service.ts
export class TribeService {
  // Content retrieval with caching
  async getContent(id: string): Promise<TribeContent> {
    const cached = await this.cache.get(`tribe:content:${id}`);
    if (cached) return cached;
    
    const content = await this.tribeApi.get(`/content/${id}`);
    await this.cache.set(`tribe:content:${id}`, content, 300);
    return content;
  }
  
  // Search with module context
  async searchContent(query: string, moduleId: string): Promise<TribeContent[]> {
    const platformId = this.getPlatformId(moduleId);
    return this.tribeApi.get('/content/search', { q: query, platformId });
  }
}

// User synchronization
export class UserSyncService {
  async syncToTribe(user: User): Promise<void> {
    const tribeUser = await this.tribe.users.upsert({
      email: user.email,
      name: user.full_name,
      platformId: this.mapModuleToPlatform(user.current_module)
    });
    
    // Store mapping
    await this.db.users.update(user.id, {
      metadata: { ...user.metadata, tribe_user_id: tribeUser.id }
    });
  }
}
```

### 6. Event Sourcing for Agent Conversations

**Why Critical Now:** Enables conversation replay, debugging, and analytics
```typescript
// packages/shared/events/conversation-events.ts
interface ConversationEvent {
  id: string;
  conversationId: string;
  userId: string;
  agentId: string;
  eventType: 'message' | 'handoff' | 'action' | 'error';
  payload: any;
  timestamp: Date;
  moduleContext: string;
}

// Event store pattern
export class ConversationEventStore {
  async append(event: ConversationEvent): Promise<void> {
    // Append-only storage
    await this.db.conversationEvents.insert(event);
    await this.publishToStream(event);
  }
  
  async replay(conversationId: string): Promise<ConversationEvent[]> {
    // Reconstruct conversation from events
  }
}
```

### 6. Plugin Architecture for Extensibility

**Module Plugin System:**
```typescript
// packages/shared/plugins/plugin-system.ts
interface Plugin {
  id: string;
  version: string;
  moduleId: string;
  
  // Lifecycle hooks
  onModuleLoad?: (context: ModuleContext) => Promise<void>;
  onAgentRegister?: (agent: Agent) => void;
  onContentRender?: (content: Content) => Content;
  
  // Extension points
  agents?: Agent[];
  components?: ComponentMap;
  routes?: RouteConfig[];
}

export class PluginManager {
  async loadPlugin(plugin: Plugin): Promise<void> {
    // Validate plugin
    // Register with appropriate systems
    // Initialize plugin
  }
}
```

### 7. Content Versioning & CDN Strategy

**Content Version Control:**
```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id),
  version INTEGER NOT NULL,
  changes JSONB,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  cdn_url TEXT,
  UNIQUE(content_id, version)
);
```

**CDN Integration:**
```typescript
// packages/shared/cdn/content-delivery.ts
export class ContentDelivery {
  async uploadContent(file: File, metadata: ContentMetadata): Promise<CDNResult> {
    // Upload to Cloudflare Stream for videos
    // Generate signed URLs
    // Cache invalidation strategy
  }
}
```

### 8. Offline-First Architecture

**Service Worker Strategy:**
```typescript
// apps/web/service-worker.ts
self.addEventListener('fetch', (event) => {
  // Cache API responses
  // Queue mutations for sync
  // Serve from cache when offline
});

// Sync manager
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-conversations') {
    await syncConversations();
  }
});
```

### 9. Analytics Pipeline

**Learning Analytics Foundation:**
```typescript
// packages/shared/analytics/learning-analytics.ts
interface LearningEvent {
  userId: string;
  moduleId: string;
  eventType: 'content_view' | 'content_complete' | 'assessment_score' | 'milestone_achieved';
  contentId?: string;
  duration?: number;
  score?: number;
  metadata: Record<string, any>;
}

export class AnalyticsPipeline {
  async track(event: LearningEvent): Promise<void> {
    // Local buffering
    // Batch upload
    // Real-time dashboard updates
  }
}
```

### 10. Multi-Tenant Architecture

**Tenant Isolation:**
```sql
-- Add tenant_id to all tables
ALTER TABLE users ADD COLUMN tenant_id UUID;
ALTER TABLE content ADD COLUMN tenant_id UUID;

-- RLS policies for tenant isolation
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

## 📋 Updated Day 1 Checklist

### Must-Have Foundations:
- [x] Module configuration schema and loader
- [x] Entitlement system database schema
- [x] Event sourcing for conversations
- [x] Offline-first storage abstraction
- [x] Plugin architecture interfaces
- [x] Multi-tenant database design
- [x] Analytics event schema
- [x] CDN integration pattern

### Can Defer (But Design For):
- [ ] Voice transcription implementation (but design storage)
- [ ] Full offline sync (but use offline-first patterns)
- [ ] Complete plugin system (but define interfaces)
- [ ] Advanced analytics (but capture events)

## 🚀 Revised Project Structure

```
leaderforge/
├── apps/
│   ├── web/
│   ├── api/
│   └── admin/              # Module configuration UI
├── packages/
│   ├── shared/
│   ├── database/
│   ├── ai-core/
│   ├── module-system/      # NEW: Module loading system
│   ├── entitlements/       # NEW: Licensing logic
│   ├── analytics/          # NEW: Analytics pipeline
│   └── offline-sync/       # NEW: Offline capabilities
├── modules/                # NEW: Module configurations
│   ├── brilliant-movement.json
│   ├── leaderforge.json
│   ├── wealth-with-god.json
│   └── schemas/
└── plugins/                # NEW: Optional plugins
```

## 🔴 Critical Decisions Needed Now:

1. **Offline Strategy**: Full offline or online-first with selective offline?
2. **Tenant Model**: Single shared instance or isolated deployments?
3. **Plugin Security**: Sandboxed execution or trusted plugins only?
4. **Analytics Depth**: Basic metrics or full learning analytics from day 1?
5. **Module Distribution**: Hosted configs or packaged with deployment?

These architectural decisions will significantly impact the implementation approach and must be decided before starting development.
---

## 🧠 Architecture Enhancements

### 🧩 Dynamic Module Loader
Introduce a runtime module loader in `libs/runtime-engine` to dynamically:
- Resolve which modules to load based on active experience config
- Support lazy loading to reduce bundle size
- Enable feature flags or A/B testing

### 🔐 Experience Isolation
Ensure modules are sandboxed per experience to prevent leakage across tenants:
- Namespace module state by experience ID
- Validate config against schema before activation

### 📦 Module Registry
Each module should expose a `manifest.json` describing:
- Name, version, description
- Inputs and outputs
- UI components registered
- Permissions required

This allows auto-documentation and dynamic UI generation.

### 📜 Declarative Agent Composition
Explore defining LangGraph DAGs through config DSL:
```json
{
  "agents": ["retriever", "planner", "executor"],
  "flow": [
    ["retriever", "planner"],
    ["planner", "executor"]
  ]
}
```

Allows low-code creation of custom agent orchestration flows per module/experience.

