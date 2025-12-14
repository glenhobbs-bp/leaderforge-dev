# ADR-0005: Hybrid Communication Pattern (HTTP + Message Queue)

**File:** docs/architecture/adr/0005-hybrid-communication-pattern.md
**Purpose:** Architecture Decision Record for hybrid synchronous/asynchronous communication approach
**Owner:** Senior Architect
**Tags:** ADR, architecture, communication, http, message-queue, performance

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-01-15 |
| **Status** | Accepted |
| **Decision Type** | Architecture |
| **Impact Level** | Medium |
| **Stakeholders** | Backend Team, Frontend Team, DevOps Team |
| **Supersedes** | N/A |

## Context

**Background:** LeaderForge needs to handle both real-time user interactions (composition rendering, widget discovery) and background processing (content transcription, analytics, progress sync). Different operations have different latency, reliability, and consistency requirements.

**Problem Statement:** Communication architecture needs to handle:
- Fast user-blocking operations (widget discovery, composition rendering)
- Long-running background tasks (video transcription, content analysis)
- Cross-module communication within modular monolith
- Future extensibility for microservices if needed
- Reliable delivery for critical operations (user progress, payment processing)

**Goals:**
- Optimize user experience with fast response times for interactive operations
- Enable reliable background processing for non-blocking operations
- Support both immediate consistency and eventual consistency patterns
- Maintain simple development patterns while enabling complex workflows
- Prepare for potential future microservices architecture

**Constraints:**
- Must maintain <100ms response time for user-facing operations
- Background operations must be reliable with retry mechanisms
- Integration complexity should not slow down development velocity
- Infrastructure costs should remain reasonable for startup

## Decision

**Summary:** Use HTTP for synchronous user-facing operations and message queue for asynchronous background processing, with clear patterns for when to use each approach.

**Details:**
- **HTTP for Synchronous**: User-blocking operations like composition rendering, widget discovery, authentication
- **Message Queue for Asynchronous**: Background tasks like content analysis, progress sync, analytics
- **Operation Classification**: Clear guidelines for categorizing operations as sync vs async
- **Unified Interface**: Consistent API patterns regardless of underlying communication method
- **Graceful Degradation**: Fallback strategies when message queue unavailable

## Options Considered

### Option 1: Hybrid Pattern (HTTP + Message Queue) (Selected)
**Description:** Use appropriate communication pattern based on operation requirements

**Pros:**
- **Optimized performance**: Fast HTTP for immediate operations, reliable queues for background work
- **User experience**: No waiting for background operations to complete
- **Reliability**: Message queue ensures background tasks complete even during failures
- **Scalability**: Can handle traffic spikes by queuing background work
- **Future-proof**: Supports both monolith and microservices patterns

**Cons:**
- **Complexity**: Two communication patterns to maintain
- **Infrastructure**: Additional message queue infrastructure
- **Development overhead**: Developers must understand when to use each pattern

**Risk Level:** Medium

### Option 2: HTTP Only
**Description:** Use HTTP for all communication, both synchronous and asynchronous

**Pros:**
- **Simplicity**: Single communication pattern
- **Familiar**: Standard web development patterns
- **Debugging**: Easier to trace HTTP requests
- **Infrastructure**: No additional queue infrastructure needed

**Cons:**
- **Performance**: Long operations block user interface
- **Reliability**: Failed operations require manual retry
- **Scalability**: Cannot handle traffic spikes gracefully
- **User experience**: Users wait for background operations

**Risk Level:** Low

### Option 3: Message Queue Only
**Description:** Use message queue for all operations including user-facing

**Pros:**
- **Consistency**: Single communication pattern
- **Reliability**: All operations are queued and retryable
- **Scalability**: Can handle any traffic pattern

**Cons:**
- **Latency**: Even simple operations have queue overhead
- **Complexity**: User interface must handle async responses for everything
- **Infrastructure**: Over-engineered for simple operations

**Risk Level:** High

## Decision Rationale

**Primary Factors:**
1. **User experience optimization**: Interactive operations need immediate response
2. **System reliability**: Background operations need guaranteed execution
3. **Performance requirements**: <100ms for user operations, reliability for background
4. **Development productivity**: Clear patterns reduce decision fatigue

**Trade-offs Accepted:**
- **Infrastructure complexity** for optimized user experience and system reliability
- **Learning curve** for developers to understand both patterns

**Assumptions:**
- Majority of operations can be clearly categorized as sync vs async
- Message queue infrastructure costs justified by reliability benefits
- Development team can learn both patterns effectively

## Implementation Impact

### Technical Impact
- **Architecture Changes**: Introduce message queue layer alongside existing HTTP APIs
- **Technology Stack**: Add Redis/BullMQ for message queue, maintain tRPC for HTTP
- **Data Migration**: N/A (new communication layer)
- **Performance**: <100ms HTTP operations, reliable async processing
- **Security Impact**: Message queue access controls, payload encryption for sensitive data

### Process Impact
- **Development Workflow**: Operation classification guidelines, async task development patterns
- **Testing Strategy**: Unit tests for sync operations, integration tests for async workflows
- **Deployment**: Message queue deployment and monitoring
- **Monitoring**: Separate metrics for HTTP performance and queue processing

### Team Impact
- **Learning Curve**: Understanding sync vs async patterns, message queue concepts
- **Training Needs**: Queue development patterns, error handling, monitoring
- **Resource Requirements**: Developer experience with message queues or training time

## Success Criteria

**Technical Metrics:**
- HTTP response times <100ms (95th percentile)
- Message queue processing reliability >99.9%
- Queue throughput supports 10x current traffic
- Zero message loss for critical operations

**Business Metrics:**
- User satisfaction with interface responsiveness >90%
- Background task completion rate >99.5%
- Developer velocity maintained during implementation
- Infrastructure costs <20% increase over HTTP-only

**Timeline:**
- **Decision Implementation:** January 2024
- **Message Queue Infrastructure:** February 2024
- **Operation Migration:** March-April 2024
- **Full Implementation:** May 2024

## Operation Classification Guidelines

### Synchronous (HTTP)
- **User Authentication**: Login, logout, session validation
- **Widget Discovery**: Agent queries for available widgets
- **Composition Rendering**: Converting schemas to UI components
- **Real-time Data**: User progress, current state queries
- **Content Retrieval**: Loading videos, documents, user data

### Asynchronous (Message Queue)
- **Content Processing**: Video transcription, thumbnail generation
- **Analytics**: User behavior tracking, engagement metrics
- **Progress Sync**: Cross-device progress synchronization
- **Notifications**: Email sends, push notifications
- **Data Export**: Report generation, bulk data operations

## Risk Assessment

### High Risks
- **Risk:** Message queue becomes single point of failure
  - **Mitigation:** Queue clustering, graceful degradation, fallback to HTTP polling
  - **Contingency:** Temporary HTTP-only mode for critical operations

### Medium Risks
- **Risk:** Developers choose wrong communication pattern
  - **Mitigation:** Clear guidelines, code review checks, automated pattern detection
  - **Contingency:** Refactor misclassified operations during code review

- **Risk:** Queue processing backlog during traffic spikes
  - **Mitigation:** Auto-scaling workers, queue monitoring, priority queues
  - **Contingency:** Emergency worker scaling, operation prioritization

### Low Risks
- **Risk:** Infrastructure costs exceed projections
  - **Mitigation:** Usage monitoring, cost alerts, optimization reviews
  - **Contingency:** Reduce async operations or optimize queue usage

## Follow-up Actions

- [ ] **Create operation classification guidelines** (Senior Architect, Jan 20)
- [ ] **Set up message queue infrastructure** (DevOps, Feb 1)
- [ ] **Implement async task framework** (Backend Team, Feb 15)
- [ ] **Migrate first background operations** (Backend Team, Mar 1)
- [ ] **Create monitoring dashboards** (DevOps, Mar 15)
- [ ] **Documentation Updates**: Communication patterns guide, async development guide
- [ ] **Implementation Plan**: Reference hybrid-communication-implementation-plan.md

## References

- **Related ADRs:** ADR-0002 (Modular Monolith), ADR-0006 (BullMQ Choice)
- **Documentation:** [Modular Monolith Architecture](../overview/modular-monolith-architecture.md)
- **Research:** Message queue patterns, performance benchmarks
- **Discussion:** Architecture team review meeting, Jan 14, 2024

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-01-15 | Senior Architect | Initial version |

---

**Note:** This hybrid approach optimizes for both user experience and system reliability while maintaining development simplicity.