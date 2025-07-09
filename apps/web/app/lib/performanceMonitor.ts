/**
 * File: apps/web/app/lib/performanceMonitor.ts
 * Purpose: Performance monitoring utilities for agent-driven pages - baseline measurement & optimization validation
 * Owner: Frontend team
 * Tags: performance, monitoring, metrics, optimization
 */

export interface PerformanceMetrics {
  agentType: string;
  tenantKey: string;
  navOptionId?: string;
  phases: {
    authCheck: number;
    agentCall: number;
    dataFetch: number;
    rendering: number;
    hydration: number;
    total: number;
  };
  timestamps: {
    start: number;
    authComplete: number;
    agentCallStart: number;
    agentCallComplete: number;
    renderStart: number;
    renderComplete: number;
    hydrationComplete: number;
  };
  metadata: {
    userId?: string;
    sessionId: string;
    browser: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    networkType?: string;
  };
}

export interface PerformanceTarget {
  agentType: string;
  targetMs: number;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Performance targets from ADR-0025
export const PERFORMANCE_TARGETS: PerformanceTarget[] = [
  { agentType: 'static_page', targetMs: 80, description: 'Static pages (critical for 100k+ users)', priority: 'critical' },
  { agentType: 'direct_schema', targetMs: 200, description: 'Direct schema agents (dashboards)', priority: 'high' },
  { agentType: 'content_schema', targetMs: 600, description: 'LLM-powered agents (AI features)', priority: 'medium' },
  { agentType: 'langgraph', targetMs: 1200, description: 'Complex workflows (background)', priority: 'low' }
];

/**
 * Performance monitor for tracking agent-driven page performance
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private activeSession: Partial<PerformanceMetrics> | null = null;
  private metrics: PerformanceMetrics[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance tracking for a new page load
   */
  startTracking(agentType: string, tenantKey: string, navOptionId?: string, userId?: string): void {
    if (typeof window === 'undefined' || !window.performance) return;
    const now = window.performance.now();

    this.activeSession = {
      agentType,
      tenantKey,
      navOptionId,
      phases: {
        authCheck: 0,
        agentCall: 0,
        dataFetch: 0,
        rendering: 0,
        hydration: 0,
        total: 0
      },
      timestamps: {
        start: now,
        authComplete: 0,
        agentCallStart: 0,
        agentCallComplete: 0,
        renderStart: 0,
        renderComplete: 0,
        hydrationComplete: 0
      },
      metadata: {
        userId,
        sessionId: this.sessionId,
        browser: this.getBrowserInfo(),
        deviceType: this.getDeviceType(),
        networkType: this.getNetworkType()
      }
    };

    console.log(`[PerformanceMonitor] 🚀 Started tracking: ${agentType} (${tenantKey})`);
  }

  /**
   * Mark authentication phase complete
   */
  markAuthComplete(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.authComplete = now;
    this.activeSession.phases!.authCheck = now - this.activeSession.timestamps!.start;

    console.log(`[PerformanceMonitor] ✅ Auth complete: ${this.activeSession.phases.authCheck.toFixed(2)}ms`);
  }

  /**
   * Mark agent call start
   */
  markAgentCallStart(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.agentCallStart = now;

    console.log(`[PerformanceMonitor] 🤖 Agent call started`);
  }

  /**
   * Mark agent call complete
   */
  markAgentCallComplete(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.agentCallComplete = now;
    this.activeSession.phases!.agentCall = now - this.activeSession.timestamps!.agentCallStart;

    console.log(`[PerformanceMonitor] ✅ Agent call complete: ${this.activeSession.phases.agentCall.toFixed(2)}ms`);
  }

  /**
   * Mark rendering start
   */
  markRenderStart(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.renderStart = now;

    console.log(`[PerformanceMonitor] 🎨 Rendering started`);
  }

  /**
   * Mark rendering complete
   */
  markRenderComplete(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.renderComplete = now;
    this.activeSession.phases!.rendering = now - this.activeSession.timestamps!.renderStart;

    console.log(`[PerformanceMonitor] ✅ Rendering complete: ${this.activeSession.phases.rendering.toFixed(2)}ms`);
  }

  /**
   * Mark hydration complete and finalize metrics
   */
  markHydrationComplete(): void {
    if (!this.activeSession || typeof window === 'undefined' || !window.performance) return;

    const now = window.performance.now();
    this.activeSession.timestamps!.hydrationComplete = now;
    this.activeSession.phases!.hydration = now - this.activeSession.timestamps!.renderComplete;
    this.activeSession.phases!.total = now - this.activeSession.timestamps!.start;

    // Finalize and store metrics
    const finalMetrics = this.activeSession as PerformanceMetrics;
    this.metrics.push(finalMetrics);

    // Performance analysis
    this.analyzePerformance(finalMetrics);

    console.log(`[PerformanceMonitor] 🏁 Session complete: ${finalMetrics.phases.total.toFixed(2)}ms total`);
    this.activeSession = null;
  }

  /**
   * Analyze performance against targets and log warnings
   */
  private analyzePerformance(metrics: PerformanceMetrics): void {
    const target = PERFORMANCE_TARGETS.find(t => t.agentType === metrics.agentType);

    if (target) {
      const performanceRatio = metrics.phases.total / target.targetMs;
      const status = performanceRatio <= 1 ? '✅ GOOD' :
                    performanceRatio <= 1.5 ? '⚠️ SLOW' : '🚨 CRITICAL';

      console.log(`[PerformanceMonitor] ${status} ${metrics.agentType}: ${metrics.phases.total.toFixed(2)}ms (target: ${target.targetMs}ms, ${(performanceRatio * 100).toFixed(1)}%)`);

      if (performanceRatio > 1.5) {
        console.warn(`[PerformanceMonitor] 🚨 PERFORMANCE ALERT: ${metrics.agentType} exceeded target by ${((performanceRatio - 1) * 100).toFixed(1)}%`);
      }

      // Phase breakdown for slow loads
      if (performanceRatio > 1.2) {
        console.log(`[PerformanceMonitor] 📊 Phase breakdown:`, {
          auth: `${metrics.phases.authCheck.toFixed(2)}ms`,
          agent: `${metrics.phases.agentCall.toFixed(2)}ms`,
          render: `${metrics.phases.rendering.toFixed(2)}ms`,
          hydration: `${metrics.phases.hydration.toFixed(2)}ms`
        });
      }
    }
  }

  /**
   * Get performance metrics for analysis
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get performance summary by agent type
   */
  getPerformanceSummary(): Record<string, { count: number; avgMs: number; p95Ms: number; target: number }> {
    const summary: Record<string, { measurements: number[]; target: number }> = {};

    // Group metrics by agent type
    this.metrics.forEach(metric => {
      if (!summary[metric.agentType]) {
        const target = PERFORMANCE_TARGETS.find(t => t.agentType === metric.agentType);
        summary[metric.agentType] = {
          measurements: [],
          target: target?.targetMs || 0
        };
      }
      summary[metric.agentType].measurements.push(metric.phases.total);
    });

    // Calculate statistics
    const result: Record<string, { count: number; avgMs: number; p95Ms: number; target: number }> = {};

    Object.entries(summary).forEach(([agentType, data]) => {
      const sorted = data.measurements.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);

      result[agentType] = {
        count: sorted.length,
        avgMs: sorted.reduce((sum, val) => sum + val, 0) / sorted.length,
        p95Ms: sorted[p95Index] || 0,
        target: data.target
      };
    });

    return result;
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[PerformanceMonitor] 🧹 Metrics cleared');
  }

  // Utility methods
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserInfo(): string {
    if (typeof navigator === 'undefined') return 'Server';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getNetworkType(): string | undefined {
    if (typeof navigator === 'undefined') return undefined;
    // @ts-expect-error - Navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || undefined;
  }
}

// Default singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();