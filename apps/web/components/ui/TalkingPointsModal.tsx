/**
 * Purpose: Talking Points Modal - Coaching session interface with growth context, talking points, and meeting notes
 * Owner: UI Components
 * Tags: [modal, coaching, talking-points, team-management, glassmorphism]
 */

"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Video, Target, TrendingUp, Lightbulb, PenTool, Mic, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isRecordingExpanded, setIsRecordingExpanded] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl w-full mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div className="card-glass-premium p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-glass-primary">
              Check-in - {memberName}
            </h2>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
              <Video className="w-4 h-4" />
              <span>Start Call</span>
            </button>
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
                <div className="text-xs text-green-600 font-medium">{memberData.challengeLevel}</div>
              </div>

              {/* Bold Action Score */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Bold Action Score:</div>
                <div className="text-xs text-glass-secondary">{memberData.boldActionScore}</div>
              </div>

              {/* Completion Rate */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Completion Rate:</div>
                <div className="text-xs text-green-600 font-medium">{memberData.completionRate}</div>
              </div>

              {/* Video Engagement */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Video Engagement:</div>
                <div className="text-xs text-glass-secondary">{memberData.videoEngagement}</div>
              </div>

              {/* Recent Trend */}
              <div>
                <div className="text-sm font-medium text-glass-primary mb-1">Recent Trend:</div>
                <div className="text-xs text-green-600 flex items-center">
                  <span className="mr-1">↗</span>
                  {memberData.recentTrend}
                </div>
              </div>

              {/* Last Meeting Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-glass-primary">Last Meeting - July 1, 2025</span>
                  </div>
                  <button
                    onClick={() => setIsRecordingExpanded(!isRecordingExpanded)}
                    className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors text-xs text-glass-secondary"
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>Recording</span>
                    {isRecordingExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <div className="text-xs text-glass-secondary bg-gray-50 p-3 rounded border-l-4 border-orange-500">
                  "{memberData.lastMeetingNotes}"
                </div>

                {/* Expandable Recording Section */}
                {isRecordingExpanded && (
                  <div className="card-glass-subtle p-4 mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-glass-primary">Session Recording & Transcript</h4>
                      <span className="text-xs text-glass-muted">5 min • Auto-transcribed</span>
                    </div>

                    {/* Audio Player */}
                    <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      <div className="flex items-center space-x-3 mb-2">
                        <PlayCircle className="w-5 h-5 text-blue-600" />
                        <div className="text-xs text-glass-primary">
                          <div className="font-medium">Check-in Session - July 1, 2025</div>
                                                     <div className="text-glass-muted">2:00 PM - 2:05 PM</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '30%'}}></div>
                      </div>
                                             <div className="flex justify-between text-xs text-glass-muted">
                         <span>1:30</span>
                         <span>5:00</span>
                       </div>
                    </div>

                    {/* Transcript */}
                    <div>
                      <div className="text-xs font-medium text-glass-primary mb-2">AI-Generated Transcript:</div>
                      <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-xs text-glass-secondary leading-relaxed">
                        <p className="mb-2">
                          <strong>[Leader]:</strong> "Hi Alex, great to see you! How are you feeling about the team aliveness exercise we did last week?"
                        </p>
                        <p className="mb-2">
                          <strong>[Alex]:</strong> "It was really eye-opening. The team rated themselves at about a 6 average, which was lower than I expected. Sarah mentioned she feels overwhelmed with the current workload."
                        </p>
                        <p className="mb-2">
                          <strong>[Leader]:</strong> "That's valuable feedback. What suggestion did you decide to implement from the 'What can I change in our culture' question?"
                        </p>
                        <p className="mb-2">
                          <strong>[Alex]:</strong> "We decided to implement 'Focus Fridays' - no meetings after 2 PM on Fridays to give everyone deep work time. I've been consistent about communicating this as already part of our culture."
                        </p>
                        <p>
                          <strong>[Leader]:</strong> "That's excellent! How is the team responding to Focus Fridays so far?"
                        </p>
                      </div>
                    </div>

                    {/* Action Items from Recording */}
                    <div>
                      <div className="text-xs font-medium text-glass-primary mb-2">Key Action Items:</div>
                      <div className="space-y-1 text-xs text-glass-secondary">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Continue implementing Focus Fridays consistently</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Check in with Sarah about workload management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          <span>Plan next team aliveness check for end of month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-medium text-glass-primary">Talking Points</h3>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {/* Last Training Session Follow-up */}
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Becoming a Team of Leaders Follow-up:</div>
                  <div className="text-xs text-glass-secondary mb-3">
                    <strong>Team Training - Module 1 Session 1</strong>
                  </div>
                  <div className="space-y-2 text-xs text-glass-secondary">
                    <div>
                      <strong>Step 1: Team Aliveness Check</strong><br/>
                      "How did your team rate themselves on the 1-9 aliveness scale? Any surprises?"
                    </div>
                    <div>
                      <strong>Step 2: The First Question</strong><br/>
                      "What feedback did you get when you asked: 'What one thing can I change in our culture to help you be fully alive at work?' Which suggestion did you pick for immediate implementation?"
                    </div>
                    <div>
                      <strong>Step 3: Implementation Progress</strong><br/>
                      "How are you doing with being consistent, patient, and persistent with the culture changes?"
                    </div>
                  </div>
                </div>

                {/* Celebrate Wins */}
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Celebrate Wins:</div>
                  <div className="text-xs text-glass-secondary">
                    "I noticed you earned the Innovation badge! How did that Bold Action on automation feel?"
                  </div>
                </div>

                {/* Content Deep-dive */}
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Content Deep-dive:</div>
                  <div className="text-xs text-glass-secondary">
                    "What was the biggest insight from Module 5.1 on Deep Work?"
                  </div>
                </div>

                {/* Challenge Check */}
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Challenge Check:</div>
                  <div className="text-xs text-glass-secondary">
                    "Your Bold Actions seem to be hitting the sweet spot. Are you feeling appropriately challenged?"
                  </div>
                </div>

                {/* Culture Implementation */}
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Culture Implementation:</div>
                  <div className="text-xs text-glass-secondary">
                    "How is your team responding to the culture change you implemented? Are you speaking as though it has already begun?"
                  </div>
                </div>

                {/* Team Engagement */}
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Team Engagement:</div>
                  <div className="text-xs text-glass-secondary">
                    "Who on your team is showing 'shiny eyes' lately? What are you being that's creating that engagement?"
                  </div>
                </div>

                {/* Support Offer */}
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Support Offer:</div>
                  <div className="text-xs text-glass-secondary">
                    "What's one area where I can help remove obstacles for you this week?"
                  </div>
                </div>

                {/* Future Growth */}
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <div className="text-sm font-medium text-glass-primary mb-2">Future Growth:</div>
                  <div className="text-xs text-glass-secondary">
                    "Based on your progress, what Bold Action feels most exciting for next week?"
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Meeting Notes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <PenTool className="w-5 h-5 text-purple-500" />
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
                <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                  Save Notes
                </button>
                <button className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs rounded transition-colors">
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