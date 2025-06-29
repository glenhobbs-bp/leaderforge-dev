/**
 * Purpose: Mockup Renderer - Dynamically renders JSX mockup components from agent responses
 * Owner: Mockup System
 * Tags: [mockup, renderer, agent-native, dynamic-import]
 */

"use client";

import React, { Suspense, lazy, useMemo } from 'react';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface MockupRendererProps {
  componentName: string;
  title?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export default function MockupRenderer({
  componentName,
  title = "Mockup Component",
  subtitle = "Interactive prototype",
  metadata
}: MockupRendererProps) {

  // Dynamic import with error handling
  const MockupComponent = useMemo(() => {
    try {
      return lazy(() =>
        import(`../mockups/${componentName}`)
          .catch((error) => {
            console.error(`[MockupRenderer] Failed to load mockup component: ${componentName}`, error);
            throw error;
          })
      );
    } catch (error) {
      console.error(`[MockupRenderer] Error creating lazy component for: ${componentName}`, error);
      return null;
    }
  }, [componentName]);

  // Loading fallback
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading {title}...</p>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );

  // Error fallback
  const ErrorFallback = ({ error }: { error?: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-600 mb-2">Mockup Not Available</h3>
             <p className="text-slate-600 mb-4">
         The mockup component &ldquo;{componentName}&rdquo; could not be loaded.
       </p>
      {error && (
        <details className="text-xs text-slate-500 mt-2">
          <summary>Error Details</summary>
          <pre className="mt-2 p-2 bg-slate-100 rounded text-left">{error}</pre>
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  );

  // If component creation failed
  if (!MockupComponent) {
    return <ErrorFallback error={`Component ${componentName} not found in mockups directory`} />;
  }

  return (
    <div className="mockup-renderer">
      {/* Optional header for development/debugging */}
      {process.env.NODE_ENV === 'development' && metadata && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800">
            🎭 Mockup: {componentName}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Agent: {metadata.agentName} | ID: {metadata.agentId}
          </div>
        </div>
      )}

      {/* Render the mockup component with error boundary */}
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary fallback={ErrorFallback}>
          <MockupComponent />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

// Simple error boundary for mockup components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error?: string }> },
  { hasError: boolean; error?: string }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ error?: string }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MockupRenderer] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}