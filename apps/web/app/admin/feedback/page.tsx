/**
 * Purpose: Mockup Feedback Admin Dashboard - View and analyze user feedback on mockups
 * Owner: Mockup System
 * Tags: [admin, feedback, analytics, mockup]
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../../components/SupabaseProvider';
import { ExclamationTriangleIcon, ChatBubbleIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';

interface FeedbackEntry {
  id: string;
  mockup_name: string;
  user_email: string;
  user_name: string;
  rating: number;
  feedback_text: string;
  status: string;
  created_at: string;
  agent_name: string;
}

interface FeedbackAnalytics {
  mockup_name: string;
  agent_name: string;
  total_feedback: number;
  avg_rating: number;
  positive_feedback: number;
  negative_feedback: number;
  last_feedback_date: string;
  unique_users: number;
}

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMockup, setSelectedMockup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { session } = useSupabase();

  useEffect(() => {
    if (session?.access_token) {
      loadFeedbackData();
    }
  }, [session, selectedMockup, statusFilter]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMockup !== 'all') {
        params.append('mockup', selectedMockup);
      }
      params.append('limit', '100');

      const response = await fetch(`/api/feedback/mockup?${params}`, {
        headers: {
          'Authorization': `Bearer ${session!.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
      setAnalytics(data.analytics || []);
    } catch (err) {
      console.error('[FeedbackAdmin] Error loading feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedback.filter(entry => {
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the feedback dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mockup Feedback Dashboard</h1>
          <p className="text-gray-600">Analyze user feedback and improve mockup experiences</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading feedback data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Analytics Overview */}
        {!loading && analytics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.map((mockup) => (
                <div key={mockup.mockup_name} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 truncate">{mockup.mockup_name}</h3>
                    <div className={`px-2 py-1 rounded-full text-sm font-medium ${getRatingColor(mockup.avg_rating)}`}>
                      ★ {mockup.avg_rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Feedback:</span>
                      <span className="font-medium">{mockup.total_feedback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Users:</span>
                      <span className="font-medium">{mockup.unique_users}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sentiment:</span>
                      <div className="flex space-x-2">
                        <span className="flex items-center text-green-600">
                          <ArrowUpIcon className="w-3 h-3 mr-1" />
                          {mockup.positive_feedback}
                        </span>
                        <span className="flex items-center text-red-600">
                          <ArrowDownIcon className="w-3 h-3 mr-1" />
                          {mockup.negative_feedback}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2">
                      Last feedback: {formatDate(mockup.last_feedback_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mockup</label>
                <select
                  value={selectedMockup}
                  onChange={(e) => setSelectedMockup(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Mockups</option>
                  {analytics.map(mockup => (
                    <option key={mockup.mockup_name} value={mockup.mockup_name}>
                      {mockup.mockup_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="addressed">Addressed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadFeedbackData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        {!loading && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Feedback ({filteredFeedback.length})
              </h2>
            </div>

            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ChatBubbleIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No feedback found matching your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFeedback.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{entry.mockup_name}</h3>
                        <p className="text-sm text-gray-600">
                          {entry.user_name || entry.user_email} • {formatDate(entry.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(entry.rating)}`}>
                          ★ {entry.rating}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          entry.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
                          entry.status === 'addressed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        &ldquo;{entry.feedback_text}&rdquo;
                      </p>
                    </div>

                    {entry.agent_name && (
                      <div className="mt-2 text-xs text-gray-500">
                        Agent: {entry.agent_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}