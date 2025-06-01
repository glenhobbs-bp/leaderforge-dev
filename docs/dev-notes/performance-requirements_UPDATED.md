# LeaderForge Performance Requirements

## Overview

This document defines the performance requirements and benchmarks for the LeaderForge platform, ensuring a responsive and scalable agent-first learning experience.

## Core Performance Metrics

### Response Time Requirements

#### API Endpoints

| Endpoint Type           | Target (p95)     | Maximum | Priority |
| ----------------------- | ---------------- | ------- | -------- |
| Agent Messages          | < 1s first token | 3s      | Critical |
| Content Search          | < 200ms          | 500ms   | High     |
| Progress Updates        | < 100ms          | 200ms   | High     |
| Video Transcript Search | < 300ms          | 800ms   | High     |
| Authentication          | < 500ms          | 1s      | Medium   |
| Analytics Queries       | < 2s             | 5s      | Low      |

#### Frontend Performance

| Metric                         | Target  | Maximum | Measurement     |
| ------------------------------ | ------- | ------- | --------------- |
| First Contentful Paint (FCP)   | < 1s    | 1.5s    | Lighthouse      |
| Time to Interactive (TTI)      | < 2s    | 3s      | Lighthouse      |
| Largest Contentful Paint (LCP) | < 2.5s  | 4s      | Core Web Vitals |
| First Input Delay (FID)        | < 100ms | 300ms   | Core Web Vitals |
| Cumulative Layout Shift (CLS)  | < 0.1   | 0.25    | Core Web Vitals |

### Throughput Requirements

#### Concurrent Users

- **Phase 1 (Launch)**: 1,000 concurrent users
- **Phase 2 (Growth)**: 10,000 concurrent users
- **Phase 3 (Scale)**: 100,000+ concurrent users

#### Request Volume

- **Agent API**: 20 requests/minute per user
- **Content API**: 30 requests/minute per user
- **Progress API**: 2 updates/minute per active content
- **WebSocket**: 10,000 concurrent connections

## Agent Performance

### Agent Response Characteristics

```typescript
interface AgentPerformanceMetrics {
  // Time to first token streaming
  timeToFirstToken: number; // Target: < 1s

  // Complete response time
  totalResponseTime: number; // Target: < 5s

  // Tokens per second
  streamingRate: number; // Target: > 30 tokens/s

  // Intent recognition accuracy
  intentAccuracy: number; // Target: > 95%

  // Context switching time
  handoffTime: number; // Target: < 500ms
}
```

### Agent Optimization Strategies

1. **Response Streaming**: Start streaming within 1 second
2. **Context Caching**: Cache conversation context for 30 minutes
3. **Precomputed Responses**: Cache common queries
4. **Parallel Processing**: Process intent while generating response

## Database Performance

### Query Performance Targets

```sql
-- All queries must complete within these times:
-- Simple lookups: < 10ms
-- Complex joins: < 50ms
-- Aggregations: < 100ms
-- Full-text search: < 200ms

-- Example optimized query
CREATE INDEX idx_content_search ON content
  USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX idx_user_progress_lookup ON user_progress(user_id, content_id)
  WHERE completed_at IS NULL;
```

### Connection Pooling

```javascript
// Database connection pool settings
const poolConfig = {
  min: 20, // Minimum connections
  max: 100, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statementTimeout: 5000, // 5s max query time
};
```

### Caching Strategy

```typescript
// Redis caching layers
const cacheConfig = {
  userSession: {
    ttl: 3600, // 1 hour
    prefix: "session:",
  },
  contentMetadata: {
    ttl: 86400, // 24 hours
    prefix: "content:",
  },
  searchResults: {
    ttl: 300, // 5 minutes
    prefix: "search:",
  },
  agentContext: {
    ttl: 1800, // 30 minutes
    prefix: "agent:",
  },
};
```

## Video Delivery Performance

### Streaming Requirements

- **Start Time**: < 3 seconds to begin playback
- **Buffering**: < 1% rebuffering ratio
- **Quality**: Adaptive bitrate (360p to 4K)
- **CDN Coverage**: Global edge locations

### Transcript Search Performance

```typescript
// Optimized transcript search
interface TranscriptSearchPerf {
  indexingTime: number; // < 100ms per minute of video
  searchTime: number; // < 300ms for full library
  snippetGeneration: number; // < 500ms per result
  cacheHitRate: number; // > 80%
}
```

## Frontend Performance

### Bundle Size Targets

```javascript
// Maximum bundle sizes (gzipped)
const bundleLimits = {
  mainBundle: 200, // KB
  perRoute: 50, // KB
  totalInitial: 300, // KB
  images: {
    thumbnail: 50, // KB
    hero: 200, // KB
  },
};
```

### Code Splitting Strategy

```typescript
// Dynamic imports for routes
const ModuleRoutes = {
  movement: dynamic(() => import('@/modules/movement')),
  leaderforge: dynamic(() => import('@/modules/leaderforge')),
  wealth: dynamic(() => import('@/modules/wealth')),
};

// Lazy load heavy components
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <VideoPlayerSkeleton />,
  ssr: false
});
```

### Offline Performance

```typescript
// Service worker caching
const offlineAssets = [
  "/offline.html",
  "/manifest.json",
  "/icons/*",
  "/fonts/*",
];

// IndexedDB for offline data
const offlineStorage = {
  conversations: 50, // MB
  journalEntries: 100, // MB
  videoProgress: 10, // MB
  maxTotalSize: 200, // MB
};
```

## WebSocket Performance

### Real-time Requirements

```typescript
interface WebSocketMetrics {
  connectionTime: number; // < 1s
  messageLatency: number; // < 50ms
  reconnectTime: number; // < 3s
  maxConcurrent: number; // 10,000
  messageRate: number; // 100/s per connection
}
```

### Socket.io Configuration

```javascript
const socketConfig = {
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket"],
  perMessageDeflate: {
    threshold: 1024,
  },
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
};
```

## Scalability Targets

### Horizontal Scaling

```yaml
# Auto-scaling rules
scaling:
  web:
    min: 2
    max: 20
    cpu_threshold: 70%
    memory_threshold: 80%

  api:
    min: 3
    max: 30
    cpu_threshold: 60%
    requests_per_second: 1000

  workers:
    min: 2
    max: 10
    queue_depth: 1000
```

### Load Distribution

- **API Gateway**: Rate limiting and load balancing
- **CDN**: 90%+ cache hit ratio for static assets
- **Database**: Read replicas for analytics queries
- **Queue**: Process heavy operations asynchronously

## Performance Monitoring

### Key Metrics to Track

```typescript
interface PerformanceMetrics {
  // User-facing metrics
  apdex: number; // Target: > 0.9
  errorRate: number; // Target: < 0.1%

  // System metrics
  cpuUsage: number; // Target: < 70%
  memoryUsage: number; // Target: < 80%

  // Business metrics
  agentSuccessRate: number; // Target: > 95%
  searchRelevance: number; // Target: > 90%
}
```

### Performance Budget

```javascript
// Performance budget enforcement
const performanceBudget = {
  javascript: 300, // KB
  css: 50, // KB
  images: 500, // KB
  fonts: 100, // KB
  total: 1000, // KB

  // Timing budgets
  fcp: 1000, // ms
  tti: 3000, // ms
  speedIndex: 3000, // ms
};
```

## Optimization Techniques

### Backend Optimizations

1. **Query Optimization**

   - Use prepared statements
   - Implement query result caching
   - Add appropriate indexes
   - Use materialized views for analytics

2. **API Optimization**

   - Response compression (gzip/brotli)
   - HTTP/2 multiplexing
   - ETags for caching
   - Pagination for large datasets

3. **Agent Optimization**
   - Prompt caching for common queries
   - Context compression
   - Parallel intent processing
   - Streaming responses

### Frontend Optimizations

1. **Asset Optimization**

   - Image lazy loading
   - WebP/AVIF formats
   - Critical CSS inlining
   - Font subsetting

2. **React Optimization**

   - Memo for expensive components
   - Virtual scrolling for lists
   - Debounced search inputs
   - Optimistic UI updates

3. **Network Optimization**
   - Prefetch on hover
   - Service worker caching
   - GraphQL query batching
   - WebSocket connection pooling

## Performance Testing

### Load Testing Scenarios

```javascript
// k6 load test example
export const options = {
  stages: [
    { duration: "5m", target: 100 }, // Ramp up
    { duration: "10m", target: 1000 }, // Stay at 1000 users
    { duration: "5m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    errors: ["rate<0.01"], // Error rate under 1%
  },
};
```

### Performance Regression Prevention

1. **Automated Performance Tests**: Run with each deployment
2. **Bundle Size Monitoring**: Alert on size increases > 5%
3. **Lighthouse CI**: Fail builds below score of 90
4. **Real User Monitoring**: Track Core Web Vitals

## Degradation Strategy

### Graceful Degradation Levels

1. **Level 1 (Normal)**: All features available
2. **Level 2 (High Load)**: Disable analytics, reduce cache TTL
3. **Level 3 (Critical)**: Disable search suggestions, limit video quality
4. **Level 4 (Emergency)**: Read-only mode, static content only

### Circuit Breaker Configuration

```typescript
const circuitBreaker = {
  timeout: 3000, // Request timeout
  errorThreshold: 50, // Error percentage
  resetTimeout: 30000, // Reset after 30s
  volumeThreshold: 20, // Minimum requests
};
```

---

## 🚀 Performance Optimization Addendum

### ⏱️ Frontend Performance Goals

- First Contentful Paint (FCP) under 1.5s on 3G mobile
- Largest Contentful Paint (LCP) under 2.5s
- Time to Interactive (TTI) under 3s

Use [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) to track regressions in PRs.

### 🌐 Lazy Load Modules

Support module-level lazy loading for non-core components. Use dynamic `import()` and code splitting to reduce initial bundle size.

### 🔌 API Performance

Target:

- P99 response time < 500ms for core APIs
- Use caching (Redis/local memory) for common lookups
- Use CDN edge caching for public resources

### 📊 Real User Monitoring (RUM)

Integrate a RUM tool like:

- Vercel Analytics
- PostHog
- Sentry Performance

Capture real-world device behavior and UX slowdowns.
