/**
 * Purpose: Marcus Dashboard Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, dashboard, marcus, agent-native]
 */

"use client";

import React, { useState } from 'react';
import { LeaderForgeCard } from '../widgets/LeaderForgeCard';
import StatCard from '../widgets/StatCard';
import List from '../widgets/List';
import { FormWidget } from '../forms/FormWidget';

// Custom ToDoList component for Bold Actions and Cue Book integration
interface ToDoEntry {
  id: string;
  title: string;
  description: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
  inCueBook: boolean;
  category: string;
  rescheduleCount?: number;
}

interface WorksheetEntry {
  id: string;
  title: string;
  submissionCount: number;
  lastUpdated: string;
  status: 'completed' | 'in_progress' | 'reviewed';
  category: string;
}

interface ToDoSchema {
  config: {
    title: string;
    listType: string;
    showRankInfo: boolean;
    showCueBookInfo: boolean;
  };
  data: {
    source: string;
    entries: ToDoEntry[];
  };
}

// Add Task Modal Component
function AddTaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState<'Bold Action' | 'Video' | 'Worksheet' | 'Administrative'>('Bold Action');

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('New task created:', {
      title,
      description,
      due,
      priority,
      category,
      inCueBook: false,
      rescheduleCount: 0
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
            <h2 className="text-lg font-semibold text-slate-900">Add New Task</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Task Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
              />
            </div>

            {/* Due Date, Priority, Category */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Due Date:</label>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Priority:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'Bold Action' | 'Video' | 'Worksheet' | 'Administrative')}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white/70 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="Bold Action">Bold Action</option>
                  <option value="Video">Video</option>
                  <option value="Worksheet">Worksheet</option>
                  <option value="Administrative">Administrative</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToDoList({ schema }: { schema: ToDoSchema }) {
  const { data } = schema;
  const [sortBy, setSortBy] = useState<'due' | 'priority' | 'category' | 'points'>('due');
  const [filterBy, setFilterBy] = useState<'all' | 'Bold Action' | 'Video' | 'Worksheet' | 'Administrative'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Use neutral gray background for all tasks - rely on urgency pills for visual hierarchy
  const neutralCardStyling = 'border-gray-200 bg-gray-50';

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPointsForCategory = (category: string): number => {
    switch (category) {
      case 'Bold Action': return 20;
      case 'Video': case 'Worksheet': return 10;
      case 'Administrative': return 5;
      default: return 5;
    }
  };

  const getUrgencyPill = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: 'Overdue',
        className: 'bg-red-100 text-red-700 border-red-200',
        showText: true
      };
    } else if (diffDays <= 3) {
      return {
        text: `Due ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        showText: true
      };
    } else {
      return {
        text: `${diffDays} days`,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        showText: false
      };
    }
  };

  const getPriorityValue = (priority: string) => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      default: return 1;
    }
  };

  const getFilteredAndSortedTodos = () => {
    let filtered = data.entries;

    // Apply filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(todo => todo.category === filterBy);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'due':
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        case 'priority':
          return getPriorityValue(b.priority) - getPriorityValue(a.priority);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'points':
          return getPointsForCategory(b.category) - getPointsForCategory(a.category);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredAndSortedTodos = getFilteredAndSortedTodos();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 h-[508px] flex flex-col">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due' | 'priority' | 'category' | 'points')}
              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="due">Due Date</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="points">Points</option>
            </select>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'Bold Action' | 'Video' | 'Worksheet' | 'Administrative')}
              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="Bold Action">Bold Actions</option>
              <option value="Video">Videos</option>
              <option value="Worksheet">Worksheets</option>
              <option value="Administrative">Administrative</option>
            </select>
          </div>
        </div>

        {/* Add new todo button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredAndSortedTodos.map((todo: ToDoEntry) => {
          const points = getPointsForCategory(todo.category);
          const urgencyPill = getUrgencyPill(todo.due);

          return (
            <div
              key={todo.id}
              className={`p-4 rounded-xl border ${neutralCardStyling}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityDot(todo.priority)}`}></div>
                  <h3 className="font-semibold text-gray-900 text-sm">{todo.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded border ${urgencyPill.className}`}>
                    {urgencyPill.showText ? urgencyPill.text : ''}
                  </span>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    +{points} pts
                  </span>
                </div>
              </div>

              {/* Due date line with reschedule option */}
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <span>
                  Due: {new Date(todo.due).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-gray-400">•</span>
                <button className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Edit (-5 pts)
                </button>
                {todo.rescheduleCount && todo.rescheduleCount > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-orange-600 font-medium">
                      Rescheduled {todo.rescheduleCount}x
                    </span>
                  </>
                )}
              </div>

              <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                {todo.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {todo.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {todo.inCueBook ? (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      In Cue Book
                    </div>
                  ) : (
                    <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Cue Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

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

// Mock worksheet data
const mockWorksheetData: WorksheetEntry[] = [
  {
    id: 'w1',
    title: 'Leadership Style Assessment',
    submissionCount: 3,
    lastUpdated: '2025-07-04',
    status: 'completed',
    category: 'Self-Assessment'
  },
  {
    id: 'w2',
    title: 'Team Communication Plan',
    submissionCount: 1,
    lastUpdated: '2025-07-02',
    status: 'reviewed',
    category: 'Planning'
  },
  {
    id: 'w3',
    title: 'Conflict Resolution Strategies',
    submissionCount: 2,
    lastUpdated: '2025-07-01',
    status: 'completed',
    category: 'Skills Development'
  },
  {
    id: 'w4',
    title: 'Goal Setting Framework',
    submissionCount: 4,
    lastUpdated: '2025-06-28',
    status: 'completed',
    category: 'Planning'
  },
  {
    id: 'w5',
    title: 'Feedback Delivery Workshop',
    submissionCount: 1,
    lastUpdated: '2025-06-25',
    status: 'in_progress',
    category: 'Skills Development'
  },
  {
    id: 'w6',
    title: 'Personal Development Plan',
    submissionCount: 2,
    lastUpdated: '2025-06-20',
    status: 'reviewed',
    category: 'Self-Assessment'
  }
];

const mockProgressStats = [
  {
    id: '5-minute-checkin',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'NEXT CHECKIN',
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
    id: 'leaderboard-position',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'Leaderboard',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: '#7',
      change: 'of 42 leaders',
      trend: 'up' as const,
      icon: 'Award',
      progress: 65
    }
  },
  {
    id: 'bold-actions',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'Bold Actions YTD',
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
  },
  {
    id: 'next-award',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: {
      title: 'NEXT AWARD',
      variant: 'default'
    },
    data: {
      source: 'dashboard',
      value: '35',
      change: 'points to go',
      trend: 'up' as const,
      icon: 'Award',
      progress: 75
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

// Mock To-Do data with Bold Actions and Cue Book integration
const mockToDoData = {
  id: 'my-todos',
  type: 'List' as const,
  version: '1.0.0',
  config: {
    title: 'To-Do',
    listType: 'todo',
    showRankInfo: false,
    showCueBookInfo: true
  },
  data: {
    source: 'dashboard',
    entries: [
      {
        id: '1',
        title: 'Schedule 1:1 with Sarah',
        description: 'Discuss career development goals and Q1 objectives',
        due: '2025-07-05',
        priority: 'high' as const,
        inCueBook: true,
        category: 'Bold Action',
        rescheduleCount: 0
      },
      {
        id: '2',
        title: 'Review team retrospective findings',
        description: 'Analyze feedback and create action plan for improvements',
        due: '2025-07-08',
        priority: 'medium' as const,
        inCueBook: false,
        category: 'Bold Action',
        rescheduleCount: 1
      },
      {
        id: '3',
        title: 'Prepare Q1 strategy presentation',
        description: 'Create slides for leadership team meeting on strategic initiatives',
        due: '2025-07-15',
        priority: 'high' as const,
        inCueBook: true,
        category: 'Bold Action',
        rescheduleCount: 0
      },
      {
        id: '4',
        title: 'Complete peer feedback forms',
        description: 'Provide constructive feedback for 3 team members',
        due: '2025-07-20',
        priority: 'medium' as const,
        inCueBook: false,
        category: 'Administrative',
        rescheduleCount: 0
      },
      {
        id: '5',
        title: 'Launch team communication experiment',
        description: 'Implement daily async check-ins for remote team members',
        due: '2025-07-22',
        priority: 'high' as const,
        inCueBook: true,
        category: 'Bold Action',
        rescheduleCount: 0
      },
      {
        id: '6',
        title: 'Watch: Advanced Delegation Techniques',
        description: 'Complete video on mastering delegation skills for team leaders',
        due: '2025-07-09',
        priority: 'medium' as const,
        inCueBook: false,
        category: 'Video',
        rescheduleCount: 2
      },
      {
        id: '7',
        title: 'Complete Communication Worksheet',
        description: 'Fill out self-assessment on communication patterns and blind spots',
        due: '2025-07-12',
        priority: 'low' as const,
        inCueBook: true,
        category: 'Worksheet',
        rescheduleCount: 0
      },
      {
        id: '8',
        title: 'Update expense reports',
        description: 'Submit Q4 expense reports for team building activities',
        due: '2025-07-25',
        priority: 'low' as const,
        inCueBook: false,
        category: 'Administrative',
        rescheduleCount: 0
      }
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

function MyWorksheets({ worksheets }: { worksheets: WorksheetEntry[] }) {
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'category' | 'submissions'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'in_progress' | 'reviewed' | 'Self-Assessment' | 'Planning' | 'Skills Development'>('all');

  const getStatusColor = (status: WorksheetEntry['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: WorksheetEntry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'reviewed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getFilteredAndSortedWorksheets = () => {
    let filtered = worksheets;

    // Apply filters
    if (filterBy !== 'all') {
      if (['completed', 'in_progress', 'reviewed'].includes(filterBy)) {
        filtered = filtered.filter(worksheet => worksheet.status === filterBy);
      } else {
        // Filter by category
        filtered = filtered.filter(worksheet => worksheet.category === filterBy);
      }
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'submissions':
          return b.submissionCount - a.submissionCount;
        default:
          return 0;
      }
    });
  };

  const filteredWorksheets = getFilteredAndSortedWorksheets();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 h-[508px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Worksheets</h3>
        <span className="text-sm text-gray-500">{filteredWorksheets.length} of {worksheets.length}</span>
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'category' | 'submissions')}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
          <option value="category">Sort by Category</option>
          <option value="submissions">Sort by Submissions</option>
        </select>

        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as 'all' | 'completed' | 'in_progress' | 'reviewed' | 'Self-Assessment' | 'Planning' | 'Skills Development')}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Worksheets</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="reviewed">Reviewed</option>
          <option value="Self-Assessment">Self-Assessment</option>
          <option value="Planning">Planning</option>
          <option value="Skills Development">Skills Development</option>
        </select>

        <button className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Worksheet
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredWorksheets.map((worksheet) => (
          <div key={worksheet.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm mb-1">{worksheet.title}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{worksheet.submissionCount} submissions</span>
                  <span className="text-gray-400">•</span>
                  <span>Last updated: {new Date(worksheet.lastUpdated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(worksheet.status)}`}>
                  {getStatusIcon(worksheet.status)}
                  {worksheet.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {worksheet.category}
              </span>
              <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors">
                Review/Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock analytics data
  const analyticsData = {
    '7d': {
      totalActivities: 28,
      avgPerDay: 4.0,
      completionRate: 89,
      topCategory: 'Videos'
    },
    '30d': {
      totalActivities: 127,
      avgPerDay: 4.2,
      completionRate: 85,
      topCategory: 'Worksheets'
    },
    '90d': {
      totalActivities: 394,
      avgPerDay: 4.4,
      completionRate: 87,
      topCategory: 'Bold Actions'
    }
  };

  const currentData = analyticsData[timeRange];

  // Mock activity trend data (simplified bar chart)
  const trendData = timeRange === '7d'
    ? [3, 5, 4, 6, 3, 4, 3]
    : timeRange === '30d'
    ? [4, 5, 3, 6, 4, 5, 4, 3, 5, 6, 4, 3, 5, 4, 6, 3, 4, 5, 3, 6, 4, 5, 3, 4, 5, 6, 3, 4, 5, 3]
    : [4, 5, 4, 5, 4, 3, 5, 4, 6, 3, 4, 5]; // 90d shows weekly averages

  const maxValue = Math.max(...trendData);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 h-[508px] flex flex-col">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-blue-600 font-medium">Total Activities</div>
          <div className="text-lg font-bold text-blue-900">{currentData.totalActivities}</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Avg Per Day</div>
          <div className="text-lg font-bold text-green-900">{currentData.avgPerDay}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-purple-600 font-medium">Completion Rate</div>
          <div className="text-lg font-bold text-purple-900">{currentData.completionRate}%</div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
          <div className="text-xs text-orange-600 font-medium">Top Category</div>
          <div className="text-lg font-bold text-orange-900">{currentData.topCategory}</div>
        </div>
      </div>

      {/* Activity Trend Chart */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Activity Trend</h4>
          <span className="text-xs text-gray-500">
            {timeRange === '90d' ? 'Weekly Avg' : 'Daily Count'}
          </span>
        </div>

        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between h-32 gap-1">
          {trendData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t min-h-[4px]"
                style={{ height: `${(value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">
                {timeRange === '7d'
                  ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]
                  : timeRange === '30d'
                  ? (index + 1).toString()
                  : `W${index + 1}`
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap (Last 7 Days) */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity Heatmap</h4>
        <div className="grid grid-cols-7 gap-1">
          {[3, 5, 4, 6, 3, 4, 3].map((intensity, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                  intensity >= 5 ? 'bg-green-500' :
                  intensity >= 4 ? 'bg-green-400' :
                  intensity >= 3 ? 'bg-green-300' :
                  intensity >= 2 ? 'bg-green-200' :
                  'bg-gray-200'
                }`}
              >
                {intensity}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
              </span>
            </div>
          ))}
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

export default function MarcusDashboardMockup() {
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
              <h1 className="text-2xl font-medium text-gray-900 mb-1">Marcus&apos; Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Badge Section - Rosette Style */}
              <div className="flex gap-3">
                {/* Fire Streak Rosette */}
                <div className="relative group">
                  <div className="relative">
                    <svg width="36" height="48" viewBox="0 0 36 48" className="drop-shadow-lg">
                      {/* Classic rosette pleated edge */}
                      <g transform="translate(18,20)">
                        {/* 8 pleated petals - simple and clean */}
                        <polygon points="0,-16 4,-12 0,-8 -4,-12" fill="#f97316"/>
                        <polygon points="11.3,-11.3 15.3,-7.3 11.3,-3.3 7.3,-7.3" fill="#ea580c"/>
                        <polygon points="16,0 20,4 16,8 12,4" fill="#f97316"/>
                        <polygon points="11.3,11.3 15.3,15.3 11.3,19.3 7.3,15.3" fill="#ea580c"/>
                        <polygon points="0,16 4,20 0,24 -4,20" fill="#f97316"/>
                        <polygon points="-11.3,11.3 -7.3,15.3 -11.3,19.3 -15.3,15.3" fill="#ea580c"/>
                        <polygon points="-16,0 -12,4 -16,8 -20,4" fill="#f97316"/>
                        <polygon points="-11.3,-11.3 -7.3,-7.3 -11.3,-3.3 -15.3,-7.3" fill="#ea580c"/>
                      </g>

                      {/* Center circle - larger and cleaner */}
                      <circle cx="18" cy="20" r="10" fill="white"/>
                      <circle cx="18" cy="20" r="9" fill="#fef3c7"/>

                      {/* Center number */}
                      <text x="18" y="26" textAnchor="middle" className="text-xl font-bold fill-orange-600">7</text>

                      {/* Simple ribbon streamers */}
                      <g transform="translate(18,30)">
                        <rect x="-3" y="0" width="2" height="14" fill="#f97316"/>
                        <rect x="1" y="0" width="2" height="14" fill="#f97316"/>
                        <polygon points="-3,14 -1,14 -2,18" fill="#f97316"/>
                        <polygon points="1,14 3,14 2,18" fill="#f97316"/>
                      </g>
                    </svg>
                  </div>
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    7-Day Streak
                  </div>
                </div>

                {/* Goal Crusher Rosette */}
                <div className="relative group">
                  <div className="relative">
                    <svg width="36" height="48" viewBox="0 0 36 48" className="drop-shadow-lg">
                      {/* Classic rosette pleated edge */}
                      <g transform="translate(18,20)">
                        {/* 8 pleated petals - simple and clean */}
                        <polygon points="0,-16 4,-12 0,-8 -4,-12" fill="#22c55e"/>
                        <polygon points="11.3,-11.3 15.3,-7.3 11.3,-3.3 7.3,-7.3" fill="#16a34a"/>
                        <polygon points="16,0 20,4 16,8 12,4" fill="#22c55e"/>
                        <polygon points="11.3,11.3 15.3,15.3 11.3,19.3 7.3,15.3" fill="#16a34a"/>
                        <polygon points="0,16 4,20 0,24 -4,20" fill="#22c55e"/>
                        <polygon points="-11.3,11.3 -7.3,15.3 -11.3,19.3 -15.3,15.3" fill="#16a34a"/>
                        <polygon points="-16,0 -12,4 -16,8 -20,4" fill="#22c55e"/>
                        <polygon points="-11.3,-11.3 -7.3,-7.3 -11.3,-3.3 -15.3,-7.3" fill="#16a34a"/>
                      </g>

                      {/* Center circle - larger and cleaner */}
                      <circle cx="18" cy="20" r="10" fill="white"/>
                      <circle cx="18" cy="20" r="9" fill="#dcfce7"/>

                      {/* Target/bullseye icon */}
                      <circle cx="18" cy="20" r="6" fill="none" stroke="#16a34a" strokeWidth="1"/>
                      <circle cx="18" cy="20" r="4" fill="none" stroke="#16a34a" strokeWidth="1"/>
                      <circle cx="18" cy="20" r="2" fill="#16a34a"/>

                      {/* Simple ribbon streamers */}
                      <g transform="translate(18,30)">
                        <rect x="-3" y="0" width="2" height="14" fill="#22c55e"/>
                        <rect x="1" y="0" width="2" height="14" fill="#22c55e"/>
                        <polygon points="-3,14 -1,14 -2,18" fill="#22c55e"/>
                        <polygon points="1,14 3,14 2,18" fill="#22c55e"/>
                      </g>
                    </svg>
                  </div>
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Goal Crusher
                  </div>
                </div>

                                {/* Excellence Rosette */}
                <div className="relative group">
                  <div className="relative">
                    <svg width="36" height="48" viewBox="0 0 36 48" className="drop-shadow-lg">
                      {/* Classic rosette pleated edge */}
                      <g transform="translate(18,20)">
                        {/* 8 pleated petals - simple and clean */}
                        <polygon points="0,-16 4,-12 0,-8 -4,-12" fill="#3b82f6"/>
                        <polygon points="11.3,-11.3 15.3,-7.3 11.3,-3.3 7.3,-7.3" fill="#2563eb"/>
                        <polygon points="16,0 20,4 16,8 12,4" fill="#3b82f6"/>
                        <polygon points="11.3,11.3 15.3,15.3 11.3,19.3 7.3,15.3" fill="#2563eb"/>
                        <polygon points="0,16 4,20 0,24 -4,20" fill="#3b82f6"/>
                        <polygon points="-11.3,11.3 -7.3,15.3 -11.3,19.3 -15.3,15.3" fill="#2563eb"/>
                        <polygon points="-16,0 -12,4 -16,8 -20,4" fill="#3b82f6"/>
                        <polygon points="-11.3,-11.3 -7.3,-7.3 -11.3,-3.3 -15.3,-7.3" fill="#2563eb"/>
                      </g>

                      {/* Center circle - larger and cleaner */}
                      <circle cx="18" cy="20" r="10" fill="white"/>
                      <circle cx="18" cy="20" r="9" fill="#dbeafe"/>

                      {/* Star icon */}
                      <g transform="translate(18,20) scale(1.2)">
                        <polygon points="0,-5 1.5,-1.5 5,-1.5 2,1.5 3.5,5 0,3 -3.5,5 -2,1.5 -5,-1.5 -1.5,-1.5" fill="#3b82f6"/>
                      </g>

                      {/* Simple ribbon streamers */}
                      <g transform="translate(18,30)">
                        <rect x="-3" y="0" width="2" height="14" fill="#3b82f6"/>
                        <rect x="1" y="0" width="2" height="14" fill="#3b82f6"/>
                        <polygon points="-3,14 -1,14 -2,18" fill="#3b82f6"/>
                        <polygon points="1,14 3,14 2,18" fill="#3b82f6"/>
                      </g>
                    </svg>
                  </div>
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Excellence Award
                  </div>
                </div>
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

        {/* Two Column Layout: To-Do (wider), Next Up */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">

          {/* To-Do Section - Expanded */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">To-Do</h2>
            <div className="w-full">
              <ToDoList schema={mockToDoData} />
            </div>
          </section>

          {/* Next Up Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Next Up</h2>
            <div className="w-full h-[508px]">
              <LeaderForgeCard
                schema={mockVideoData}
                userId="marcus-johnson"
                onAction={handleCardAction}
              />
            </div>
          </section>

        </div>

        {/* Two Column Layout Row 3: My Worksheets, Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">

          {/* My Worksheets Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Worksheets</h2>
            <div className="w-full">
              <MyWorksheets worksheets={mockWorksheetData} />
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

        {/* Two Column Layout Row 4: My Activity, Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">

          {/* My Activity Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Activity</h2>
            <div className="w-full h-[508px]">
              <List schema={mockActivityData} />
            </div>
          </section>

          {/* Analytics Dashboard Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics Dashboard</h2>
            <div className="w-full h-[508px]">
              <AnalyticsDashboard />
            </div>
          </section>

        </div>
      </div>

      {/* Schema-Driven Video Worksheet Form */}
      <FormWidget
        templateId="663570eb-babd-41cd-9bfa-18972275863b"
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        videoContext={{
          id: '5.1 Deep Work Part 1',  // Use content title as ID for Phase 1 correlation
          title: '5.1 Deep Work Part 1'  // This will show as "Worksheet for 5.1 Deep Work Part 1"
        }}
        onSubmit={async (submissionData) => {
          console.log('[MarcusDashboard] Schema-driven worksheet submitted:', submissionData);
          // The leaderboard and progress will automatically update via the Universal Input System
          setIsWorksheetOpen(false);
        }}
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