/**
 * Purpose: Team Leader Dashboard Mockup - Agent-native mockup component for stakeholder review
 * Owner: Mockup System
 * Tags: [mockup, team-leader, dashboard, stakeholder-review]
 */

"use client";

import React, { useState } from 'react';
import StatCard from '../widgets/StatCard';

// Mock team member data
const mockTeamMembers = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Senior Developer',
    progress: 85,
    videosCompleted: 8,
    worksheetsCompleted: 7,
    lastActive: '2 hours ago',
    trend: 'up' as const,
    performance: 'excellent',
    goals: ['Complete Advanced React Module', 'Mentor Junior Dev'],
    nextReview: '2024-01-15',
    avatar: 'SC'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Product Manager',
    progress: 65,
    videosCompleted: 4,
    worksheetsCompleted: 3,
    lastActive: '1 day ago',
    trend: 'same' as const,
    performance: 'good',
    goals: ['Leadership Skills', 'Product Strategy'],
    nextReview: '2024-01-18',
    avatar: 'MJ'
  },
  {
    id: '3',
    name: 'Lisa Wang',
    role: 'Designer',
    progress: 75,
    videosCompleted: 6,
    worksheetsCompleted: 5,
    lastActive: '3 hours ago',
    trend: 'up' as const,
    performance: 'excellent',
    goals: ['UX Research Methods', 'Design Systems'],
    nextReview: '2024-01-20',
    avatar: 'LW'
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Developer',
    progress: 90,
    videosCompleted: 9,
    worksheetsCompleted: 8,
    lastActive: '1 hour ago',
    trend: 'up' as const,
    performance: 'excellent',
    goals: ['System Architecture', 'Code Quality'],
    nextReview: '2024-01-12',
    avatar: 'DK'
  },
  {
    id: '5',
    name: 'Emma Davis',
    role: 'QA Engineer',
    progress: 55,
    videosCompleted: 3,
    worksheetsCompleted: 2,
    lastActive: '2 days ago',
    trend: 'down' as const,
    performance: 'needs-support',
    goals: ['Test Automation', 'Quality Processes'],
    nextReview: '2024-01-10',
    avatar: 'ED'
  },
];

// Mock team stats
const mockTeamStats = [
  {
    id: 'team-size',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Team Size', variant: 'default' },
    data: { source: 'dashboard', value: '5', change: 'Active members', trend: 'neutral' as const, icon: 'Users' }
  },
  {
    id: 'avg-progress',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Avg Progress', variant: 'default' },
    data: { source: 'dashboard', value: '74%', change: '+12% this month', trend: 'up' as const, icon: 'TrendingUp' }
  },
  {
    id: 'completion-rate',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Completion Rate', variant: 'success' },
    data: { source: 'dashboard', value: '82%', change: '+5% this week', trend: 'up' as const, icon: 'CheckCircle' }
  },
  {
    id: 'engagement',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Engagement', variant: 'default' },
    data: { source: 'dashboard', value: '4.2/5', change: 'Team satisfaction', trend: 'up' as const, icon: 'Heart' }
  }
];

export default function TeamLeaderDashboardMockup() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [teamView, setTeamView] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastActive'>('progress');
  const [filterPerformance, setFilterPerformance] = useState<'all' | 'excellent' | 'good' | 'needs-support'>('all');

  const handleMemberClick = (memberId: string) => {
    setSelectedMember(selectedMember === memberId ? null : memberId);
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs-support': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredAndSortedMembers = () => {
    let filtered = mockTeamMembers;

    if (filterPerformance !== 'all') {
      filtered = filtered.filter(member => member.performance === filterPerformance);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'progress': return b.progress - a.progress;
        case 'lastActive': return a.lastActive.localeCompare(b.lastActive);
        default: return 0;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 mb-1">Team Dashboard</h1>
              <p className="text-sm text-gray-500">Leading your team to success</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Team Check-in
              </button>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300">
                View Reports
              </button>
            </div>
          </div>
        </header>

        {/* Team Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTeamStats.map((stat) => (
              <StatCard key={stat.id} schema={stat} />
            ))}
          </div>
        </section>

        {/* Team Members Progress */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <div className="flex items-center gap-4">
              {/* Filter Controls */}
              <select
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value as typeof filterPerformance)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Performance</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="needs-support">Needs Support</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="progress">Sort by Progress</option>
                <option value="name">Sort by Name</option>
                <option value="lastActive">Sort by Activity</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setTeamView('list')}
                  className={`px-3 py-2 text-sm ${teamView === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setTeamView('grid')}
                  className={`px-3 py-2 text-sm ${teamView === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {getFilteredAndSortedMembers().map(member => (
                <div key={member.id}>
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleMemberClick(member.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPerformanceColor(member.performance)}`}>
                            {member.performance.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.videosCompleted}</div>
                        <div className="text-xs text-gray-500">Videos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{member.worksheetsCompleted}</div>
                        <div className="text-xs text-gray-500">Worksheets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">{member.lastActive}</div>
                        <div className="text-xs text-gray-500">Last Active</div>
                      </div>
                      <div className="text-gray-400">
                        {selectedMember === member.id ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedMember === member.id && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Current Goals</h4>
                          <ul className="space-y-1">
                            {member.goals.map((goal, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Next Review</h4>
                          <p className="text-sm text-gray-600">{member.nextReview}</p>
                          <div className="mt-3 flex gap-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                              Schedule 1:1
                            </button>
                            <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}