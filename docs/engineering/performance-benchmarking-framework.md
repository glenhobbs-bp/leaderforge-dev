# Performance Benchmarking Framework

**Document Version:** 1.0
**Last Updated:** 2025-07-09
**Related:** [ADR-0025: Agent Complexity Spectrum & Performance Optimization](../architecture/adr/0025-agent-complexity-spectrum-optimization.md)

## 🎯 Benchmarking Objectives

**Goal:** Quantify performance differences between the 4-tier agent complexity spectrum to validate architectural decisions and guide pattern selection.

**Key Metrics:**
- **Time to First Byte (TTFB)** - Server response time
- **Time to Interactive (TTI)** - User interaction readiness
- **Bundle Size Impact** - JavaScript payload size
- **Cumulative Layout Shift (CLS)** - Visual stability
- **Lighthouse Performance Score** - Overall performance rating

## 📊 Performance Targets by Pattern

### Static Page Agent 🏃‍♂️
```
🎯 TARGETS:
- TTFB: <100ms
- TTI: <200ms
- Bundle: <50KB
- CLS: <0.1
- Lighthouse: >95

📈 EXPECTED IMPROVEMENT:
- 80% faster than Direct Agent
- 60% smaller bundle size
- Better SEO rankings
```

### Direct Schema Agent ⚡
```
🎯 TARGETS:
- TTFB: <150ms
- TTI: <300ms
- Bundle: <150KB
- CLS: <0.15
- Lighthouse: >90

📈 BASELINE:
- Current performance standard
- Widget composition overhead
- Schema processing time
```

### LLM Agent 🤖
```
🎯 TARGETS:
- TTFB: <200ms (UI)
- Agent Response: <3s
- Bundle: <200KB
- CLS: <0.2
- Lighthouse: >85

📈 TRADE-OFFS:
- AI processing latency
- Context resolution time
- Tool execution overhead
```

### LangGraph Agent 🔄
```
🎯 TARGETS:
- TTFB: <200ms (UI)
- Workflow Duration: <30s
- Bundle: <300KB
- CLS: <0.2
- Lighthouse: >80

📈 COMPLEXITY:
- Multi-step processing
- State management overhead
- Tool coordination latency
```

## 🧪 Benchmarking Test Suite

### Test Environment Setup

```typescript
// tests/performance/benchmark-config.ts
export const benchmarkConfig = {
  // Test environments
  environments: {
    development: 'http://localhost:3000',
    staging: 'https://staging.leaderforge.ai',
    production: 'https://leaderforge.ai'
  },

  // Test patterns
  patterns: {
    static_page: {
      routes: ['/context/preferences', '/user/profile'],
      expectedTTFB: 100,
      expectedTTI: 200
    },
    direct_schema: {
      routes: ['/dashboard/executive', '/progress/tracking'],
      expectedTTFB: 150,
      expectedTTI: 300
    },
    llm_agent: {
      routes: ['/content/suggestions', '/smart/reply'],
      expectedTTFB: 200,
      expectedAgentResponse: 3000
    },
    langgraph: {
      routes: ['/workflows/onboarding', '/decision/trees'],
      expectedTTFB: 200,
      expectedWorkflowDuration: 30000
    }
  },

  // Test scenarios
  scenarios: {
    coldStart: 'First visit, no cache',
    warmCache: 'Cached resources available',
    slowNetwork: '3G network simulation',
    lowCPU: '4x CPU slowdown simulation'
  }
};
```

### Automated Performance Testing

```typescript
// tests/performance/lighthouse-benchmark.ts
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

export async function runLighthouseBenchmark(url: string, pattern: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Run Lighthouse audit
  const result = await lighthouse(url, {
    port: browser.debuggerPort,
    output: 'json',
    logLevel: 'info',
    onlyCategories: ['performance'],
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1
      }
    }
  });

  const metrics = {
    pattern,
    url,
    timestamp: new Date().toISOString(),
    performance: {
      score: result.lhr.categories.performance.score * 100,
      ttfb: result.lhr.audits['server-response-time'].numericValue,
      tti: result.lhr.audits.interactive.numericValue,
      cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
      bundleSize: result.lhr.audits['total-byte-weight'].numericValue
    }
  };

  await browser.close();
  return metrics;
}
```

### Agent Response Time Testing

```typescript
// tests/performance/agent-benchmark.ts
export async function benchmarkAgentResponse(
  agentType: string,
  endpoint: string,
  payload: object
) {
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const endTime = performance.now();

    return {
      agentType,
      endpoint,
      responseTime: endTime - startTime,
      success: response.ok,
      statusCode: response.status,
      dataSize: JSON.stringify(data).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      agentType,
      endpoint,
      responseTime: performance.now() - startTime,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

## 📈 Performance Monitoring Dashboard

### Real-time Metrics Collection

```typescript
// lib/performance/monitor.ts
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  recordPageLoad(pattern: string, route: string) {
    const navigation = performance.getEntriesByType('navigation')[0];

    this.metrics.push({
      type: 'page_load',
      pattern,
      route,
      ttfb: navigation.responseStart - navigation.requestStart,
      domLoad: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      timestamp: Date.now()
    });

    // Send to analytics
    this.reportMetrics();
  }

  recordAgentResponse(agentType: string, duration: number) {
    this.metrics.push({
      type: 'agent_response',
      pattern: agentType,
      duration,
      timestamp: Date.now()
    });
  }

  private async reportMetrics() {
    // Send to monitoring service (e.g., DataDog, New Relic)
    await fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(this.metrics.slice(-10))
    });
  }
}
```

### Performance Comparison Views

```typescript
// components/admin/PerformanceDashboard.tsx
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceData[]>([]);

  return (
    <div className="performance-dashboard">
      <h2>Agent Pattern Performance Comparison</h2>

      {/* Load Time Comparison Chart */}
      <Chart
        type="bar"
        data={{
          labels: ['Static Page', 'Direct Schema', 'LLM Agent', 'LangGraph'],
          datasets: [{
            label: 'Average Load Time (ms)',
            data: metrics.map(m => m.averageLoadTime),
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
          }]
        }}
      />

      {/* Performance Trends */}
      <Chart
        type="line"
        data={{
          labels: metrics.map(m => m.date),
          datasets: [
            { label: 'Static Page', data: metrics.map(m => m.staticPageTTI) },
            { label: 'Direct Schema', data: metrics.map(m => m.directSchemaTTI) },
            { label: 'LLM Agent', data: metrics.map(m => m.llmAgentTTI) },
            { label: 'LangGraph', data: metrics.map(m => m.langgraphTTI) }
          ]
        }}
      />

      {/* Bundle Size Impact */}
      <BundleAnalysis patterns={['static', 'direct', 'llm', 'langgraph']} />
    </div>
  );
}
```

## 🔄 Continuous Benchmarking Pipeline

### GitHub Actions Integration

```yaml
# .github/workflows/performance-benchmark.yml
name: Performance Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  benchmark:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start test server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run performance benchmarks
        run: npm run test:performance

      - name: Generate performance report
        run: npm run performance:report

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('performance-results/summary.json'));

            const body = `## 📊 Performance Benchmark Results

            | Pattern | TTFB | TTI | Bundle Size | Lighthouse |
            |---------|------|-----|-------------|------------|
            | Static Page | ${results.staticPage.ttfb}ms | ${results.staticPage.tti}ms | ${results.staticPage.bundle} | ${results.staticPage.lighthouse} |
            | Direct Schema | ${results.directSchema.ttfb}ms | ${results.directSchema.tti}ms | ${results.directSchema.bundle} | ${results.directSchema.lighthouse} |
            | LLM Agent | ${results.llmAgent.ttfb}ms | ${results.llmAgent.tti}ms | ${results.llmAgent.bundle} | ${results.llmAgent.lighthouse} |
            | LangGraph | ${results.langgraph.ttfb}ms | ${results.langgraph.tti}ms | ${results.langgraph.bundle} | ${results.langgraph.lighthouse} |

            ${results.regressions.length > 0 ? '⚠️ Performance regressions detected!' : '✅ No performance regressions'}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
```

## 📋 Test Scripts

### NPM Scripts Configuration

```json
{
  "scripts": {
    "test:performance": "node scripts/run-benchmarks.js",
    "performance:lighthouse": "node scripts/lighthouse-audit.js",
    "performance:bundle": "webpack-bundle-analyzer build/static/js/*.js",
    "performance:report": "node scripts/generate-report.js",
    "performance:compare": "node scripts/compare-patterns.js"
  }
}
```

### Benchmark Execution Script

```javascript
// scripts/run-benchmarks.js
const { benchmarkConfig } = require('../tests/performance/benchmark-config');
const { runLighthouseBenchmark } = require('../tests/performance/lighthouse-benchmark');
const { benchmarkAgentResponse } = require('../tests/performance/agent-benchmark');

async function runAllBenchmarks() {
  const results = {};

  // Test each pattern
  for (const [pattern, config] of Object.entries(benchmarkConfig.patterns)) {
    console.log(`🧪 Benchmarking ${pattern} pattern...`);

    const patternResults = [];

    for (const route of config.routes) {
      const url = `${benchmarkConfig.environments.development}${route}`;

      // Lighthouse benchmark
      const lighthouseResult = await runLighthouseBenchmark(url, pattern);

      // Agent response benchmark (if applicable)
      let agentResult = null;
      if (pattern !== 'static_page') {
        agentResult = await benchmarkAgentResponse(
          pattern,
          `/api/agent/content`,
          { route, pattern }
        );
      }

      patternResults.push({
        route,
        lighthouse: lighthouseResult,
        agent: agentResult
      });

      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    results[pattern] = patternResults;
  }

  // Generate summary report
  const summary = generateSummaryReport(results);

  // Save results
  const fs = require('fs');
  const resultsDir = 'performance-results';

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  fs.writeFileSync(`${resultsDir}/detailed.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync(`${resultsDir}/summary.json`, JSON.stringify(summary, null, 2));

  console.log('📊 Benchmark results saved to performance-results/');
  console.log('📈 Summary:', summary);
}

function generateSummaryReport(results) {
  // Calculate averages and identify regressions
  // Implementation details...
}

runAllBenchmarks().catch(console.error);
```

## 🎯 Performance Validation Checklist

### Pre-release Validation
- [ ] All patterns meet performance targets
- [ ] No regressions from previous release
- [ ] Bundle size within acceptable limits
- [ ] Lighthouse scores maintained/improved

### Pattern-specific Validation
- [ ] **Static Page**: <200ms TTI, >95 Lighthouse
- [ ] **Direct Schema**: <300ms TTI, >90 Lighthouse
- [ ] **LLM Agent**: <3s response, >85 Lighthouse
- [ ] **LangGraph**: <30s workflow, >80 Lighthouse

### Monitoring Setup
- [ ] Performance monitoring dashboard deployed
- [ ] Alerts configured for performance regressions
- [ ] Weekly performance reports automated
- [ ] Pattern usage analytics tracking

---

**Next Steps:** Run initial benchmark to establish baseline metrics for all patterns, then implement continuous monitoring.