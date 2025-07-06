/**
 * Purpose: Prompt Context Management Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, prompt-contexts, ai-configuration, agent-native]
 */

"use client";

import React, { useState } from 'react';
import { Plus, Settings, Share2, Eye, Edit2, TestTube, CheckCircle2, Users, Building, Globe } from 'lucide-react';

interface PromptContext {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team' | 'organization' | 'external';
  isActive: boolean;
  canEdit: boolean;
  canShare: boolean;
  icon: string;
  priority: number;
  lastUpdated: string;
  usage: number;
}

export default function PromptContextMockup() {
  const [testPrompt, setTestPrompt] = useState('How should I handle a difficult team member?');
  const [showResponse, setShowResponse] = useState(false);
  const [contexts, setContexts] = useState<PromptContext[]>([
    {
      id: '1',
      name: 'Personal Context',
      description: '"I prefer concise, action-oriented responses. Focus on practical next steps rather than theory. Use Kingdom leadership terminology..."',
      type: 'personal',
      isActive: true,
      canEdit: true,
      canShare: false,
      icon: 'User',
      priority: 1,
      lastUpdated: '2 hours ago',
      usage: 47
    },
    {
      id: '2',
      name: 'Marketing Team Context',
      description: '"Marketing team guidelines: Use encouraging, transformative language. Emphasize new creation theology. Avoid performance Christianity..."',
      type: 'team',
      isActive: true,
      canEdit: true,
      canShare: true,
      icon: 'Users',
      priority: 2,
      lastUpdated: '1 day ago',
      usage: 23
    },
    {
      id: '3',
      name: 'Executive Team Context',
      description: '"Executive leadership focus: Strategic thinking, delegation, Kingdom executive principles. Emphasize servant leadership and team empowerment..."',
      type: 'team',
      isActive: true,
      canEdit: false,
      canShare: false,
      icon: 'Building',
      priority: 3,
      lastUpdated: '3 days ago',
      usage: 12
    },
    {
      id: '4',
      name: 'Organization Context',
      description: '"Brilliant Perspectives values: Relational not transactional, living from not toward, Kingdom normal. Help Christians discover new nature..."',
      type: 'organization',
      isActive: true,
      canEdit: false,
      canShare: false,
      icon: 'Building',
      priority: 4,
      lastUpdated: '1 week ago',
      usage: 156
    },
    {
      id: '5',
      name: 'LeaderForge Context',
      description: '"Team of leaders approach, cognitive control, deep work principles, thin slicing innovation. Professional leadership development..."',
      type: 'external',
      isActive: true,
      canEdit: false,
      canShare: false,
      icon: 'Globe',
      priority: 5,
      lastUpdated: 'Licensed',
      usage: 89
    }
  ]);

  const handleToggleContext = (contextId: string) => {
    setContexts(contexts.map(ctx =>
      ctx.id === contextId ? { ...ctx, isActive: !ctx.isActive } : ctx
    ));
  };

  const handleTestResponse = () => {
    setShowResponse(true);
  };

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'personal': return <Settings className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'organization': return <Building className="w-4 h-4" />;
      case 'external': return <Globe className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getContextTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'text-blue-600';
      case 'team': return 'text-green-600';
      case 'organization': return 'text-purple-600';
      case 'external': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Prompt Context Management
            </h1>
            <p className="text-sm text-gray-600">
              Configure how AI understands and responds to you across all LeaderForge interactions
            </p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Context
          </button>
        </div>
      </div>

      {/* Test Section */}
      <div className="card-glass p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-medium text-glass-primary">Test Your Contexts</h2>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a question to test how your contexts affect AI responses..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <button
            onClick={handleTestResponse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Test Response
          </button>

          {showResponse && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">AI Response Preview:</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Based on your Kingdom leadership approach and thin slicing preference, I recommend first seeking to understand what this team member needs to flourish. Use the opposite spirit principle - respond with encouragement where they expect correction. Break the conversation into smaller, manageable pieces rather than addressing everything at once.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Response influenced by {contexts.filter(ctx => ctx.isActive).length} active contexts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Cards Grid */}
      <div className="space-y-4">
        {contexts.map((context) => (
          <div key={context.id} className="card-glass p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Context Icon & Toggle */}
                <div className="flex items-center gap-3">
                  <div className={`${getContextTypeColor(context.type)}`}>
                    {getContextIcon(context.type)}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={context.isActive}
                      onChange={() => handleToggleContext(context.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Context Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-glass-primary">{context.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      context.type === 'personal' ? 'bg-blue-100 text-blue-700' :
                      context.type === 'team' ? 'bg-green-100 text-green-700' :
                      context.type === 'organization' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {context.type}
                    </span>
                  </div>

                  <p className="text-sm text-glass-muted mb-3 leading-relaxed">
                    {context.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-glass-muted">
                    <span>Updated {context.lastUpdated}</span>
                    <span>•</span>
                    <span>Used {context.usage} times</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                {context.canEdit && (
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {context.canShare && (
                  <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}

                <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>

                {context.lastUpdated === 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Licensed
                  </span>
                )}

                {!context.canEdit && context.lastUpdated !== 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    View Only
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context Hierarchy Info */}
      <div className="mt-8 card-glass-subtle p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-glass-primary">Context Inheritance</span>
        </div>
        <p className="text-xs text-glass-muted leading-relaxed">
          Contexts are applied hierarchically: Personal → Team → Organization → External.
          Lower-level contexts override higher-level ones for conflicting directives while additively merging complementary information.
        </p>
      </div>
    </div>
  );
}