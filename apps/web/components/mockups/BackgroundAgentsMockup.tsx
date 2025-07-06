/**
 * Purpose: Background Agents mockup component showing AI agents working behind the scenes
 * Owner: LeaderForge Platform Team
 * Tags: mockup, agents, background-services, ai-automation
 */

"use client";

import React, { useState } from 'react';
import { Shield, Target, Users, TrendingUp, BarChart3, Globe, UserCheck } from 'lucide-react';
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  isActive?: boolean;
  price?: string;
  isFeatured?: boolean;
  type: 'active' | 'available';
}

export default function BackgroundAgentsMockup() {
  const [activeAgents, setActiveAgents] = useState<Agent[]>([
    {
      id: 'threat-radar',
      name: 'Threat Radar',
      icon: <Shield className="h-5 w-5 text-red-500" />,
      description: 'Monitors competitive threats, market changes, and potential business risks. Sends alerts when immediate attention is needed.',
      isActive: true,
      type: 'active'
    },
    {
      id: 'opportunity-scout',
      name: 'Opportunity Scout',
      icon: <Target className="h-5 w-5 text-green-500" />,
      description: 'Identifies growth opportunities, partnerships, and market openings aligned with your business strategy.',
      isActive: true,
      type: 'active'
    },
    {
      id: 'team-pulse-monitor',
      name: 'Team Pulse Monitor',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      description: 'Tracks team engagement, performance indicators, and morale signals to help you lead proactively.',
      isActive: true,
      type: 'active'
    }
  ]);

  const [availableAgents, setAvailableAgents] = useState<Agent[]>([
    {
      id: 'revenue-optimizer',
      name: 'Revenue Optimizer',
      icon: <TrendingUp className="h-5 w-5 text-yellow-500" />,
      description: 'Analyzes revenue streams, identifies optimization opportunities, and tracks financial KPIs to maximize profitability.',
      price: '$29/month',
      isFeatured: true,
      type: 'available'
    },
    {
      id: 'performance-tracker',
      name: 'Performance Tracker',
      icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
      description: 'Monitors key performance indicators and sends weekly performance summaries with actionable insights.',
      price: '$19/month',
      type: 'available'
    },
    {
      id: 'market-intelligence',
      name: 'Market Intelligence',
      icon: <Globe className="h-5 w-5 text-indigo-500" />,
      description: 'Provides comprehensive market analysis, competitor intelligence, and industry trend reports.',
      price: '$39/month',
      type: 'available'
    },
    {
      id: 'hr-assistant',
      name: 'HR Assistant',
      icon: <UserCheck className="h-5 w-5 text-teal-500" />,
      description: 'Streamlines HR processes, tracks employee satisfaction, and provides recruitment insights.',
      price: '$24/month',
      type: 'available'
    }
  ]);

  // Make background agents data available to CopilotKit AI context
  useCopilotReadable({
    description: "Background agents system with active and available agents",
    value: {
      activeAgents,
      availableAgents,
      totalActiveAgents: activeAgents.filter(a => a.isActive).length,
      availableAgentsCount: availableAgents.length
    }
  });

  // CopilotKit action for toggling agent status
  useCopilotAction({
    name: "toggleAgent",
    description: "Toggle an agent's active status on or off",
    parameters: [
      {
        name: "agentId",
        type: "string",
        description: "ID of the agent to toggle",
      },
      {
        name: "isActive",
        type: "boolean",
        description: "Whether to activate or deactivate the agent",
      }
    ],
    handler: async ({ agentId, isActive }) => {
      setActiveAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, isActive }
            : agent
        )
      );
      return `Agent ${agentId} has been ${isActive ? 'activated' : 'deactivated'}`;
    },
  });

  // CopilotKit action for subscribing to agents
  useCopilotAction({
    name: "subscribeToAgent",
    description: "Subscribe to an available background agent",
    parameters: [
      {
        name: "agentId",
        type: "string",
        description: "ID of the agent to subscribe to",
      }
    ],
    handler: async ({ agentId }) => {
      const agent = availableAgents.find(a => a.id === agentId);
      if (agent) {
        // Move agent from available to active
        setActiveAgents(prev => [...prev, { ...agent, isActive: true, type: 'active' }]);
        setAvailableAgents(prev => prev.filter(a => a.id !== agentId));
        return `Successfully subscribed to ${agent.name}`;
      }
      return `Agent ${agentId} not found`;
    },
  });

  const toggleAgent = (agentId: string) => {
    setActiveAgents(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? { ...agent, isActive: !agent.isActive }
          : agent
      )
    );
  };

  const subscribeToAgent = (agentId: string) => {
    const agent = availableAgents.find(a => a.id === agentId);
    if (agent) {
      setActiveAgents(prev => [...prev, { ...agent, isActive: true, type: 'active' }]);
      setAvailableAgents(prev => prev.filter(a => a.id !== agentId));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Background Agents</h1>
        <p className="text-gray-600">AI agents working behind the scenes to monitor, analyze, and alert you to important developments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Active Agents */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">My Active Agents</h2>
            <p className="text-sm text-gray-600">Currently monitoring for you</p>
          </div>

          <div className="space-y-4">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="card-glass-subtle hover:card-glass-interactive p-4 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {agent.icon}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{agent.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{agent.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        agent.isActive
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          agent.isActive ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4">
                  <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                    Configure
                  </button>
                  <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                    {agent.id === 'threat-radar' ? 'View Alerts' :
                     agent.id === 'opportunity-scout' ? 'View Opportunities' :
                     'View Insights'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Agents */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Available Agents</h2>
            <p className="text-sm text-gray-600">Discover and subscribe to new agents</p>
          </div>

          <div className="space-y-4">
            {/* Featured Agent Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Featured Agent</span>
              </div>
              <p className="text-xs opacity-90">Most popular this month</p>
            </div>

            {availableAgents.map((agent) => (
              <div key={agent.id} className={`card-glass-subtle hover:card-glass-interactive p-4 transition-all ${
                agent.isFeatured ? 'border-2 border-yellow-200' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {agent.icon}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 text-sm">{agent.name}</h3>
                        {agent.price && (
                          <span className="text-xs font-medium text-blue-600">{agent.price}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{agent.description}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => subscribeToAgent(agent.id)}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Subscribe
                  </button>
                  <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                    {agent.id === 'revenue-optimizer' ? 'Learn More' :
                     agent.id === 'performance-tracker' ? 'Preview' :
                     agent.id === 'market-intelligence' ? 'Free Trial' :
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