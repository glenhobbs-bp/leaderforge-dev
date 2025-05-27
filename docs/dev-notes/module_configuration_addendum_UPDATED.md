# Module Configuration Addendum
*Addendum to LeaderForge Master Technical Specification v2.0*
*Created: January 2025*

## 📋 Purpose

This addendum provides complete, ready-to-use module configurations for all 5 LeaderForge modules. These configurations drive the dynamic UI, agent behaviors, and user experiences without requiring code changes.

**Reference**: LeaderForge Master Technical Specification v2.0 - Module System Configuration

---

## 🗂️ Complete Module Configurations

### 1. Brilliant Movement Module

```json
{
  "id": "brilliant-movement",
  "name": "movement",
  "displayName": "Brilliant Movement",
  "contextKey": "movement",
  "icon": "✨",
  "version": "1.0.0",
  "description": "Relational learning and identity in Christ",
  "theme": {
    "primary": "#3E5E17",
    "secondary": "#74A78E",
    "accent": "#DD8D00",
    "background": "#F8F4F1",
    "neutral": "#E3DDC9",
    "text": "#222222",
    "gradients": {
      "header": "linear-gradient(135deg, #74A78E 0%, #DD8D00 50%, #3E5E17 100%)",
      "card": "linear-gradient(45deg, #3E5E17, #74A78E)"
    }
  },
  "agents": [
    {
      "id": "leader-coach",
      "name": "Your LeaderCoach",
      "avatar": "🎯",
      "capabilities": ["goal_setting", "motivation", "progress_tracking", "identity_coaching"],
      "systemPrompt": "You are the LeaderCoach, a warm and encouraging guide who helps users discover and practice their identity in Christ. You embody Brilliant's New Creation theology, always focusing on who users already are in Christ rather than what they need to fix. Use 'we' language to journey together, celebrate small wins, and ask questions that help users discover truth. Never use shame or guilt as motivators.",
      "priority": 1,
      "status": "online"
    },
    {
      "id": "content-library",
      "name": "Brilliant+ Library",
      "avatar": "📚",
      "capabilities": ["content_search", "recommendations", "transcript_search", "playlist_creation"],
      "systemPrompt": "You are the Content Discovery Agent, helping users find exactly the right content for their current journey. Search the 600+ video library with understanding of context and emotional needs. Present 3 perfect matches rather than overwhelming with options. Use natural phrases and prioritize recent, high-quality content.",
      "priority": 2,
      "status": "online"
    },
    {
      "id": "ambassador-dashboard",
      "name": "Ambassador Dashboard",
      "avatar": "💎",
      "capabilities": ["mlm_analytics", "team_management", "commission_tracking", "growth_insights"],
      "systemPrompt": "You help ambassadors succeed through Kingdom principles of service, generosity, and multiplication. Celebrate both spiritual and financial growth. Focus on team success over individual success, and always connect business success to Kingdom principles. Use professional yet warm tone.",
      "priority": 3,
      "status": "online"
    },
    {
      "id": "community-hub",
      "name": "Community",
      "avatar": "👥",
      "capabilities": ["social_matching", "event_management", "group_connections", "prayer_requests"],
      "systemPrompt": "You foster connections and engagement within the Brilliant community. Help users find study partners, small groups, and like-minded believers. Surface relevant discussions and events. Protect user privacy while building sense of belonging.",
      "priority": 4,
      "status": "online"
    },
    {
      "id": "support-agent",
      "name": "Customer Support",
      "avatar": "🛟",
      "capabilities": ["troubleshooting", "account_management", "billing_support", "escalation"],
      "systemPrompt": "You provide helpful, patient technical and account support while maintaining Brilliant's warm, encouraging tone. Turn support interactions into positive experiences. Escalate appropriately when needed while keeping Kingdom perspective.",
      "priority": 5,
      "status": "online"
    }
  ],
  "entitlements": ["movement-member", "movement-ambassador"],
  "features": {
    "journaling": true,
    "mlm": true,
    "events": true,
    "offline": true,
    "voice": true,
    "smallGroups": true,
    "gatherings": true
  },
  "content": {
    "categories": ["Identity", "Prayer", "Worship", "Kingdom Living", "Relationships", "Rest"],
    "tribeCollections": ["movement-fundamentals", "identity-series", "kingdom-routines"],
    "searchableFields": ["title", "description", "transcript", "instructor"],
    "instructors": ["Graham Cooke", "Theresa Cooke"]
  },
  "navigation": {
    "primaryTabs": ["Library", "Community", "Events", "Ambassador"],
    "quickActions": ["Search Content", "Join Small Group", "Track Progress", "Start Journal"]
  },
  "terminology": {
    "members": "Members",
    "content": "Brilliant+ Library",
    "community": "The Movement",
    "events": "Gatherings & Events"
  }
}
```

### 2. LeaderForge Business Module

```json
{
  "id": "leaderforge-business",
  "name": "leaderforge",
  "displayName": "LeaderForge",
  "contextKey": "leaderforge",
  "icon": "🏢",
  "version": "1.0.0",
  "description": "Turning Potential into Performance",
  "theme": {
    "primary": "#667eea",
    "secondary": "#764ba2",
    "accent": "#4ecdc4",
    "background": "#f8f9ff",
    "neutral": "#e8f4f8",
    "text": "#333333",
    "gradients": {
      "header": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "card": "linear-gradient(45deg, #667eea, #4ecdc4)"
    }
  },
  "agents": [
    {
      "id": "executive-coach",
      "name": "Executive Coach",
      "avatar": "🎯",
      "capabilities": ["leadership_coaching", "team_development", "strategic_planning", "performance_optimization"],
      "systemPrompt": "You are an Executive Coach helping Kingdom leaders excel in business while maintaining Kingdom principles. Focus on creating teams of leaders, not just teams with leaders. Use LeaderForge framework: Leadership, Work Culture, Innovation, and Economics. Be professional yet Kingdom-minded.",
      "priority": 1,
      "status": "online"
    },
    {
      "id": "team-insights",
      "name": "Team Insights",
      "avatar": "📊",
      "capabilities": ["team_analytics", "performance_tracking", "culture_assessment", "progress_monitoring"],
      "systemPrompt": "You provide data-driven insights about team performance, culture, and growth. Help leaders understand their team dynamics and identify opportunities for improvement. Present data in actionable ways that support Kingdom leadership principles.",
      "priority": 2,
      "status": "online"
    },
    {
      "id": "bold-action-tracker",
      "name": "Bold Action Tracker",
      "avatar": "⚡",
      "capabilities": ["goal_tracking", "accountability", "milestone_celebration", "action_planning"],
      "systemPrompt": "You help track and celebrate bold actions. Maximum 3 active bold actions, 21-day maximum duration. Provide encouragement and accountability while celebrating progress. Focus on implementation over planning.",
      "priority": 3,
      "status": "online"
    }
  ],
  "entitlements": ["leaderforge-basic", "leaderforge-premium", "ceo-inner-circle"],
  "features": {
    "journaling": true,
    "mlm": false,
    "events": false,
    "offline": true,
    "voice": false,
    "boldActions": true,
    "teamDashboard": true,
    "weeklyCheckIns": true
  },
  "content": {
    "categories": ["Leadership", "Work Culture", "Innovation", "Economics", "Team Building", "Strategy"],
    "tribeCollections": ["leaderforge-fundamentals", "leadership-modules", "culture-building"],
    "searchableFields": ["title", "description", "transcript", "module"],
    "instructors": ["Dionne van Zyl", "Jenny Taylor"]
  },
  "navigation": {
    "primaryTabs": ["Training", "Team Dashboard", "Bold Actions", "Resources"],
    "quickActions": ["Start Module", "Check Team", "Set Bold Action", "Weekly Review"]
  },
  "terminology": {
    "members": "Leaders",
    "content": "Training Modules",
    "community": "Leadership Network",
    "events": "Executive Sessions"
  }
}
```

### 3. Wealth With God Module

```json
{
  "id": "wealth-with-god",
  "name": "wealth",
  "displayName": "Wealth With God",
  "contextKey": "wealth",
  "icon": "💰",
  "version": "1.0.0",
  "description": "Biblical Financial Stewardship",
  "theme": {
    "primary": "#1a237e",
    "secondary": "#3949ab",
    "accent": "#ff5722",
    "background": "#f5f5f5",
    "neutral": "#e3f2fd",
    "text": "#1a1a1a",
    "gradients": {
      "header": "linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #ff5722 100%)",
      "card": "linear-gradient(45deg, #1a237e, #3949ab)"
    }
  },
  "agents": [
    {
      "id": "financial-coach",
      "name": "Financial Coach",
      "avatar": "💰",
      "capabilities": ["budget_analysis", "investment_guidance", "biblical_finance", "stewardship_coaching"],
      "systemPrompt": "You are a biblical financial advisor who helps users apply Kingdom principles to their finances. Focus on abundance mindset, never scarcity. Teach stewardship from position of God's provision. Connect financial decisions to Kingdom purposes.",
      "priority": 1,
      "status": "online"
    },
    {
      "id": "stewardship-guide",
      "name": "Stewardship Guide",
      "avatar": "📈",
      "capabilities": ["giving_strategies", "tithing_guidance", "generosity_coaching", "kingdom_investment"],
      "systemPrompt": "You guide users in biblical stewardship and generosity. Help them understand giving as worship and investment in God's Kingdom. Teach multiplication principles and wise resource management from abundance perspective.",
      "priority": 2,
      "status": "online"
    }
  ],
  "entitlements": ["wealth-basic", "wealth-premium", "wealth-partner"],
  "features": {
    "journaling": true,
    "mlm": false,
    "events": true,
    "offline": true,
    "voice": false,
    "budgetTracking": true,
    "givingHistory": true
  },
  "content": {
    "categories": ["Stewardship", "Investing", "Giving", "Debt Freedom", "Business", "Multiplication"],
    "tribeCollections": ["wealth-fundamentals", "investment-wisdom", "stewardship-series"],
    "searchableFields": ["title", "description", "transcript", "topic"],
    "instructors": ["Financial Experts", "Kingdom Business Leaders"]
  },
  "navigation": {
    "primaryTabs": ["Learning", "Budget Tools", "Giving", "Community"],
    "quickActions": ["Search Content", "Track Budget", "Plan Giving", "Find Mentor"]
  },
  "terminology": {
    "members": "Stewards",
    "content": "Financial Wisdom",
    "community": "Wealth Builders",
    "events": "Financial Workshops"
  }
}
```

### 4. Brilliant School Module

```json
{
  "id": "brilliant-school",
  "name": "spiritual",
  "displayName": "Brilliant School of Leadership",
  "contextKey": "spiritual",
  "icon": "🎓",
  "version": "1.0.0",
  "description": "Deep Theological Training & Kingdom Leadership",
  "theme": {
    "primary": "#3E5E17",
    "secondary": "#74A78E",
    "accent": "#DD8D00",
    "background": "#F8F4F1",
    "neutral": "#E3DDC9",
    "text": "#222222",
    "gradients": {
      "header": "linear-gradient(135deg, #74A78E 0%, #DD8D00 50%, #3E5E17 100%)",
      "card": "linear-gradient(45deg, #3E5E17, #74A78E)"
    }
  },
  "agents": [
    {
      "id": "theological-mentor",
      "name": "Theological Mentor",
      "avatar": "🎓",
      "capabilities": ["theological_teaching", "spiritual_formation", "leadership_development", "assignment_guidance"],
      "systemPrompt": "You guide students through deep theological study and Kingdom leadership development. Help them understand complex spiritual concepts through relational learning. Focus on identity formation and practical application of Kingdom principles.",
      "priority": 1,
      "status": "online"
    },
    {
      "id": "assignment-coach",
      "name": "Assignment Coach",
      "avatar": "📝",
      "capabilities": ["assignment_guidance", "progress_tracking", "feedback_delivery", "study_planning"],
      "systemPrompt": "You help students complete assignments and track their progress through the 24-week curriculum. Provide encouragement, clarification on requirements, and help with time management. Celebrate milestones and growth.",
      "priority": 2,
      "status": "online"
    }
  ],
  "entitlements": ["bsol-student", "bsol-graduate"],
  "features": {
    "journaling": true,
    "mlm": false,
    "events": true,
    "offline": true,
    "voice": true,
    "assignments": true,
    "cohortGroups": true,
    "mentoring": true
  },
  "content": {
    "categories": ["Theology", "Leadership", "Spiritual Formation", "Kingdom Principles", "Character Development"],
    "tribeCollections": ["bsol-core-modules", "leadership-training", "spiritual-formation"],
    "searchableFields": ["title", "description", "transcript", "module", "week"],
    "instructors": ["Graham Cooke", "Dionne van Zyl", "Jenny Taylor"]
  },
  "navigation": {
    "primaryTabs": ["Curriculum", "Assignments", "Cohort", "Resources"],
    "quickActions": ["Current Module", "Submit Assignment", "Join Discussion", "Contact Mentor"]
  },
  "terminology": {
    "members": "Students",
    "content": "Curriculum",
    "community": "Cohort",
    "events": "Live Sessions"
  }
}
```

### 5. Small Group Hub Module

```json
{
  "id": "small-group-hub",
  "name": "smallgroup",
  "displayName": "Small Group Hub",
  "contextKey": "smallgroup",
  "icon": "👥",
  "version": "1.0.0",
  "description": "Community Learning & Group Facilitation",
  "theme": {
    "primary": "#3E5E17",
    "secondary": "#74A78E",
    "accent": "#DD8D00",
    "background": "#F8F4F1",
    "neutral": "#E3DDC9",
    "text": "#222222",
    "gradients": {
      "header": "linear-gradient(135deg, #74A78E 0%, #DD8D00 50%, #3E5E17 100%)",
      "card": "linear-gradient(45deg, #3E5E17, #74A78E)"
    }
  },
  "agents": [
    {
      "id": "group-facilitator",
      "name": "Facilitator Guide",
      "avatar": "🎯",
      "capabilities": ["facilitation_guidance", "discussion_prompts", "group_dynamics", "conflict_resolution"],
      "systemPrompt": "You help small group leaders facilitate meaningful discussions and build community. Provide discussion questions, handle group dynamics issues, and suggest activities that deepen relationships and spiritual growth.",
      "priority": 1,
      "status": "online"
    },
    {
      "id": "community-connector",
      "name": "Community Connector",
      "avatar": "🤝",
      "capabilities": ["group_matching", "event_coordination", "prayer_requests", "member_support"],
      "systemPrompt": "You help connect people with the right small groups and facilitate community building. Match people based on location, interests, and spiritual journey stage. Coordinate group activities and prayer support.",
      "priority": 2,
      "status": "online"
    }
  ],
  "entitlements": ["smallgroup-member", "smallgroup-leader"],
  "features": {
    "journaling": true,
    "mlm": false,
    "events": true,
    "offline": true,
    "voice": false,
    "groupManagement": true,
    "prayerRequests": true,
    "eventPlanning": true
  },
  "content": {
    "categories": ["Group Studies", "Facilitation", "Community Building", "Prayer", "Worship", "Service"],
    "tribeCollections": ["group-studies", "facilitator-resources", "community-building"],
    "searchableFields": ["title", "description", "transcript", "study_type"],
    "instructors": ["Bridget van Zyl", "Jenny Taylor"]
  },
  "navigation": {
    "primaryTabs": ["My Groups", "Studies", "Events", "Resources"],
    "quickActions": ["Join Group", "Start Study", "Prayer Request", "Schedule Event"]
  },
  "terminology": {
    "members": "Group Members",
    "content": "Group Studies",
    "community": "Small Groups",
    "events": "Group Gatherings"
  }
}
```

---

## 🎨 Theme System Implementation

### CSS Variable Generation
Each module's theme automatically generates CSS variables:

```css
/* Example for Wealth With God module */
:root[data-module="wealth"] {
  --module-primary: #1a237e;
  --module-secondary: #3949ab;
  --module-accent: #ff5722;
  --module-background: #f5f5f5;
  --module-neutral: #e3f2fd;
  --module-text: #1a1a1a;
  --module-gradient-header: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #ff5722 100%);
  --module-gradient-card: linear-gradient(45deg, #1a237e, #3949ab);
}
```

### Dynamic Theme Switching
```typescript
// Module theme application
export function applyModuleTheme(contextConfig: ModuleConfig) {
  const root = document.documentElement;

  Object.entries(contextConfig.theme).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--module-${key}`, value);
    } else if (typeof value === 'object') {
      // Handle gradients object
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--module-${key}-${subKey}`, subValue as string);
      });
    }
  });

  root.setAttribute('data-module', contextConfig.contextKey);
}
```

---

## 🤖 Agent Prompt Templates

### Base Agent Prompt Structure
```typescript
interface AgentPromptTemplate {
  systemPrompt: string;
  conversationStarters: string[];
  responsePatterns: {
    acknowledgment: string;
    encouragement: string;
    guidance: string;
    handoff: string;
  };
  prohibitedLanguage: string[];
  requiredPhrasing: string[];
}

// Example: LeaderCoach base template
const leaderCoachTemplate: AgentPromptTemplate = {
  systemPrompt: `You are the LeaderCoach, a warm and encouraging guide who helps users discover and practice their identity in Christ.

Core Beliefs:
- The old has gone, the new has come (2 Cor 5:17)
- Grace is God's empowering presence, not just forgiveness
- We live FROM our position in Christ, not toward it
- Delight leads to discipline naturally
- Rest is our weapon against anxiety and stress

Communication Style:
- Warm, encouraging, and relational
- Use "we" language to journey together
- Celebrate small wins and progress
- Ask questions that help users discover truth
- Share from an "elevated perspective" (Kingdom view)

Never:
- Use shame or guilt as motivators
- Focus on behavior modification
- Suggest God is distant or disappointed
- Imply users need to earn God's favor`,

  conversationStarters: [
    "Welcome to {module}! I'm so excited to journey with you as we discover more of who you already are in Christ. What brings you here today?",
    "Hello! I'm your LeaderCoach, and I'm here to help you practice living from your new nature. What area of life would you like to explore together?"
  ],

  responsePatterns: {
    acknowledgment: "I hear that {situation} feels challenging right now.",
    encouragement: "I noticed you {specific_action} - that's wonderful! That's evidence of your {identity_aspect} coming through.",
    guidance: "From God's perspective, this is actually an opportunity to {opportunity}. Remember, you're {identity_truth}, which means {capability}.",
    handoff: "I'll connect you with our {agent_name} who specializes in {capability}. They'll be able to help you with {specific_need}."
  },

  prohibitedLanguage: [
    "you should", "you need to", "you must", "you're failing", "try harder", "do better"
  ],

  requiredPhrasing: [
    "practicing WITH God", "your new nature", "from your position in Christ", "evidence of transformation"
  ]
};
```

---

## 🔧 Configuration Validation

### Module Configuration Schema Validation
```typescript
import { z } from 'zod';

const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  capabilities: z.array(z.string()),
  systemPrompt: z.string().min(100),
  priority: z.number().min(1).max(10),
  status: z.enum(['online', 'offline', 'maintenance'])
});

const ModuleConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  contextKey: z.string(),
  icon: z.string(),
  version: z.string(),
  description: z.string(),
  theme: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    neutral: z.string(),
    text: z.string(),
    gradients: z.object({
      header: z.string(),
      card: z.string()
    })
  }),
  agents: z.array(AgentConfigSchema),
  entitlements: z.array(z.string()),
  features: z.record(z.boolean()),
  content: z.object({
    categories: z.array(z.string()),
    tribeCollections: z.array(z.string()),
    searchableFields: z.array(z.string()),
    instructors: z.array(z.string())
  }),
  navigation: z.object({
    primaryTabs: z.array(z.string()),
    quickActions: z.array(z.string())
  }),
  terminology: z.record(z.string())
});

// Validation function
export function validateModuleConfig(config: unknown): ModuleConfig {
  return ModuleConfigSchema.parse(config);
}
```

---

## 🚀 Implementation Instructions

### 1. File Organization
```
modules/
├── schemas/
│   └── module-config.schema.json
├── configs/
│   ├── brilliant-movement.json
│   ├── leaderforge-business.json
│   ├── wealth-with-god.json
│   ├── brilliant-school.json
│   └── small-group-hub.json
├── themes/
│   ├── brilliant-movement.css
│   ├── leaderforge-business.css
│   ├── wealth-with-god.css
│   ├── brilliant-school.css
│   └── small-group-hub.css
└── prompts/
    ├── leader-coach-prompts.ts
    ├── content-library-prompts.ts
    └── agent-prompt-templates.ts
```

### 2. Module Loader Service
```typescript
// apps/api/src/modules/module-loader.service.ts
import fs from 'fs/promises';
import path from 'path';

export class ModuleLoaderService {
  private contextConfigs = new Map<string, ModuleConfig>();

  async loadAllModules(): Promise<void> {
    const configDir = path.join(process.cwd(), 'modules/configs');
    const configFiles = await fs.readdir(configDir);

    for (const file of configFiles.filter(f => f.endsWith('.json'))) {
      const configPath = path.join(configDir, file);
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = validateModuleConfig(JSON.parse(configData));

      this.contextConfigs.set(config.id, config);
    }
  }

  getModule(moduleId: string): ModuleConfig | null {
    return this.contextConfigs.get(moduleId) || null;
  }

  getAllModules(): ModuleConfig[] {
    return Array.from(this.contextConfigs.values());
  }
}
```

### 3. Usage in Components
```typescript
// apps/web/components/ModuleSwitcher.tsx
import { useModuleConfig } from '@/hooks/useModuleConfig';

export function ModuleSwitcher() {
  const { modules, currentModule, switchModule } = useModuleConfig();

  return (
    <Select value={currentModule} onValueChange={switchModule}>
      {modules.map(module => (
        <SelectItem key={module.id} value={module.id}>
          <span className="mr-2">{module.icon}</span>
          {module.displayName}
        </SelectItem>
      ))}
    </Select>
  );
}
```

---

## ✅ Validation Checklist

Before implementing, verify:

- [ ] All 5 module JSON files are valid and complete
- [ ] Agent system prompts align with Brilliant theology
- [ ] Theme colors are accessible (WCAG compliance)
- [ ] Navigation structure makes sense for each module
- [ ] Entitlement mappings match business rules
- [ ] Feature flags align with module capabilities
- [ ] Terminology is consistent with brand voice

---

**This addendum provides complete, ready-to-use module configurations that can be implemented immediately without requiring code changes to add new modules or modify existing ones.**
---

## 🧩 Module Configuration Enhancements

### 📜 Config Schema Versioning
Each module config must specify a `configVersion`, using semantic versioning (e.g., `1.2.0`). This enables:

- Backward compatibility
- Migrations and deprecations
- Validation enforcement

### 🧠 Dynamic Module Registry
All modules should register themselves using a `manifest.json` file that describes:
- Module name and version
- Inputs/outputs
- Supported config schema version(s)
- Optional UI components

### 🧪 Module Config Testing
Include unit tests for:
- Validation of sample config files
- Edge cases or misconfigurations
- Fallback behavior

Add `tests/config-validation/` per module.

### 🎛️ Feature Flags and Overrides
Support flags in module configs such as:
```json
{
  "featureFlags": {
    "betaFeatureEnabled": true,
    "logVerbose": false
  }
}
```

This enables controlled rollout and testing.

