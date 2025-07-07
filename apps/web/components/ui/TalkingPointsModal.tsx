/**
 * Purpose: Talking Points Modal - Coaching session interface with growth context, talking points, and meeting notes
 * Owner: UI Components
 * Tags: [modal, coaching, talking-points, team-management, glassmorphism]
 */

"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from './dialog';
import { X, Video, Target, TrendingUp, FileText, Calendar } from 'lucide-react';

interface TalkingPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberData: {
    challengeLevel: string;
    challengeZone: string;
    boldActionScore: string;
    completionRate: string;
    videoEngagement: string;
    recentTrend: string;
    lastMeetingNotes: string;
    currentBoldActions: Array<{
      title: string;
      dueDate: string;
    }>;
  };
}

export function TalkingPointsModal({ isOpen, onClose, memberName, memberData }: TalkingPointsModalProps) {
  const [meetingNotes, setMeetingNotes] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl w-full mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div className="card-glass-premium p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-glass-primary">
              Coaching Session - {memberName}
            </h2>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                <Video className="w-4 h-4" />
                <span>Start Zoom Call</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Growth Context */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-medium text-glass-primary">Growth Context</h3>
              </div>

              {/* Challenge Level */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Challenge Level:</div>
                <div className="text-green-600 font-medium">{memberData.challengeLevel}</div>
              </div>

              {/* Bold Action Score */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Bold Action Score:</div>
                <div className="text-glass-secondary">{memberData.boldActionScore}</div>
              </div>

              {/* Completion Rate */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Completion Rate:</div>
                <div className="text-green-600 font-medium">{memberData.completionRate}</div>
              </div>

              {/* Video Engagement */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Video Engagement:</div>
                <div className="text-glass-secondary">{memberData.videoEngagement}</div>
              </div>

              {/* Recent Trend */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Recent Trend:</div>
                <div className="text-green-600 flex items-center">
                  <span className="mr-1">↗</span>
                  {memberData.recentTrend}
                </div>
              </div>

              {/* Last Meeting Notes */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-glass-primary">Last Meeting Notes</span>
                </div>
                <div className="text-xs text-glass-secondary bg-gray-50 p-3 rounded border-l-4 border-orange-500">
                  "{memberData.lastMeetingNotes}"
                </div>
              </div>

              {/* Current Bold Actions */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-glass-primary">Current Bold Actions</span>
                </div>
                <div className="space-y-2">
                  {memberData.currentBoldActions.map((action, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-glass-primary">{index + 1}. {action.title}</div>
                      <div className="text-blue-600">({action.dueDate})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column - Talking Points */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">💡</span>
                <h3 className="text-base font-medium text-glass-primary">Talking Points</h3>
              </div>

              {/* Celebrate Wins */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="font-medium text-blue-800 mb-2">Celebrate Wins:</div>
                <div className="text-sm text-blue-700">
                  "I noticed you earned the Innovation badge! How did that Bold Action on automation feel?"
                </div>
              </div>

              {/* Content Deep-dive */}
              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                <div className="font-medium text-purple-800 mb-2">Content Deep-dive:</div>
                <div className="text-sm text-purple-700">
                  "What was the biggest insight from Module 5.1 on Deep Work?"
                </div>
              </div>

              {/* Challenge Check */}
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="font-medium text-green-800 mb-2">Challenge Check:</div>
                <div className="text-sm text-green-700">
                  "Your Bold Actions seem to be hitting the sweet spot. Are you feeling appropriately challenged?"
                </div>
              </div>

              {/* Support Offer */}
              <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <div className="font-medium text-orange-800 mb-2">Support Offer:</div>
                <div className="text-sm text-orange-700">
                  "What's one area where I can help remove obstacles for you this week?"
                </div>
              </div>

              {/* Future Growth */}
              <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                <div className="font-medium text-indigo-800 mb-2">Future Growth:</div>
                <div className="text-sm text-indigo-700">
                  "Based on your progress, what Bold Action feels most exciting for next week?"
                </div>
              </div>
            </div>

            {/* Right Column - Meeting Notes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">📝</span>
                <h3 className="text-base font-medium text-glass-primary">Meeting Notes</h3>
              </div>

              <div className="text-sm text-glass-secondary mb-4">
                Session Date: July 7, 2025 • 2:00 PM
              </div>

              <div>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Capture notes from your coaching session...

Key discussion points:
- Progress on current Bold Actions
- Challenges or obstacles
- Wins to celebrate
- Support needed
- Next Bold Action ideas"
                  className="w-full h-64 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                  Save Notes
                </button>
                <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors">
                  Save & Schedule Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}