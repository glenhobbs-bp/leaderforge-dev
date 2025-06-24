# ADR-0006: BullMQ for Message Queue Implementation

**File:** docs/architecture/adr/0006-bullmq-message-queue.md
**Purpose:** Architecture Decision Record for choosing BullMQ as message queue technology
**Owner:** Senior Architect
**Tags:** ADR, technology, bullmq, message-queue, redis

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-01-15 |
| **Status** | Accepted |
| **Decision Type** | Technology |
| **Impact Level** | Low |
| **Stakeholders** | Backend Team, DevOps Team |
| **Supersedes** | N/A |

## Context

**Background:** ADR-0005 established the need for a message queue system for asynchronous operations. Now we need to select the specific technology that best fits our technical requirements, team capabilities, and infrastructure constraints.

**Problem Statement:** Message queue technology selection needs to consider:
- Integration with existing Redis infrastructure
- TypeScript/Node.js ecosystem compatibility
- Reliability and performance requirements
- Development team learning curve
- Operational complexity and monitoring capabilities
- Cost and licensing considerations

**Goals:**
- Reliable message processing with retry mechanisms
- Integration with existing tech stack (Node.js, TypeScript, Redis)
- Minimal operational overhead for small team
- Good developer experience with debugging and monitoring
- Support for job scheduling and delayed execution

**Constraints:**
- Must work with existing Redis instance to minimize infrastructure
- Team has strong TypeScript/Node.js experience but limited queue experience
- Startup budget requires cost-effective solution
- Must support both immediate and scheduled job execution

## Decision

**Summary:** Adopt BullMQ as the message queue implementation, leveraging existing Redis infrastructure and providing robust TypeScript support for the development team.

**Details:**
- **Queue Technology**: BullMQ (built on Redis)
- **Infrastructure**: Leverage existing Redis instance, add BullMQ Dashboard
- **TypeScript Integration**: Full TypeScript support with type-safe job definitions
- **Monitoring**: BullMQ Dashboard + custom metrics for production monitoring
- **Job Types**: Support for immediate jobs, delayed jobs, recurring jobs, and job chains

## Options Considered

### Option 1: BullMQ (Selected)
**Description:** Redis-based queue with excellent TypeScript support and robust features

**Pros:**
- **Redis Integration**: Uses existing Redis infrastructure
- **TypeScript Native**: Built for TypeScript with excellent type safety
- **Feature Rich**: Delayed jobs, repeatable jobs, job chains, priorities
- **Monitoring**: Built-in dashboard and comprehensive metrics
- **Active Development**: Well-maintained with regular updates
- **Node.js Ecosystem**: Perfect fit for our tech stack

**Cons:**
- **Redis Dependency**: Tied to Redis infrastructure
- **Memory Usage**: Jobs stored in Redis memory
- **Learning Curve**: Queue-specific concepts to learn

**Risk Level:** Low

### Option 2: AWS SQS
**Description:** Managed cloud queue service

**Pros:**
- **Managed Service**: No infrastructure management required
- **Scalability**: Handles any load automatically
- **Reliability**: AWS-level SLA and durability
- **Cost Model**: Pay per use

**Cons:**
- **Vendor Lock-in**: AWS-specific implementation
- **Latency**: Network calls for all operations
- **Limited Features**: No built-in scheduling or complex workflows
- **Cost**: Can become expensive with high message volume

**Risk Level:** Medium

### Option 3: RabbitMQ
**Description:** Traditional message broker with rich features

**Pros:**
- **Battle Tested**: Mature and proven in production
- **Feature Rich**: Complex routing, multiple protocols
- **Standards Based**: AMQP standard compliance
- **Clustering**: Built-in high availability

**Cons:**
- **Infrastructure Overhead**: Additional service to manage
- **Complexity**: More features than needed for our use case
- **Learning Curve**: AMQP concepts and RabbitMQ administration
- **Resource Usage**: Heavier than Redis-based solutions

**Risk Level:** High

### Option 4: Agenda.js
**Description:** MongoDB-based job queue for Node.js

**Pros:**
- **MongoDB Integration**: Could leverage MongoDB if we used it
- **Simple API**: Easy to get started
- **Node.js Native**: Built specifically for Node.js

**Cons:**
- **MongoDB Dependency**: We use PostgreSQL, not MongoDB
- **Limited Features**: Fewer advanced features than BullMQ
- **Performance**: Generally slower than Redis-based solutions
- **Community**: Smaller community and less active development

**Risk Level:** Medium

## Decision Rationale

**Primary Factors:**
1. **Infrastructure Synergy**: Leverages existing Redis instance, no additional infrastructure
2. **TypeScript Excellence**: Best-in-class TypeScript support matches our stack
3. **Feature Completeness**: All required features (delayed jobs, scheduling, retries)
4. **Developer Experience**: Excellent documentation, debugging tools, and dashboard

**Trade-offs Accepted:**
- **Redis dependency** for infrastructure simplicity and performance benefits
- **Memory storage** for fast access and simplified deployment

**Assumptions:**
- Redis infrastructure will remain stable and scalable for our needs
- Job payloads will remain reasonably sized for memory storage
- TypeScript-first approach will benefit development team productivity

## Implementation Impact

### Technical Impact
- **Architecture Changes**: Add BullMQ layer on top of existing Redis
- **Technology Stack**: BullMQ, Redis, BullMQ Dashboard for monitoring
- **Data Migration**: N/A (new system)
- **Performance**: <10ms job enqueue, reliable job processing
- **Security Impact**: Job payload encryption for sensitive data, Redis access controls

### Process Impact
- **Development Workflow**: Job-based development patterns, queue debugging procedures
- **Testing Strategy**: Job testing utilities, queue integration tests
- **Deployment**: BullMQ configuration, dashboard deployment
- **Monitoring**: Queue metrics, job failure alerts, processing time tracking

### Team Impact
- **Learning Curve**: Low - familiar Redis concepts with queue additions
- **Training Needs**: BullMQ concepts, job design patterns, monitoring tools
- **Resource Requirements**: No additional specialists needed

## Success Criteria

**Technical Metrics:**
- Job enqueue performance <10ms (95th percentile)
- Job processing reliability >99.9%
- Queue processing throughput 1000+ jobs/minute
- Job failure rate <0.1%

**Business Metrics:**
- Zero critical job losses
- Background task completion time improvement >50%
- Developer productivity maintained during adoption
- Infrastructure costs increase <$50/month

**Timeline:**
- **Decision Implementation:** January 2024
- **BullMQ Setup:** February 2024
- **First Jobs Migrated:** March 2024
- **Full Migration:** April 2024

## Risk Assessment

### High Risks
- **Risk:** Redis becomes bottleneck for job processing
  - **Mitigation:** Redis monitoring, memory optimization, potential Redis clustering
  - **Contingency:** Move to separate Redis instance for queues or different queue technology

### Medium Risks
- **Risk:** Job payload sizes exceed Redis memory capacity
  - **Mitigation:** Payload size monitoring, large payload handling patterns
  - **Contingency:** External storage for large payloads or different queue technology

### Low Risks
- **Risk:** BullMQ Dashboard security concerns
  - **Mitigation:** Authentication, network restrictions, security reviews
  - **Contingency:** Custom monitoring or disable dashboard in production

## BullMQ-Specific Implementation Details

### Job Categories
```typescript
// Content processing jobs
export interface VideoTranscriptionJob {
  videoId: string;
  videoUrl: string;
  userId: string;
}

// Analytics jobs
export interface UserAnalyticsJob {
  userId: string;
  eventType: string;
  metadata: Record<string, any>;
}

// Progress sync jobs
export interface ProgressSyncJob {
  userId: string;
  progressData: UserProgress[];
  syncType: 'full' | 'incremental';
}
```

### Queue Configuration
- **Video Processing**: Concurrency 2, retry 3 times
- **Analytics**: Concurrency 10, retry 5 times
- **Progress Sync**: Concurrency 5, retry 2 times
- **Notifications**: Concurrency 3, retry 1 time

## Follow-up Actions

- [ ] **Set up Redis configuration for queues** (DevOps, Jan 25)
- [ ] **Install and configure BullMQ** (Backend Team, Feb 1)
- [ ] **Deploy BullMQ Dashboard** (DevOps, Feb 5)
- [ ] **Create job type definitions** (Backend Team, Feb 10)
- [ ] **Implement first background jobs** (Backend Team, Feb 15)
- [ ] **Documentation Updates**: Queue development guide, job patterns
- [ ] **Implementation Plan**: Reference bullmq-implementation-plan.md

## References

- **Related ADRs:** ADR-0005 (Hybrid Communication Pattern)
- **Documentation:** [BullMQ Official Documentation](https://docs.bullmq.io/)
- **Research:** Queue technology comparison, Redis performance analysis
- **Discussion:** Architecture team review meeting, Jan 15, 2024

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-01-15 | Senior Architect | Initial version |

---

**Note:** BullMQ provides the optimal balance of features, performance, and developer experience for our TypeScript-first infrastructure.