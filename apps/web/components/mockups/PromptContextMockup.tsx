/**
 * Purpose: Prompt Context Management Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, prompt-contexts, ai-configuration, agent-native]
 */

"use client";

import React, { useState } from 'react';
import { Plus, Settings, Share2, Eye, Edit2, TestTube, CheckCircle2, Users, Building, Globe, X } from 'lucide-react';

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
      {/* Header Section - Match Prompt Library pattern */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Prompt Context Management
          </h1>
          <p className="text-sm text-gray-600">
            Configure how AI understands and responds to you across all LeaderForge interactions
          </p>
        </div>
        <button className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors">
          <Plus className="w-4 h-4" />
          New Context
        </button>
      </div>

      {/* Test Section - Combined Glassmorphism Card like Prompt Library */}
      <div className="card-glass-subtle p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="w-4 h-4 text-green-600" />
          <h2 className="text-lg font-medium text-glass-primary">Test Your Contexts</h2>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a question to test how your contexts affect AI responses..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <button
            onClick={handleTestResponse}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md hover:scale-105"
          >
            <TestTube className="w-3 h-3" />
            Test Response
          </button>

          {showResponse && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">AI Response Preview:</h3>
                <button
                  onClick={() => setShowResponse(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
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

      {/* Context Cards Grid - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {contexts.map((context) => (
          <div key={context.id} className="card-glass-subtle p-4 hover:card-glass-interactive">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Context Icon & Toggle */}
                <div className="flex items-center gap-2">
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
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Context Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-glass-primary">{context.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      context.type === 'personal' ? 'bg-blue-100 text-blue-700' :
                      context.type === 'team' ? 'bg-green-100 text-green-700' :
                      context.type === 'organization' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {context.type}
                    </span>
                  </div>

                  <p className="text-xs text-glass-muted mb-2 leading-relaxed line-clamp-2">
                    {context.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-glass-muted">
                    <span>Updated {context.lastUpdated}</span>
                    <span>•</span>
                    <span>Used {context.usage} times</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Smaller */}
              <div className="flex items-center gap-1 ml-2">
                {context.canEdit && (
                  <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}

                {context.canShare && (
                  <button className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                    <Share2 className="w-3 h-3" />
                  </button>
                )}

                <button className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                  <Eye className="w-3 h-3" />
                </button>

                {context.lastUpdated === 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Licensed
                  </span>
                )}

                {!context.canEdit && context.lastUpdated !== 'Licensed' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    View Only
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context Hierarchy Info - Smaller and more compact */}
      <div className="mt-6 card-glass-subtle p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-glass-primary">Context Inheritance</span>
        </div>
        <p className="text-xs text-glass-muted leading-relaxed">
          Contexts are applied hierarchically: Personal → Team → Organization → External.
          Lower-level contexts override higher-level ones for conflicting directives while additively merging complementary information.
        </p>
      </div>
    </div>
  );
}