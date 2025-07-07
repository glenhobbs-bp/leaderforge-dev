/**
 * Purpose: My Team Dashboard Mockup - Agent-native mockup component showing team growth dashboard
 * Owner: Mockup System
 * Tags: [mockup, team, dashboard, growth, coaching, agent-native]
 */

"use client";

import React from 'react';

export default function MyTeamMockup() {
  // Mock team data based on images
  const teamMembers = [
    {
      id: 'alex',
      name: 'Alex Smith',
      initials: 'AS',
      nextCheckin: 'Today 2:00 PM',
      status: 'Growing momentum',
      statusIcon: '↗',
      zone: 'OPTIMAL ZONE',
      zoneColor: 'green',
      score: '8.4',
      actions: '2 actions • High impact',
      rank: '#3',
      rankChange: '+2',
      points: '145 pts',
      badges: ['🥇', '👥', '🏆']
    },
    {
      id: 'sarah',
      name: 'Sarah Johnson',
      initials: 'SJ',
      nextCheckin: 'Tomorrow 10:00 AM',
      status: 'Steady progress',
      statusIcon: '→',
      zone: 'GOOD ZONE',
      zoneColor: 'green',
      score: '6.2',
      actions: '3 actions • Med impact',
      rank: '#5',
      rankChange: '—',
      points: '89 pts',
      badges: ['👥', '🏆']
    },
    {
      id: 'marcus',
      name: 'Marcus Rivera',
      initials: 'MR',
      nextCheckin: 'Wednesday 3:00 PM',
      status: 'Over-committed',
      statusIcon: '⚠',
      zone: 'OVER-STRETCHED',
      zoneColor: 'orange',
      score: '3.1',
      actions: '4 actions • Too many!',
      rank: '#8',
      rankChange: '+3',
      points: '34 pts',
      badges: ['😊']
    },
    {
      id: 'lisa',
      name: 'Lisa Thompson',
      initials: 'LT',
      nextCheckin: 'Friday 1:00 PM',
      status: 'Needs support',
      statusIcon: '⚠',
      zone: 'UNDER-CHALLENGED',
      zoneColor: 'red',
      score: '9.8',
      actions: '2 actions • High impact',
      rank: '#1',
      rankChange: '+1',
      points: '203 pts',
      badges: ['😊', '🔥', '⚡']
    }
  ];

    return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Team Growth Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Track team member growth, challenge levels, and coaching opportunities
        </p>

        {/* Top Stats Row - Glassmorphism Card */}
        <div className="card-glass-subtle p-4 mt-6">
          <div className="flex items-center space-x-8 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-green-600">7.8</span>
              <span className="text-glass-muted">AVG GROWTH SCORE</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">12</span>
              <span className="text-glass-muted">ACTIVE BOLD ACTIONS</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-green-600">92%</span>
              <span className="text-glass-muted">ENGAGEMENT RATE</span>
            </div>
          </div>
        </div>
      </div>

            {/* Team Members Grid */}
      <div className="space-y-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="card-glass-subtle hover:card-glass-interactive p-4">
            <div className="flex items-center justify-between">
              {/* Left side - Member info */}
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {member.initials}
                </div>

                {/* Member details */}
                <div>
                  <h3 className="text-sm font-medium text-glass-primary">{member.name}</h3>
                  <p className="text-xs text-glass-muted">Next check-in: {member.nextCheckin}</p>
                  <p className={`text-xs flex items-center ${
                    member.status === 'Growing momentum' ? 'text-green-600' :
                    member.status === 'Needs support' || member.status === 'Over-committed' ? 'text-red-600' :
                    'text-glass-secondary'
                  }`}>
                    <span className="mr-1">{member.statusIcon}</span>
                    {member.status}
                  </p>
                </div>
              </div>

              {/* Center - Zone and Score */}
              <div className="text-center">
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  member.zoneColor === 'green' ? 'bg-green-100 text-green-800' :
                  member.zoneColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {member.zone}
                </div>
                <div className="text-xl font-bold text-blue-600 mt-1">{member.score}</div>
                <div className={`text-xs ${
                  member.actions.includes('Too many') ? 'text-red-600' : 'text-glass-muted'
                }`}>{member.actions}</div>
              </div>

                                          {/* Right side - Rank, Points, Actions */}
              <div className="text-right flex flex-col justify-between h-full min-h-[120px]">
                {/* Top section - Rank and Points */}
                <div className="space-y-3">
                  <div className="text-lg font-bold text-purple-600">
                    {member.rank}
                    <span className="text-sm text-green-500 ml-1">{member.rankChange}</span>
                  </div>
                  <div className="text-sm text-glass-secondary">{member.points}</div>
                  <div className="flex space-x-1 justify-end">
                    {member.badges.map((badge, index) => (
                      <span key={index} className="text-lg">{badge}</span>
                    ))}
                  </div>
                </div>

                {/* Bottom section - Action buttons */}
                <div className="flex flex-col space-y-1 mt-6">
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                    Talking Points
                  </button>
                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}