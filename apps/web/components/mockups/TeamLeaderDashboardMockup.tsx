/**
 * Purpose: Team Leader Dashboard Mockup - Agent-native mockup component for stakeholder review
 * Owner: Mockup System
 * Tags: [mockup, team-leader, dashboard, stakeholder-review]
 */

"use client";

import React from 'react';
import StatCard from '../widgets/StatCard';

// Mock team member data
const mockTeamMembers = [
  { id: '1', name: 'Sarah Chen', role: 'Senior Developer', progress: 85, videosCompleted: 8, worksheetsCompleted: 7, lastActive: '2 hours ago', trend: 'up' as const },
  { id: '2', name: 'Marcus Johnson', role: 'Product Manager', progress: 65, videosCompleted: 4, worksheetsCompleted: 3, lastActive: '1 day ago', trend: 'same' as const },
  { id: '3', name: 'Lisa Wang', role: 'Designer', progress: 75, videosCompleted: 6, worksheetsCompleted: 5, lastActive: '3 hours ago', trend: 'up' as const },
  { id: '4', name: 'David Kim', role: 'Developer', progress: 90, videosCompleted: 9, worksheetsCompleted: 8, lastActive: '1 hour ago', trend: 'up' as const },
  { id: '5', name: 'Emma Davis', role: 'QA Engineer', progress: 55, videosCompleted: 3, worksheetsCompleted: 2, lastActive: '2 days ago', trend: 'down' as const },
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Members</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {mockTeamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}