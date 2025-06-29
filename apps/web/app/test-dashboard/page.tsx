/**
 * Purpose: Marcus Dashboard UI - World-class dashboard design with mock data
 * Owner: Dashboard System
 * Tags: [dashboard, ui, marcus, design]
 */

"use client";

import React, { useState } from 'react';
import { LeaderForgeCard } from '../../components/widgets/LeaderForgeCard';
import StatCard from '../../components/widgets/StatCard';
import List from '../../components/widgets/List';

// Mock data matching our Universal Widget Schema
const mockVideoData = {
  id: 'leadership-fundamentals-01',
  type: 'Card' as const,
  version: '1.0.0',
  config: {
    title: 'Leadership Fundamentals: Building Trust',
    subtitle: 'Essential Skills Module 1',
    actions: [
      { label: 'Watch Video', action: 'openVideoModal' },
      { label: 'Worksheet', action: 'openWorksheet' }
    ]
  },
  data: {
    source: 'dashboard',
    imageUrl: '/thumb1.png',
    videoUrl: 'https://example.com/video1.mp4',
    description: 'Learn the foundational principles of building trust with your team through authentic leadership practices.',
    duration: '8:24',
    progress: 65,
    stats: {
      watched: false,
      completed: false
    }
  }
};

const mockProgressStats = [
  {
    id: '5-minute-standup',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'NEXT STANDUP',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: 'Today 2:00 PM',
      change: null,
      trend: 'neutral' as const,
      icon: 'Users',
      nextStandup: '2024-01-15T14:00:00Z',
      hasScheduled: true,
      showButton: true,
      buttonText: 'Schedule Meeting',
      buttonAction: 'openStandupModal'
    }
  },
  {
    id: 'quick-journal',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'QUICKJOURNAL',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: '2 days ago',
      change: null,
      trend: 'neutral' as const,
      icon: 'BookOpen',
      lastEntry: 'Great progress on team feedback culture initiative...',
      lastEntryDate: '2024-01-13T10:30:00Z',
      showButton: true,
      buttonText: 'Journal',
      buttonAction: 'openJournalModal'
    }
  },
  {
    id: 'videos-watched',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'Videos Watched',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: '4/12',
      change: '+1 this week',
      trend: 'up' as const,
      icon: 'Video',
      progress: 33
    }
  },
  {
    id: 'worksheets-completed',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'Worksheets',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: '3/12',
      change: '+2 this week',
      trend: 'up' as const,
      icon: 'FileText',
      progress: 25
    }
  },
  {
    id: 'bold-actions',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'Bold Actions',
      variant: 'success'
    },
    data: {
      source: 'dashboard',
      value: '5',
      change: '+1 active',
      trend: 'up' as const,
      icon: 'Target',
      progress: 80
    }
  }
];

const mockLeaderboardData = {
  id: 'team-leaderboard',
  type: 'List' as const,
  version: '1.0.0',
  config: {
    title: 'Leaderboard',
    listType: 'leaderboard',
    showRankInfo: true
  },
  data: {
    source: 'dashboard',
    entries: [
      { name: 'Sarah Chen', score: 240, rank: 1, avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=3b82f6&color=fff', isTeamLead: true, videos: 8, worksheets: 7, trend: 'up' as const },
      { name: 'David Kim', score: 220, rank: 2, avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=10b981&color=fff', videos: 7, worksheets: 6, trend: 'up' as const },
      { name: 'Marcus Johnson', score: 180, rank: 3, avatar: 'https://ui-avatars.com/api/?name=Marcus+Johnson&background=f59e0b&color=fff', isCurrentUser: true, videos: 4, worksheets: 3, trend: 'same' as const },
      { name: 'Lisa Wang', score: 150, rank: 4, avatar: 'https://ui-avatars.com/api/?name=Lisa+Wang&background=8b5cf6&color=fff', videos: 5, worksheets: 2, trend: 'down' as const },
      { name: 'Alex Rivera', score: 120, rank: 5, avatar: 'https://ui-avatars.com/api/?name=Alex+Rivera&background=ef4444&color=fff', videos: 3, worksheets: 4, trend: 'up' as const },
      { name: 'James Wilson', score: 110, rank: 6, avatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=6366f1&color=fff', videos: 2, worksheets: 3, trend: 'up' as const },
      { name: 'Emma Davis', score: 95, rank: 7, avatar: 'https://ui-avatars.com/api/?name=Emma+Davis&background=ec4899&color=fff', videos: 3, worksheets: 1, trend: 'down' as const },
      { name: 'Michael Brown', score: 85, rank: 8, avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=84cc16&color=fff', videos: 2, worksheets: 2, trend: 'same' as const },
      { name: 'Sophie Taylor', score: 75, rank: 9, avatar: 'https://ui-avatars.com/api/?name=Sophie+Taylor&background=f97316&color=fff', videos: 1, worksheets: 2, trend: 'up' as const },
      { name: 'Ryan Martinez', score: 65, rank: 10, avatar: 'https://ui-avatars.com/api/?name=Ryan+Martinez&background=14b8a6&color=fff', videos: 1, worksheets: 1, trend: 'down' as const }
    ]
  }
};

const mockActivityData = {
  id: 'my-activity',
  type: 'List' as const,
  version: '1.0.0',
  config: {
    title: 'My Activity',
    listType: 'activity',
    showRankInfo: false,
    showActivityInfo: true,
    activityCount: 6,
    activityPeriod: 'this week'
  },
  data: {
    source: 'dashboard',
    entries: [
      { id: '1', activity: 'Watched Video', description: 'Leadership Fundamentals: Building Trust', timestamp: '2024-01-15T08:30:00Z' },
      { id: '2', activity: 'Completed Worksheet', description: 'Trust Building Exercise', timestamp: '2024-01-15T08:45:00Z' },
      { id: '3', activity: 'Journaled', description: 'Reflection on team feedback culture', timestamp: '2024-01-14T18:20:00Z' },
      { id: '4', activity: 'Had Standup', description: '5-minute leadership check-in', timestamp: '2024-01-14T14:00:00Z' },
      { id: '5', activity: 'Completed Bold Action', description: 'Implemented weekly team retrospectives', timestamp: '2024-01-14T10:15:00Z' },
      { id: '6', activity: 'Watched Video', description: 'Effective Communication Strategies', timestamp: '2024-01-13T16:30:00Z' },
      { id: '7', activity: 'Journaled', description: 'Leadership challenges and wins', timestamp: '2024-01-13T10:30:00Z' },
      { id: '8', activity: 'Completed Worksheet', description: 'Communication Style Assessment', timestamp: '2024-01-12T15:20:00Z' },
      { id: '9', activity: 'Had Standup', description: 'Team alignment meeting', timestamp: '2024-01-12T14:00:00Z' },
      { id: '10', activity: 'Completed Bold Action', description: 'Launched peer feedback system', timestamp: '2024-01-11T11:45:00Z' }
    ]
  }
};

// Worksheet Modal Component - Design System Compliant
function WorksheetModal({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) {
  const [insights, setInsights] = useState(['', '', '']);
  const [bigIdea, setBigIdea] = useState('');
  const [timeframe, setTimeframe] = useState('1 week');
  const [boldAction, setBoldAction] = useState('');
  const [futureIdeas, setFutureIdeas] = useState(['']);

  if (!isOpen) return null;

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...insights];
    newInsights[index] = value;
    setInsights(newInsights);
  };

  const addFutureIdea = () => {
    setFutureIdeas([...futureIdeas, '']);
  };

  const handleFutureIdeaChange = (index: number, value: string) => {
    const newIdeas = [...futureIdeas];
    newIdeas[index] = value;
    setFutureIdeas(newIdeas);
  };

  const handleSubmit = () => {
    console.log('Worksheet submitted:', {
      insights: insights.filter(i => i.trim()),
      bigIdea,
      timeframe,
      boldAction,
      futureIdeas: futureIdeas.filter(i => i.trim())
    });
    onClose();
  };

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
              {title} - Worksheet
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

          <div className="space-y-5">
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
                <button
                  onClick={addFutureIdea}
                  className="text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another idea
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200/50">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Submit Worksheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Standup Calendar Modal Component - Design System Compliant
function StandupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [meetingTitle, setMeetingTitle] = useState('5-Minute Leadership Standup');
  const [meetingDate, setMeetingDate] = useState('2024-01-15');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [recurrence, setRecurrence] = useState('daily');
  const [inviteEmails, setInviteEmails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('Standup meeting scheduled:', {
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      recurrence,
      invites: inviteEmails.split(',').map(email => email.trim()).filter(Boolean)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Schedule Standup Meeting
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            {/* Meeting Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Meeting Title:
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Date:
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Time:
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Recurrence:
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
              >
                <option value="none">No recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Email Invites */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Invite Team Members (email addresses):
              </label>
              <textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="sarah@company.com, david@company.com, lisa@company.com"
                rows={3}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200/50">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Journal Modal Component - Design System Compliant
function JournalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [journalEntry, setJournalEntry] = useState('');
  const [moodRating, setMoodRating] = useState(5);
  const [keyWins, setKeyWins] = useState(['']);
  const [challenges, setChallenges] = useState(['']);
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('Journal entry submitted:', {
      entry: journalEntry,
      mood: moodRating,
      wins: keyWins.filter(w => w.trim()),
      challenges: challenges.filter(c => c.trim()),
      tomorrowFocus,
      isPrivate,
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  const addKeyWin = () => {
    setKeyWins([...keyWins, '']);
  };

  const handleKeyWinChange = (index: number, value: string) => {
    const newWins = [...keyWins];
    newWins[index] = value;
    setKeyWins(newWins);
  };

  const addChallenge = () => {
    setChallenges([...challenges, '']);
  };

  const handleChallengeChange = (index: number, value: string) => {
    const newChallenges = [...challenges];
    newChallenges[index] = value;
    setChallenges(newChallenges);
  };

  const moodEmojis = ['😞', '😕', '😐', '😊', '😄'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              QuickJournal Entry
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            {/* Mood Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                How are you feeling today?
              </label>
              <div className="flex items-center gap-2">
                {moodEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => setMoodRating(index + 1)}
                    className={`text-2xl p-2 rounded-full transition-all duration-200 ${
                      moodRating === index + 1
                        ? 'bg-blue-100 ring-2 ring-blue-400'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Journal Entry */}
            <div>
                             <label className="block text-xs font-medium text-slate-700 mb-2">
                 What&apos;s on your mind?
               </label>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Share your thoughts, reflections, or anything you'd like to remember about today..."
                rows={6}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
            </div>

            {/* Key Wins */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Key wins today:
              </label>
              <div className="space-y-2">
                {keyWins.map((win, index) => (
                  <input
                    key={index}
                    type="text"
                    value={win}
                    onChange={(e) => handleKeyWinChange(index, e.target.value)}
                    placeholder={`Win ${index + 1}...`}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                ))}
                <button
                  onClick={addKeyWin}
                  className="text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another win
                </button>
              </div>
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Challenges faced:
              </label>
              <div className="space-y-2">
                {challenges.map((challenge, index) => (
                  <input
                    key={index}
                    type="text"
                    value={challenge}
                    onChange={(e) => handleChallengeChange(index, e.target.value)}
                    placeholder={`Challenge ${index + 1}...`}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                ))}
                <button
                  onClick={addChallenge}
                  className="text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another challenge
                </button>
              </div>
            </div>

            {/* Tomorrow's Focus */}
            <div>
                             <label className="block text-xs font-medium text-slate-700 mb-2">
                 Tomorrow&apos;s main focus:
               </label>
              <textarea
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder="What's the one thing you want to prioritize tomorrow?"
                rows={3}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private-entry"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-slate-200/80 text-blue-600 focus:ring-2 focus:ring-blue-400/30"
              />
              <label htmlFor="private-entry" className="text-xs text-slate-600">
                Keep this entry private
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200/50">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestDashboard() {
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const handleCardAction = (action: { action: string; [key: string]: unknown }) => {
    console.log('Card action:', action);
    if (action.action === 'openWorksheet') {
      setIsWorksheetOpen(true);
    } else if (action.action === 'openStandupModal') {
      setIsStandupModalOpen(true);
    } else if (action.action === 'openJournalModal') {
      setIsJournalModalOpen(true);
    }
  };

      return (
    <div className="min-h-screen bg-gray-50">
      {/* ContentPanel-style container with proper Tailwind grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 mb-1">My Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, Marcus! Ready to continue your leadership journey?</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Overall Progress</div>
                <div className="text-2xl font-semibold text-gray-900">34%</div>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                MJ
              </div>
            </div>
          </div>
        </header>

                {/* My Progress Stats - Full Width Row */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {mockProgressStats.map((stat) => (
              <StatCard key={stat.id} schema={stat} onAction={handleCardAction} />
            ))}
          </div>
        </section>

        {/* Three Column Layout: Next Up, My Activity, Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Next Up Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Next Up</h2>
            <div className="w-full">
              <LeaderForgeCard
                schema={mockVideoData}
                userId="marcus-johnson"
                onAction={handleCardAction}
              />
            </div>
          </section>

          {/* My Activity Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Activity</h2>
            <div className="w-full h-[508px]">
              <List schema={mockActivityData} />
            </div>
          </section>

          {/* Leaderboard Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h2>
            <div className="w-full h-[508px]">
              <List schema={mockLeaderboardData} />
            </div>
          </section>

        </div>
      </div>

      {/* Worksheet Modal */}
      <WorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        title={mockVideoData.config.title}
      />

      {/* Standup Modal */}
      <StandupModal
        isOpen={isStandupModalOpen}
        onClose={() => setIsStandupModalOpen(false)}
      />

      {/* Journal Modal */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
      />
    </div>
  );
}