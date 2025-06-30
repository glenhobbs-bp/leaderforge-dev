/**
 * Purpose: Video Worksheet Form - Captures video reflection worksheet responses for Universal Input System
 * Owner: Universal Input System
 * Tags: [form, worksheet, video-reflection, universal-input, agent-native]
 */

"use client";

import React, { useState } from 'react';

interface VideoWorksheetFormProps {
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (result: UniversalInputResponse) => void;
}

interface UniversalInputResponse {
  success: boolean;
  input_id?: string;
  processing_status: 'immediate' | 'queued' | 'error';
  derivations_triggered: string[];
  calculated_score?: number;
  error?: string;
}

export function VideoWorksheetForm({
  videoId,
  videoTitle,
  videoDuration,
  isOpen,
  onClose,
  onSubmit
}: VideoWorksheetFormProps) {
  const [insights, setInsights] = useState(['', '', '']);
  const [bigIdea, setBigIdea] = useState('');
  const [timeframe, setTimeframe] = useState('1 week');
  const [boldAction, setBoldAction] = useState('');
  const [futureIdeas, setFutureIdeas] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const addFutureIdea = () => {
    if (futureIdeas.length < 10) {
      setFutureIdeas([...futureIdeas, '']);
    }
  };

  const handleFutureIdeaChange = (index: number, value: string) => {
    const newIdeas = [...futureIdeas];
    newIdeas[index] = value;
    setFutureIdeas(newIdeas);
  };

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...insights];
    newInsights[index] = value;
    setInsights(newInsights);
  };

  const calculateTimeSpent = (): number => {
    return Math.round((Date.now() - startTime) / 1000 / 60); // minutes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = {
        insights: insights.filter(i => i.trim()),
        big_idea: bigIdea,
        timeframe,
        bold_action: boldAction,
        future_ideas: futureIdeas.filter(i => i.trim())
      };

      const response = await fetch('/api/input/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'form',
          input_data: {
            worksheet_id: 'video-reflection-worksheet',
            video_context: {
              video_id: videoId,
              video_title: videoTitle,
              video_duration: videoDuration
            },
            responses: formData,
            completion_percentage: 100,
            time_spent_minutes: calculateTimeSpent(),
            completion_timestamp: new Date().toISOString()
          },
          source_context: `worksheet:video-reflection:${videoId}`,
          context_type: 'team',
          requires_agent: true
        })
      });

      const result: UniversalInputResponse = await response.json();

      if (result.success) {
        console.log('[VideoWorksheet] Submitted successfully:', {
          input_id: result.input_id,
          score: result.calculated_score,
          derivations: result.derivations_triggered
        });

        // Show success feedback to user
        alert(`Worksheet submitted successfully! You earned ${result.calculated_score} points.`);

        // Reset form
        setInsights(['', '', '']);
        setBigIdea('');
        setTimeframe('1 week');
        setBoldAction('');
        setFutureIdeas(['']);

        onSubmit?.(result);
        onClose();
      } else {
        console.error('[VideoWorksheet] Submission error:', result.error);
        alert(`Error submitting worksheet: ${result.error}`);
      }
    } catch (error) {
      console.error('[VideoWorksheet] Network error:', error);
      alert('Network error submitting worksheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              {videoTitle} - Worksheet
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Top 3 Insights */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Top 3 Insights from this video:
              </label>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Insight ${index + 1}`}
                    value={insight}
                    onChange={(e) => handleInsightChange(index, e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                ))}
              </div>
            </div>

            {/* One Big Idea */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                One Big Idea I want to implement:
              </label>
              <textarea
                value={bigIdea}
                onChange={(e) => setBigIdea(e.target.value)}
                placeholder="Describe the one big idea you want to focus on..."
                rows={4}
                required
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
            </div>

            {/* Expected Timeframe */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Expected Timeframe:
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
              >
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="3 weeks">3 weeks</option>
              </select>
            </div>

            {/* Bold Action */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                My Bold Action:
              </label>
              <textarea
                value={boldAction}
                onChange={(e) => setBoldAction(e.target.value)}
                placeholder="What specific action will you take to implement this idea?"
                rows={4}
                required
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
            </div>

            {/* Future Ideas */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Future Ideas to explore:
              </label>
              <div className="space-y-3">
                {futureIdeas.map((idea, index) => (
                  <textarea
                    key={index}
                    value={idea}
                    onChange={(e) => handleFutureIdeaChange(index, e.target.value)}
                    placeholder={`Future idea ${index + 1}...`}
                    rows={2}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
                  />
                ))}
                {futureIdeas.length < 10 && (
                  <button
                    type="button"
                    onClick={addFutureIdea}
                    className="text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/60 transition-all duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add another idea
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200/50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bigIdea.trim() || !boldAction.trim() || isSubmitting}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Worksheet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}