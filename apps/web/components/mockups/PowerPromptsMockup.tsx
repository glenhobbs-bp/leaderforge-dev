/**
 * Purpose: PowerPrompts mockup component showing AI-driven sequences for development
 * Owner: LeaderForge Platform Team
 * Tags: mockup, powerprompts, sequences, development, ai-coaching
 */

"use client";

import React, { useState } from 'react';
import { Search, Star, TrendingUp, Heart, BarChart3, Sparkles } from 'lucide-react';
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

interface Sequence {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  tags: string[];
  isActive?: boolean;
  currentStep?: number;
  totalSteps?: number;
  progress?: number;
  dueDate?: string;
  price?: string;
  isFeatured?: boolean;
  type: 'active' | 'available';
}

const categories = [
  'All Sequences',
  'Leadership',
  'Personal Growth',
  'Relationships',
  'Business Strategy',
  'Spiritual Development',
  'Performance'
];

export default function PowerPromptsMockup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sequences');

  const [activeSequences, setActiveSequences] = useState<Sequence[]>([
    {
      id: 'ceo-leadership',
      name: 'CEO Leadership Development',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      description: 'Daily leadership challenges designed for Kingdom executives. Focus on servant leadership and team empowerment.',
      category: 'Leadership',
      tags: ['leadership', 'executive', 'kingdom', 'servant-leadership'],
      isActive: true,
      currentStep: 3,
      totalSteps: 12,
      progress: 25,
      type: 'active'
    },
    {
      id: 'marriage-excellence',
      name: 'Marriage Excellence',
      icon: <Heart className="h-5 w-5 text-red-500" />,
      description: 'Strengthening your marriage through Kingdom principles. Weekly prompts and reflection exercises.',
      category: 'Relationships',
      tags: ['marriage', 'relationships', 'kingdom', 'weekly'],
      isActive: true,
      currentStep: 7,
      totalSteps: 21,
      progress: 33,
      dueDate: 'Tomorrow',
      type: 'active'
    }
  ]);

  const [availableSequences, setAvailableSequences] = useState<Sequence[]>([
    {
      id: 'performance-review-mastery',
      name: 'Performance Review Mastery',
      icon: <BarChart3 className="h-5 w-5 text-yellow-500" />,
      description: '8-week HR sequence for conducting effective performance reviews. Includes templates, scripts, and follow-up strategies.',
      category: 'Performance',
      tags: ['performance', 'reviews', 'hr', 'management'],
      price: '$49/sequence',
      isFeatured: true,
      type: 'available'
    },
    {
      id: 'personal-growth-accelerator',
      name: 'Personal Growth Accelerator',
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      description: 'Daily prompts for continuous improvement, self-reflection, and goal achievement. Adapts to your progress.',
      category: 'Personal Growth',
      tags: ['growth', 'self-improvement', 'daily', 'goals'],
      price: '$29/month',
      type: 'available'
    },
    {
      id: 'market-intelligence-weekly',
      name: 'Market Intelligence Weekly',
      icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
      description: 'Weekly competitive analysis and market opportunity prompts. Helps you stay ahead of industry trends.',
      category: 'Business Strategy',
      tags: ['market', 'intelligence', 'competitive', 'strategy'],
      price: '$39/month',
      type: 'available'
    },
    {
      id: 'spiritual-leadership-journey',
      name: 'Spiritual Leadership Journey',
      icon: <Star className="h-5 w-5 text-amber-500" />,
      description: 'Monthly spiritual leadership challenges based on Kingdom principles. Includes prayer prompts and reflection exercises.',
      category: 'Spiritual Development',
      tags: ['spiritual', 'kingdom', 'prayer', 'leadership'],
      price: '$19/month',
      type: 'available'
    }
  ]);

  // Filter sequences based on search and category
  const allSequences = [...activeSequences, ...availableSequences];
  const filteredSequences = allSequences.filter(sequence => {
    const matchesSearch = sequence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sequence.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sequence.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All Sequences' || sequence.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredActiveSequences = filteredSequences.filter(sequence => sequence.type === 'active');
  const filteredAvailableSequences = filteredSequences.filter(sequence => sequence.type === 'available');

  // Make PowerPrompts data available to CopilotKit AI context
  // Filter out React elements (icons) to avoid circular reference issues
  const serializableActiveSequences = filteredActiveSequences.map(sequence => ({
    id: sequence.id,
    name: sequence.name,
    description: sequence.description,
    category: sequence.category,
    tags: sequence.tags,
    isActive: sequence.isActive,
    currentStep: sequence.currentStep,
    totalSteps: sequence.totalSteps,
    progress: sequence.progress,
    dueDate: sequence.dueDate,
    price: sequence.price,
    isFeatured: sequence.isFeatured,
    type: sequence.type
  }));
  const serializableAvailableSequences = filteredAvailableSequences.map(sequence => ({
    id: sequence.id,
    name: sequence.name,
    description: sequence.description,
    category: sequence.category,
    tags: sequence.tags,
    isActive: sequence.isActive,
    currentStep: sequence.currentStep,
    totalSteps: sequence.totalSteps,
    progress: sequence.progress,
    dueDate: sequence.dueDate,
    price: sequence.price,
    isFeatured: sequence.isFeatured,
    type: sequence.type
  }));

  useCopilotReadable({
    description: "PowerPrompts system with active sequences and sequence library",
    value: {
      activeSequences: serializableActiveSequences,
      availableSequences: serializableAvailableSequences,
      totalActiveSequences: filteredActiveSequences.length,
      availableSequencesCount: filteredAvailableSequences.length,
      searchQuery,
      selectedCategory,
      categories
    }
  });

  // CopilotKit action for managing sequence status
  useCopilotAction({
    name: "manageSequence",
    description: "Manage a sequence (continue, pause, configure)",
    parameters: [
      {
        name: "sequenceId",
        type: "string",
        description: "ID of the sequence to manage",
      },
      {
        name: "action",
        type: "string",
        description: "Action to take: continue, pause, configure",
      }
    ],
    handler: async ({ sequenceId, action }) => {
      const sequence = activeSequences.find(s => s.id === sequenceId);
      if (sequence) {
        return `${action} action performed on ${sequence.name}`;
      }
      return `Sequence ${sequenceId} not found`;
    },
  });

  // CopilotKit action for subscribing to sequences
  useCopilotAction({
    name: "subscribeToSequence",
    description: "Subscribe to an available PowerPrompts sequence",
    parameters: [
      {
        name: "sequenceId",
        type: "string",
        description: "ID of the sequence to subscribe to",
      }
    ],
    handler: async ({ sequenceId }) => {
      const sequence = availableSequences.find(s => s.id === sequenceId);
      if (sequence) {
        // Move sequence from available to active
        setActiveSequences(prev => [...prev, {
          ...sequence,
          isActive: true,
          currentStep: 1,
          totalSteps: 12,
          progress: 0,
          type: 'active'
        }]);
        setAvailableSequences(prev => prev.filter(s => s.id !== sequenceId));
        return `Successfully subscribed to ${sequence.name}`;
      }
      return `Sequence ${sequenceId} not found`;
    },
  });

  const subscribeToSequence = (sequenceId: string) => {
    const sequence = availableSequences.find(s => s.id === sequenceId);
    if (sequence) {
      setActiveSequences(prev => [...prev, {
        ...sequence,
        isActive: true,
        currentStep: 1,
        totalSteps: 12,
        progress: 0,
        type: 'active'
      }]);
      setAvailableSequences(prev => prev.filter(s => s.id !== sequenceId));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">PowerPrompts</h1>
        <p className="text-gray-600">AI-driven sequences that proactively guide your development with personalized prompts and challenges</p>
      </div>

      {/* Search & Filter - Combined Glassmorphism Card */}
      <div className="card-glass-subtle p-4 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sequences by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Active Sequences */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">My Active Sequences</h2>
            <p className="text-sm text-gray-600">Currently enrolled sequences</p>
          </div>

          <div className="space-y-4">
            {filteredActiveSequences.map((sequence) => (
              <div key={sequence.id} className="card-glass-subtle hover:card-glass-interactive p-4 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {sequence.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{sequence.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {sequence.category}
                        </span>
                        {sequence.currentStep && sequence.totalSteps && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                            Step {sequence.currentStep}/{sequence.totalSteps}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{sequence.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sequence.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {sequence.progress !== undefined && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sequence.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                    Continue
                  </button>
                  <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                    Configure
                  </button>
                  {sequence.dueDate && (
                    <button className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors">
                      Due {sequence.dueDate}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sequence Library */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sequence Library</h2>
            <p className="text-sm text-gray-600">Discover and subscribe to new sequences</p>
          </div>

          <div className="space-y-4">
            {/* Featured Sequence Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Featured Sequence</span>
              </div>
              <p className="text-xs opacity-90">New release this week</p>
            </div>

            {filteredAvailableSequences.map((sequence) => (
              <div key={sequence.id} className={`card-glass-subtle hover:card-glass-interactive p-4 transition-all ${
                sequence.isFeatured ? 'border-2 border-yellow-200' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {sequence.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{sequence.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {sequence.category}
                        </span>
                        {sequence.price && (
                          <span className="text-xs font-medium text-blue-600">{sequence.price}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{sequence.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sequence.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => subscribeToSequence(sequence.id)}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Subscribe
                  </button>
                  <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                    {sequence.id === 'performance-review-mastery' ? 'Preview' :
                     sequence.id === 'personal-growth-accelerator' ? 'Free Trial' :
                     sequence.id === 'market-intelligence-weekly' ? 'Sample' :
                     'Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}