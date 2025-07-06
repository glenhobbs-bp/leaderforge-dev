/**
 * Purpose: Executive Dashboard Mockup - Agent-native mockup component for stakeholder review
 * Owner: Mockup System
 * Tags: [mockup, executive, dashboard, stakeholder-review]
 */

"use client";

import React from 'react';
import StatCard from '../widgets/StatCard';

// Mock organizational stats
const mockOrgStats = [
  {
    id: 'total-users',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Active Leaders', variant: 'default' },
    data: { source: 'dashboard', value: '247', change: '+23 this month', trend: 'up' as const, icon: 'Users' }
  },
  {
    id: 'completion-rate',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Org Completion', variant: 'success' },
    data: { source: 'dashboard', value: '78%', change: '+12% this quarter', trend: 'up' as const, icon: 'CheckCircle' }
  },
  {
    id: 'engagement',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Engagement Score', variant: 'default' },
    data: { source: 'dashboard', value: '4.3/5', change: '+0.4 this month', trend: 'up' as const, icon: 'Heart' }
  },
  {
    id: 'roi',
    type: 'StatCard' as const,
    version: '1.0.0',
    config: { title: 'Training ROI', variant: 'success' },
    data: { source: 'dashboard', value: '285%', change: 'Performance impact', trend: 'up' as const, icon: 'TrendingUp' }
  }
];

// Mock department data
const mockDepartments = [
  { name: 'Engineering', leaders: 45, completion: 85, engagement: 4.5, color: 'bg-blue-500' },
  { name: 'Product', leaders: 28, completion: 92, engagement: 4.7, color: 'bg-green-500' },
  { name: 'Sales', leaders: 67, completion: 71, engagement: 4.1, color: 'bg-purple-500' },
  { name: 'Marketing', leaders: 34, completion: 88, engagement: 4.4, color: 'bg-orange-500' },
  { name: 'Operations', leaders: 52, completion: 76, engagement: 4.2, color: 'bg-teal-500' },
  { name: 'HR', leaders: 21, completion: 94, engagement: 4.8, color: 'bg-pink-500' }
];

// Mock leadership initiatives
const mockInitiatives = [
  { title: 'Q1 Leadership Intensive', participants: 89, completion: 94, impact: 'High' },
  { title: 'Manager Development Program', participants: 156, completion: 78, impact: 'Medium' },
  { title: 'Executive Coaching Track', participants: 24, completion: 100, impact: 'High' },
  { title: 'Cross-Functional Leadership', participants: 67, completion: 82, impact: 'Medium' }
];

export default function ExecutiveDashboardMockup() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 mb-1">Executive Dashboard</h1>
              <p className="text-sm text-gray-500">Organizational leadership development overview</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Generate Report
              </button>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300">
                Export Data
              </button>
            </div>
          </div>
        </header>

        {/* Organizational KPIs */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Organizational KPIs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockOrgStats.map((stat) => (
              <StatCard key={stat.id} schema={stat} />
            ))}
          </div>
        </section>

        {/* Department Performance */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Performance</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockDepartments.map(dept => (
                <div key={dept.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leaders:</span>
                      <span className="font-medium">{dept.leaders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion:</span>
                      <span className="font-medium">{dept.completion}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement:</span>
                      <span className="font-medium">{dept.engagement}/5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Initiatives */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Leadership Initiatives</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {mockInitiatives.map((initiative, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{initiative.title}</h3>
                    <p className="text-sm text-gray-500">{initiative.participants} participants</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{initiative.completion}%</div>
                      <div className="text-xs text-gray-500">Completion</div>
                    </div>
                    <div className="text-center">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        initiative.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {initiative.impact} Impact
                      </div>
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