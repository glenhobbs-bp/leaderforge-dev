/**
 * Purpose: Mockup Renderer - Dynamically renders JSX mockup components from agent responses
 * Owner: Mockup System
 * Tags: [mockup, renderer, agent-native, dynamic-import]
 */

"use client";

import React, { Suspense, lazy, useMemo, useState } from 'react';
import { ExclamationTriangleIcon, ChatBubbleIcon } from '@radix-ui/react-icons';

interface MockupRendererProps {
  componentName: string;
  title?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupName: string;
  agentId?: string;
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

  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="mockup-renderer">
      {/* Mockup banner - always visible for mockups */}
      {metadata && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-800">
              🎭 Mockup: {componentName}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Agent: {metadata.agentName as string} | Interactive prototype for UX validation
            </div>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ChatBubbleIcon className="w-4 h-4" />
            <span>Feedback</span>
          </button>
        </div>
      )}

      {/* Render the mockup component with error boundary */}
      <Suspense fallback={<LoadingFallback />}>
        <ErrorBoundary fallback={ErrorFallback}>
          <MockupComponent />
        </ErrorBoundary>
      </Suspense>

      {/* Feedback modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        mockupName={componentName}
        agentId={metadata?.agentId as string}
      />
    </div>
  );
}

// Feedback collection modal
function FeedbackModal({ isOpen, onClose, mockupName, agentId }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || rating === null) return;

    setIsSubmitting(true);

    try {
      // Log feedback to console for now - can be enhanced to send to API
      console.log('[MockupFeedback]', {
        mockupName,
        agentId,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      // Future: Send to feedback collection API
      // await fetch('/api/feedback/mockup', { ... });

      // Show success message
      alert('Thank you for your feedback! This helps us improve the feature.');

      // Reset form
      setFeedback('');
      setRating(null);
      onClose();
    } catch (error) {
      console.error('[MockupFeedback] Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Mockup Feedback: {mockupName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    rating === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you think? (Required)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts on this mockup..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              required
            />
          </div>

          {/* Submit buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim() || rating === null || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
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