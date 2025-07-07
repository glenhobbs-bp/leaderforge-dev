/**
 * Purpose: My Team Dashboard Mockup - Agent-native mockup component showing team growth dashboard
 * Owner: Mockup System
 * Tags: [mockup, team, dashboard, growth, coaching, agent-native]
 */

"use client";

import React, { useState } from 'react';
import { TalkingPointsModal } from '../ui/TalkingPointsModal';

export default function MyTeamMockup() {
  const [selectedMemberForTalking, setSelectedMemberForTalking] = useState<string | null>(null);

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
      badges: ['🥇', '👥', '🏆'],
      coachingData: {
        challengeLevel: 'Optimal Zone (7.5/10)',
        challengeZone: 'Optimal Zone',
        boldActionScore: '8.4 (↑15% vs last month)',
        completionRate: '95% (excellent)',
        videoEngagement: '12 videos completed this month',
        recentTrend: 'Growing momentum',
        lastMeetingNotes: 'Discussed automation project. Alex excited about impact on team efficiency. Suggested connecting with Lisa on content optimization. Follow up on progress this week.',
        currentBoldActions: [
          { title: 'Implement automated reporting system', dueDate: 'Due in 5 days' },
          { title: 'Create team onboarding playbook', dueDate: 'Due in 12 days' }
        ]
      }
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
      badges: ['👥', '🏆'],
      coachingData: {
        challengeLevel: 'Good Zone (6.2/10)',
        challengeZone: 'Good Zone',
        boldActionScore: '6.2 (steady)',
        completionRate: '85% (good)',
        videoEngagement: '8 videos completed this month',
        recentTrend: 'Steady progress',
        lastMeetingNotes: 'Working on time management. Needs support with delegation skills.',
        currentBoldActions: [
          { title: 'Improve delegation framework', dueDate: 'Due in 8 days' },
          { title: 'Complete leadership assessment', dueDate: 'Due in 15 days' }
        ]
      }
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
      badges: ['😊'],
      coachingData: {
        challengeLevel: 'Over-stretched (3.1/10)',
        challengeZone: 'Over-stretched',
        boldActionScore: '3.1 (needs adjustment)',
        completionRate: '45% (concerning)',
        videoEngagement: '3 videos completed this month',
        recentTrend: 'Over-committed',
        lastMeetingNotes: 'Taking on too much. Need to reduce Bold Actions and focus on core priorities.',
        currentBoldActions: [
          { title: 'Streamline current projects', dueDate: 'Due in 3 days' },
          { title: 'Focus on top priority only', dueDate: 'Due in 7 days' }
        ]
      }
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
      badges: ['😊', '🔥', '⚡'],
      coachingData: {
        challengeLevel: 'Under-challenged (9.8/10)',
        challengeZone: 'Under-challenged',
        boldActionScore: '9.8 (needs more challenge)',
        completionRate: '98% (excellent)',
        videoEngagement: '15 videos completed this month',
        recentTrend: 'Needs support',
        lastMeetingNotes: 'Performing excellently but looking for bigger challenges. Ready for stretch assignments.',
        currentBoldActions: [
          { title: 'Lead cross-team innovation project', dueDate: 'Due in 10 days' },
          { title: 'Mentor junior team member', dueDate: 'Due in 14 days' }
        ]
      }
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
              <div className="text-center w-40">
                <div className={`w-full px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  member.zoneColor === 'green' ? 'bg-green-100 text-green-800' :
                  member.zoneColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                  member.zoneColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                  member.zoneColor === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.zone}
                </div>
                <div className="text-xl font-bold text-blue-600 mt-2">{member.score}</div>
                <div className={`text-xs mt-1 ${
                  member.actions.includes('Too many') ? 'text-red-600' : 'text-glass-muted'
                }`}>{member.actions}</div>
              </div>

                                                                      {/* Right side - All elements arranged horizontally */}
              <div className="flex items-center space-x-8">
                {/* Rank and Points */}
                <div className="text-center w-20">
                  <div className="text-lg font-bold text-purple-600">
                    {member.rank}
                    <span className="text-sm text-green-500 ml-1">{member.rankChange}</span>
                  </div>
                  <div className="text-sm text-glass-secondary">{member.points}</div>
                </div>

                {/* Badges */}
                <div className="flex space-x-1 w-20 justify-center">
                  {member.badges.map((badge, index) => (
                    <span key={index} className="text-lg">{badge}</span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col space-y-1 ml-4">
                  <button
                    onClick={() => setSelectedMemberForTalking(member.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
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

      {/* Talking Points Modal */}
      {selectedMemberForTalking && (
        <TalkingPointsModal
          isOpen={!!selectedMemberForTalking}
          onClose={() => setSelectedMemberForTalking(null)}
          memberName={teamMembers.find(m => m.id === selectedMemberForTalking)?.name || ''}
          memberData={teamMembers.find(m => m.id === selectedMemberForTalking)?.coachingData || {
            challengeLevel: '',
            challengeZone: '',
            boldActionScore: '',
            completionRate: '',
            videoEngagement: '',
            recentTrend: '',
            lastMeetingNotes: '',
            currentBoldActions: []
          }}
        />
      )}
    </div>
  );
}