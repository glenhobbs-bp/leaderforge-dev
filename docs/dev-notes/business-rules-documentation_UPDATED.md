# LeaderForge Business Rules Documentation

## Overview

This document defines the business rules and logic that govern the LeaderForge platform's behavior, ensuring consistent application of Brilliant's theology, business model, and user experience principles.

> **⚠️ CRITICAL ARCHITECTURAL CHANGE**: We are moving from a complex agent-driven entitlement system to a **simplified, deterministic database-driven approach**. See [Simplified Entitlement System](./simplified-entitlement-system.md) for the new architecture that replaces much of the complexity below.

## User Access & Entitlements

### Membership Types & Access Rules

#### Movement Members ($47/month or $397/year)

```typescript
interface MovementMemberAccess {
  brilliantPlus: true;
  gatherings: true;
  smallGroups: true;
  events: {
    freeTickets: true;
    eventsList: ["Limitless Life with God", "Brilliance26"];
  };
  contentLibrary: {
    modules: ["movement"];
    videoLimit: "unlimited";
  };
}

// Business Rule: Auto-upgrade legacy subscribers
if (
  user.subscription.type === "BrilliantPlus" &&
  user.subscription.amount <= 25.0
) {
  user.membership = "Movement Member";
  user.price = user.subscription.amount; // Honor original price
}
```

#### Ambassadors ($10/year)

```typescript
interface AmbassadorAccess {
  brilliantPlus: false; // No platform access
  canPromote: true;
  referralTracking: true;
  monthlyTraining: true;
  commissionAccess: true;
  debitCard: true; // US only
}

// Commission Rules
const commissionStructure = {
  level1: 0.25, // 25%
  level2: 0.1, // 10%
  level3: 0.05, // 5%
  level4: 0.03, // 3%
  level5: 0.03, // 3%
  level6: 0.02, // 2%
  level7: 0.02, // 2%
};

// Business Rule: Commission calculation
function calculateCommission(sale: Sale, ambassador: Ambassador) {
  const level = getAmbassadorLevel(sale.referrer, ambassador);
  const rate = commissionStructure[`level${level}`] || 0;
  return sale.amount * rate;
}
```

#### Partners ($10-$500+/month)

```typescript
interface PartnerAccess {
  gatherings: true;
  smallGroups: true;
  brilliantPlus: false;
  taxDeductible: true; // Via 508 non-profit
  levels: {
    essential: { amount: 10; perks: "basic" };
    covenant: { amount: 100; perks: "enhanced" };
    kingdomBuilder: { amount: 200; perks: "premium" };
    legacyMaker: { amount: 500; perks: "exclusive" };
  };
}
```

### Module Access Rules

```typescript
// Module access determination
function canAccessModule(user: User, moduleId: string): boolean {
  // Check direct module access
  if (user.enabledModules.includes(moduleId)) {
    return true;
  }

  // Check organization-based access
  const orgAccess = user.organizations
    .filter((org) => org.moduleId === moduleId)
    .some((org) => org.memberStatus === "active");

  if (orgAccess) return true;

  // Check entitlement-based access
  const entitlements = getUserEntitlements(user.id);
  const moduleEntitlements = getModuleRequiredEntitlements(moduleId);

  return hasRequiredEntitlements(entitlements, moduleEntitlements);
}

// Module switching rules
function switchModule(user: User, targetModule: string): SwitchResult {
  if (!canAccessModule(user, targetModule)) {
    return {
      success: false,
      reason: "NO_ACCESS",
      suggestedAction: "upgrade",
    };
  }

  // Preserve conversation context if same agent exists
  const currentAgent = getCurrentActiveAgent(user);
  const targetAgent = findEquivalentAgent(currentAgent, targetModule);

  return {
    success: true,
    previousModule: user.currentModule,
    newModule: targetModule,
    agentHandoff:
      currentAgent !== targetAgent
        ? {
            from: currentAgent,
            to: targetAgent,
            preserveContext: true,
          }
        : null,
  };
}
```

## Content Access & Progress Rules

### Content Availability

```typescript
// Content visibility rules
function isContentAvailable(content: Content, user: User): boolean {
  // Check module availability
  const hasModuleAccess = content.availableModules.some((module) =>
    canAccessModule(user, module),
  );

  if (!hasModuleAccess) return false;

  // Check content-specific entitlements
  if (content.requiredEntitlement) {
    return userHasEntitlement(user, content.requiredEntitlement);
  }

  // Check if content is published
  if (!content.publishedAt || content.publishedAt > new Date()) {
    return false;
  }

  return true;
}

// Search filtering rules
function filterSearchResults(results: Content[], user: User): Content[] {
  return results
    .filter((content) => isContentAvailable(content, user))
    .map((content) => ({
      ...content,
      // Hide future module content from search snippets
      description: content.availableModules.every((m) =>
        canAccessModule(user, m),
      )
        ? content.description
        : content.description.substring(0, 100) + "...",
    }));
}
```

### Progress Tracking Rules

```typescript
// Progress update rules
interface ProgressRules {
  // Minimum watch time for progress to count
  minimumWatchTime: 30; // seconds

  // Update frequency
  updateInterval: 30; // seconds

  // Completion threshold
  completionThreshold: 0.9; // 90% watched

  // Resume position buffer
  resumeBuffer: 5; // seconds before last position
}

function updateProgress(
  userId: string,
  contentId: string,
  position: number,
  duration: number,
): ProgressUpdate {
  const percentage = position / duration;

  // Don't count if too early
  if (position < ProgressRules.minimumWatchTime) {
    return { saved: false, reason: "MINIMUM_TIME_NOT_MET" };
  }

  // Mark as complete if threshold met
  const isComplete = percentage >= ProgressRules.completionThreshold;

  // Calculate actual watch segments for heatmap
  const segments = calculateWatchSegments(userId, contentId, position);

  return {
    saved: true,
    progress: {
      percentage: percentage * 100,
      lastPosition: position,
      watchedSegments: segments,
      completedAt: isComplete ? new Date() : null,
    },
    milestone: checkMilestone(userId, isComplete),
  };
}

// Resume position calculation
function getResumePosition(progress: Progress): number {
  if (progress.completedAt) {
    return 0; // Start from beginning if completed
  }

  // Go back a few seconds to provide context
  return Math.max(0, progress.lastPosition - ProgressRules.resumeBuffer);
}
```

## Conversation & Agent Rules

### Agent Routing Rules

```typescript
// Intent-based routing rules
const routingRules = {
  patterns: {
    content_search: {
      keywords: ["find", "search", "show", "looking for", "watch"],
      priority: 0.8,
      agent: "content-discovery",
    },
    progress_check: {
      keywords: ["my progress", "how far", "completed", "streak"],
      priority: 0.7,
      agent: "progress-tracker",
    },
    mlm_info: {
      keywords: ["commission", "team", "downline", "earnings"],
      priority: 0.9,
      agent: "ambassador-dashboard",
    },
    support: {
      keywords: ["help", "problem", "not working", "error", "cancel"],
      priority: 0.95,
      agent: "support",
    },
  },

  defaultAgent: "leader-coach",

  // Context-based routing overrides
  contextOverrides: {
    hasActiveContent: "content-discovery",
    recentMlmActivity: "ambassador-dashboard",
    previousError: "support",
  },
};

function routeToAgent(message: string, context: Context): string {
  // Check context overrides first
  for (const [condition, agent] of Object.entries(
    routingRules.contextOverrides,
  )) {
    if (evaluateCondition(condition, context)) {
      return agent;
    }
  }

  // Score message against patterns
  const scores = Object.entries(routingRules.patterns)
    .map(([intent, rule]) => ({
      agent: rule.agent,
      score: calculateIntentScore(message, rule.keywords) * rule.priority,
    }))
    .filter((s) => s.score > 0.5)
    .sort((a, b) => b.score - a.score);

  return scores[0]?.agent || routingRules.defaultAgent;
}
```

### Conversation State Management

```typescript
// Conversation persistence rules
interface ConversationRules {
  // How long to maintain conversation context
  contextTimeout: 1800; // 30 minutes

  // Maximum conversation history to maintain
  maxHistoryLength: 50; // messages

  // When to create new conversation
  newConversationTriggers: [
    "user_explicit_reset",
    "module_switch",
    "24_hour_gap",
    "topic_major_shift",
  ];
}

function shouldCreateNewConversation(
  lastMessage: Date,
  currentModule: string,
  previousModule: string,
  userRequest: string,
): boolean {
  // Check time gap
  const hoursSinceLastMessage =
    (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastMessage > 24) return true;

  // Check module switch
  if (currentModule !== previousModule) return true;

  // Check explicit reset
  const resetPhrases = ["start over", "new conversation", "reset"];
  if (resetPhrases.some((phrase) => userRequest.includes(phrase))) return true;

  return false;
}
```

## Organization & Team Rules

### Organization Hierarchy Rules

```typescript
// Organization structure rules
interface OrgRules {
  maxHierarchyDepth: 5;
  maxTeamSize: 1000;
  maxSubOrgs: 50;

  allowedOrgTypes: {
    leaderforge: ["company", "team", "department"];
    movement: ["church", "small_group", "region"];
    wealth: ["partner", "client_group"];
  };
}

function validateOrgCreation(
  parentOrg: Organization | null,
  newOrgType: string,
  moduleId: string,
): ValidationResult {
  // Check hierarchy depth
  if (parentOrg && parentOrg.level >= OrgRules.maxHierarchyDepth) {
    return { valid: false, reason: "MAX_DEPTH_EXCEEDED" };
  }

  // Check org type compatibility
  const allowedTypes = OrgRules.allowedOrgTypes[moduleId];
  if (!allowedTypes?.includes(newOrgType)) {
    return { valid: false, reason: "INVALID_ORG_TYPE" };
  }

  // Check parent-child compatibility
  if (parentOrg) {
    const parentIndex = allowedTypes.indexOf(parentOrg.type);
    const childIndex = allowedTypes.indexOf(newOrgType);
    if (childIndex <= parentIndex) {
      return { valid: false, reason: "INVALID_HIERARCHY" };
    }
  }

  return { valid: true };
}
```

### Seat Allocation Rules

```typescript
// License/seat management rules
interface SeatAllocationRules {
  // Minimum allocation
  minAllocation: 1;

  // Over-allocation allowed percentage
  overAllocationBuffer: 0.1; // 10% grace period

  // Reclaim inactive seats after
  inactivityPeriod: 90; // days
}

function allocateSeats(
  fromOrg: Organization,
  toOrg: Organization,
  quantity: number,
): AllocationResult {
  const available = fromOrg.totalSeats - fromOrg.allocatedSeats;

  // Check availability with buffer
  const maxAllocatable =
    available + fromOrg.totalSeats * SeatAllocationRules.overAllocationBuffer;

  if (quantity > maxAllocatable) {
    return {
      success: false,
      reason: "INSUFFICIENT_SEATS",
      available: Math.floor(maxAllocatable),
    };
  }

  // Check if target is sub-organization
  if (!toOrg.path.includes(fromOrg.id)) {
    return {
      success: false,
      reason: "NOT_SUB_ORGANIZATION",
    };
  }

  return {
    success: true,
    allocated: quantity,
    remaining: available - quantity,
  };
}

// Automatic seat reclamation
function reclaimInactiveSeats(org: Organization): number {
  const inactiveThreshold = new Date();
  inactiveThreshold.setDate(
    inactiveThreshold.getDate() - SeatAllocationRules.inactivityPeriod,
  );

  const inactiveUsers = getUsersByOrg(org.id).filter(
    (user) => user.lastActivity < inactiveThreshold,
  );

  let reclaimed = 0;
  for (const user of inactiveUsers) {
    if (revokeUserEntitlement(user.id, org.id)) {
      reclaimed++;
    }
  }

  return reclaimed;
}
```

## School & Training Rules

### BSOL (Brilliant School of Leadership) Rules

```typescript
interface BSOLRules {
  // Enrollment
  enrollmentWindow: "annual"; // During Brilliance event
  duration: 32; // 24 weeks core + 8 weeks elective
  price: {
    monthly: 999;
    fullPay: 6997;
    months: 8;
  };

  // Progress requirements
  weeklyRequirements: {
    videoCompletion: true;
    worksheetSubmission: true;
    coachingSession: false; // Optional
  };

  // Completion criteria
  completionRequirements: {
    minVideosWatched: 0.8; // 80%
    minWorksheetsCompleted: 0.7; // 70%
    finalProjectSubmitted: true;
  };
}

function validateBSOLEnrollment(user: User): EnrollmentResult {
  // Check enrollment window
  const currentDate = new Date();
  const brillianceEvent = getCurrentBrillianceEventDates();

  if (
    currentDate < brillianceEvent.start ||
    currentDate > brillianceEvent.end
  ) {
    return {
      eligible: false,
      reason: "OUTSIDE_ENROLLMENT_WINDOW",
      nextWindow: getNextBrillianceEvent(),
    };
  }

  // Check previous enrollment
  if (user.completedPrograms?.includes("BSOL")) {
    return {
      eligible: false,
      reason: "ALREADY_COMPLETED",
    };
  }

  return { eligible: true };
}
```

### CEO Inner Circle Rules

```typescript
interface CEOInnerCircleRules {
  // Enrollment
  enrollmentWindow: "anytime";
  duration: 12; // months
  price: {
    annual: 15000;
    monthly: 1500;
  };

  // Meeting requirements
  meetingSchedule: {
    frequency: "monthly";
    dayOfWeek: 3; // Wednesday
    weekOfMonth: 1; // First week
    duration: 120; // minutes
  };

  // LeaderForge platform access
  includesLeaderForge: true;
  maxTeamSize: 50; // per company
}

function getNextCEOMeeting(currentDate: Date): Date {
  const meeting = new Date(currentDate);
  meeting.setDate(1); // First day of month

  // Find first Wednesday
  while (meeting.getDay() !== CEOInnerCircleRules.meetingSchedule.dayOfWeek) {
    meeting.setDate(meeting.getDate() + 1);
  }

  // If already passed this month, go to next month
  if (meeting < currentDate) {
    meeting.setMonth(meeting.getMonth() + 1);
    meeting.setDate(1);
    while (meeting.getDay() !== CEOInnerCircleRules.meetingSchedule.dayOfWeek) {
      meeting.setDate(meeting.getDate() + 1);
    }
  }

  return meeting;
}
```

## LeaderForge Platform Rules

### Bold Action Management

```typescript
interface LeaderForgeRules {
  boldActions: {
    maxActive: 3;
    maxDuration: 21; // days (3 weeks)
    reminderFrequency: 7; // days
  };

  teamCheck: {
    frequency: "weekly";
    duration: 5; // minutes per team member
    required: true;
  };

  worksheetQuestions: [
    "What was the main idea?",
    "What 3 things stood out to you?",
    "What one bold action would you like to take?",
    "What 3 things would you like to take action on later?",
  ];
}

function validateBoldAction(
  action: BoldAction,
  userActions: BoldAction[],
): ValidationResult {
  // Check active count
  const activeActions = userActions.filter((a) => !a.completed);
  if (activeActions.length >= LeaderForgeRules.boldActions.maxActive) {
    return {
      valid: false,
      reason: "MAX_ACTIVE_EXCEEDED",
      suggestion: "Complete an existing action first",
    };
  }

  // Check duration
  if (action.targetDays > LeaderForgeRules.boldActions.maxDuration) {
    return {
      valid: false,
      reason: "DURATION_TOO_LONG",
      maxAllowed: LeaderForgeRules.boldActions.maxDuration,
    };
  }

  return { valid: true };
}

// Weekly check-in enforcement
function isCheckInDue(
  lastCheckIn: Date | null,
  frequency: number = 7,
): boolean {
  if (!lastCheckIn) return true;

  const daysSinceLastCheckIn =
    (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceLastCheckIn >= frequency;
}
```

## Financial & Commission Rules

### Commission Calculation Rules

```typescript
interface CommissionRules {
  // Payment schedule
  paymentFrequency: "monthly";
  paymentDelay: 30; // days after period end
  minimumPayout: 25; // USD

  // Qualification requirements
  personalVolumeRequired: 47; // Monthly membership
  activeRequirement: true;

  // Clawback conditions
  refundPeriod: 30; // days
  chargebackDeduction: 1.0; // 100% of commission
}

function calculateMonthlyCommission(
  ambassador: Ambassador,
  period: Period,
): CommissionCalculation {
  // Check qualification
  if (
    !ambassador.isActive ||
    ambassador.personalVolume < CommissionRules.personalVolumeRequired
  ) {
    return {
      qualified: false,
      amount: 0,
      reason: "NOT_QUALIFIED",
    };
  }

  // Calculate by level
  let totalCommission = 0;
  const levelBreakdown = {};

  for (let level = 1; level <= 7; level++) {
    const levelSales = getSalesAtLevel(ambassador.id, level, period);
    const levelRate = commissionStructure[`level${level}`];
    const levelCommission = levelSales * levelRate;

    levelBreakdown[`level${level}`] = {
      sales: levelSales,
      rate: levelRate,
      commission: levelCommission,
    };

    totalCommission += levelCommission;
  }

  // Apply clawbacks
  const clawbacks = getClawbacks(ambassador.id, period);
  totalCommission -= clawbacks;

  return {
    qualified: true,
    amount: totalCommission,
    breakdown: levelBreakdown,
    clawbacks: clawbacks,
    paymentDate: calculatePaymentDate(period),
  };
}
```

### Refund and Cancellation Rules

```typescript
interface RefundRules {
  // Grace periods
  gracePeriods: {
    movement: 30; // days
    bsol: 7; // days
    ceoCircle: 0; // No refunds
    ambassador: 30; // days
  };

  // Proration rules
  prorationMethod: "daily";

  // Commission impact
  clawbackCommission: true;
}

function processRefund(
  subscription: Subscription,
  reason: string,
): RefundResult {
  const daysSincePurchase =
    (Date.now() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24);

  const gracePeriod = RefundRules.gracePeriods[subscription.type];

  // Check if within grace period
  if (daysSincePurchase > gracePeriod) {
    return {
      eligible: false,
      reason: "OUTSIDE_GRACE_PERIOD",
    };
  }

  // Calculate refund amount
  const refundAmount = calculateProration(
    subscription.amount,
    subscription.startDate,
    new Date(),
    RefundRules.prorationMethod,
  );

  // Handle commission clawback
  if (RefundRules.clawbackCommission && subscription.referrer) {
    scheduleCommissionClawback(
      subscription.referrer,
      subscription.id,
      refundAmount,
    );
  }

  return {
    eligible: true,
    amount: refundAmount,
    processDate: new Date(),
  };
}
```

## Content Publishing Rules

### Video Content Rules

```typescript
interface ContentPublishingRules {
  // Minimum requirements
  minimumDuration: 60; // seconds
  requiredFields: ["title", "description", "thumbnail"];

  // Auto-categorization rules
  categoryKeywords: {
    leadership: ["leader", "influence", "team", "vision"];
    identity: ["identity", "who you are", "new creation", "in Christ"];
    prayer: ["prayer", "intercession", "communion", "worship"];
    business: ["business", "work", "marketplace", "economy"];
  };

  // Module assignment rules
  autoModuleAssignment: {
    byInstructor: {
      "Graham Cooke": ["movement", "spiritual"];
      "Dionne van Zyl": ["leaderforge", "business"];
    };
    byCategory: {
      business: ["leaderforge"];
      spiritual: ["movement", "spiritual"];
      financial: ["wealth"];
    };
  };
}

function validateContentPublishing(content: Content): ValidationResult {
  // Check required fields
  const missingFields = ContentPublishingRules.requiredFields.filter(
    (field) => !content[field],
  );

  if (missingFields.length > 0) {
    return {
      valid: false,
      reason: "MISSING_REQUIRED_FIELDS",
      fields: missingFields,
    };
  }

  // Check duration
  if (content.duration < ContentPublishingRules.minimumDuration) {
    return {
      valid: false,
      reason: "DURATION_TOO_SHORT",
    };
  }

  // Auto-assign categories if missing
  if (!content.categories || content.categories.length === 0) {
    content.categories = autoAssignCategories(content);
  }

  // Auto-assign modules if missing
  if (!content.availableModules || content.availableModules.length === 0) {
    content.availableModules = autoAssignModules(content);
  }

  return { valid: true };
}
```

## Notification Rules

### Notification Triggers

```typescript
interface NotificationRules {
  // Email notifications
  emailTriggers: {
    welcome: "immediately";
    inactivity: 7; // days
    milestone: "immediately";
    commission: "monthly";
    eventReminder: 24; // hours before
  };

  // In-app notifications
  inAppTriggers: {
    newContent: true;
    teamActivity: true;
    progressMilestone: true;
    systemUpdates: true;
  };

  // Opt-out categories
  optOutCategories: [
    "marketing",
    "progress_updates",
    "team_notifications",
    "event_reminders",
  ];
}

function shouldSendNotification(
  user: User,
  type: string,
  category: string,
): boolean {
  // Check user preferences
  if (user.notificationPreferences?.optedOut?.includes(category)) {
    return false;
  }

  // Check notification frequency limits
  const recentNotifications = getRecentNotifications(user.id, type);
  if (recentNotifications.length > 0) {
    const lastSent = recentNotifications[0].sentAt;
    const hoursSinceLast = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

    // Prevent notification spam
    if (hoursSinceLast < 24) {
      return false;
    }
  }

  return true;
}
```

## Data Retention Rules

### Retention Policies

```typescript
interface DataRetentionRules {
  // Active data
  userProfile: "indefinite";
  progressData: "indefinite";

  // Historical data
  conversationHistory: 365; // days
  analyticsEvents: 730; // days (2 years)

  // Sensitive data
  deletedUserData: 30; // days before permanent deletion
  paymentData: 2555; // days (7 years for tax)

  // Compliance
  gdprExportWindow: 30; // days to provide data
  deletionWindow: 30; // days to complete deletion
}

function applyRetentionPolicy(): void {
  // Archive old conversations
  const conversationCutoff = new Date();
  conversationCutoff.setDate(
    conversationCutoff.getDate() - DataRetentionRules.conversationHistory,
  );
  archiveConversationsBefore(conversationCutoff);

  // Delete old analytics
  const analyticsCutoff = new Date();
  analyticsCutoff.setDate(
    analyticsCutoff.getDate() - DataRetentionRules.analyticsEvents,
  );
  deleteAnalyticsBefore(analyticsCutoff);

  // Permanent deletion of user data
  const deletionCutoff = new Date();
  deletionCutoff.setDate(
    deletionCutoff.getDate() - DataRetentionRules.deletedUserData,
  );
  permanentlyDeleteUserDataBefore(deletionCutoff);
}
```

## Compliance & Legal Rules

### GDPR/Privacy Rules

```typescript
interface PrivacyRules {
  // Consent requirements
  consentRequired: ["marketing", "analytics", "third_party_sharing"];

  // Data minimization
  collectOnlyRequired: true;

  // Right to access
  dataExportFormat: "json";
  includeInExport: [
    "profile",
    "progress",
    "conversations",
    "journal_entries",
    "commission_history",
  ];

  // Right to erasure
  cannotDelete: ["financial_records", "legal_obligations"];
}

function handleDataExportRequest(userId: string): ExportResult {
  const userData = {
    profile: exportUserProfile(userId),
    progress: exportUserProgress(userId),
    conversations: exportConversations(userId),
    journalEntries: exportJournalEntries(userId),
    commissionHistory: exportCommissions(userId),
    exportDate: new Date(),
    format: PrivacyRules.dataExportFormat,
  };

  // Encrypt export
  const encryptedExport = encryptDataExport(userData);

  return {
    downloadUrl: generateSecureDownloadUrl(encryptedExport),
    expiresIn: 48 * 60 * 60 * 1000, // 48 hours
    format: PrivacyRules.dataExportFormat,
  };
}
```

---

## 🧠 Business Rules Enhancements

### 📦 Rule Versioning

Each business rule or group of rules should include:

- `ruleVersion` (semantic)
- `lastUpdated`
- `sourcePolicy` or link to governing document

Track changes via Git history or changelog file.

### 🧪 Rule Testing Framework

Implement a test suite for rules:

- Assert expected outcomes from example inputs
- Simulate changes in user behavior or edge cases
- Include unit + integration level validation

### 🔧 Config-Driven Execution

Where possible, business rules should be expressed in:

- JSON logic
- YAML policies
- Interpretable DSLs

This enables runtime flexibility and admin configurability.

### 📊 Rule Impact Auditing

Log when rules trigger, including:

- Rule name
- Time of execution
- Entity impacted
- Decision outcome

Use logs to evaluate effectiveness and unintended consequences.
