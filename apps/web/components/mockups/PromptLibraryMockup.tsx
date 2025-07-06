"use client";

/**
 * Purpose: Mockup component for Prompt Library interface showing searchable prompt collection
 * Owner: AI Assistant
 * Tags: mockup, prompt-library, search, ui-component
 */

import React, { useState } from 'react';
import { Search, X, Edit2, Plus, Lock, MessageSquare } from 'lucide-react';
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  usageCount: number;
  content: string;
  howToUse: string[];
  samplePrompt: string;
  isLocked: boolean;
  createdBy: string;
  createdByName: string;
}

const mockPrompts: Prompt[] = [
  {
    id: '1',
    title: 'Feel-Felt-Found Response',
    description: 'A high-empathy communication framework that transforms emotionally charged situations into positive outcomes.',
    category: 'Customer Care',
    tags: ['empathy', 'customer care', 'conflict resolution'],
    version: 'v2.1',
    usageCount: 847,
    content: 'A high-empathy, high-integrity communication tool that transforms emotionally charged client emails into short, emotionally intelligent responses that validate feelings, reinforce commitment, and inspire follow-through.',
    howToUse: [
      'Paste the customer\'s original email or message',
      'Include a rough answer that covers key facts and tone',
      'Mention their progress, stage in the program, or known struggles',
      'Clarify what support or action you want to offer next',
      'State the key point you need to communicate'
    ],
    samplePrompt: '### Role You are a skilled customer service representative and professional, emotionally intelligent responder. ### Objective To generate an empathetic, yet firm customer service email reply that: acknowledges the client\'s concerns ### Context [Paste customer\'s original email or message here] ### What to Provide: • Paste the customer\'s original email or message • Include a rough answer that covers key facts and tone no need to wordsmith it • Mention their progress, stage in the program, or known struggles • Clarify what support or action you want to offer next • State the key point you need to communicate (especially if it\'s uncomfortable)',
    isLocked: true,
    createdBy: 'admin',
    createdByName: 'Marcus Brown'
  },
  {
    id: '2',
    title: 'Delegation Framework',
    description: 'Step-by-step process for effective delegation that empowers team members while maintaining accountability.',
    category: 'Leadership',
    tags: ['delegation', 'leadership', 'empowerment'],
    version: 'v1.3',
    usageCount: 1203,
    content: 'A structured approach to delegation that ensures clarity, accountability, and team member growth.',
    howToUse: [
      'Define the task clearly',
      'Identify the right person',
      'Set clear expectations',
      'Provide necessary resources',
      'Schedule check-ins'
    ],
    samplePrompt: 'Create a delegation plan for [specific task] including success criteria, deadlines, and support needed.',
    isLocked: false,
    createdBy: 'user123',
    createdByName: 'Sarah Johnson'
  },
  {
    id: '3',
    title: 'Kingdom Marketing Message',
    description: 'Create marketing messages that align with Kingdom values and new creation theology.',
    category: 'Sales & Marketing',
    tags: ['kingdom', 'marketing', 'values'],
    version: 'v1.0',
    usageCount: 342,
    content: 'A framework for creating marketing messages that reflect Kingdom values and align with new creation theology.',
    howToUse: [
      'Define your core message',
      'Identify Kingdom values to emphasize',
      'Connect to new creation principles',
      'Test message authenticity',
      'Refine for your audience'
    ],
    samplePrompt: 'Create a marketing message for [product/service] that emphasizes Kingdom values of [specific values] and connects to new creation theology.',
    isLocked: true,
    createdBy: 'admin',
    createdByName: 'Marcus Brown'
  },
  {
    id: '4',
    title: 'Performance Review Guide',
    description: 'Comprehensive framework for conducting growth-focused performance reviews that inspire development.',
    category: 'Leadership',
    tags: ['performance', 'review', 'development'],
    version: 'v2.0',
    usageCount: 556,
    content: 'A structured approach to performance reviews that focuses on growth, development, and future potential.',
    howToUse: [
      'Prepare specific examples',
      'Set growth-oriented tone',
      'Focus on development areas',
      'Create action plans',
      'Schedule follow-ups'
    ],
    samplePrompt: 'Create a performance review framework for [employee name] in [role] focusing on [specific areas] with development goals.',
    isLocked: false,
    createdBy: 'user456',
    createdByName: 'David Kim'
  },
  {
    id: '5',
    title: 'Effective Team Meeting',
    description: 'Structure and facilitate team meetings that are focused, engaging, and result in clear action items.',
    category: 'Team Building',
    tags: ['meetings', 'facilitation', 'productivity'],
    version: 'v1.5',
    usageCount: 923,
    content: 'A comprehensive framework for running effective team meetings that maximize engagement and outcomes.',
    howToUse: [
      'Set clear objectives',
      'Create focused agenda',
      'Facilitate engagement',
      'Capture action items',
      'Follow up promptly'
    ],
    samplePrompt: 'Create a meeting agenda for [team/project] focusing on [objectives] with time allocations and engagement strategies.',
    isLocked: true,
    createdBy: 'admin',
    createdByName: 'Marcus Brown'
  },
  {
    id: '6',
    title: 'Strategic Planning Session',
    description: 'Facilitate strategic planning sessions that align team vision with actionable quarterly goals.',
    category: 'Strategy',
    tags: ['strategy', 'planning', 'goals'],
    version: 'v1.2',
    usageCount: 445,
    content: 'A structured approach to strategic planning that creates alignment and actionable outcomes.',
    howToUse: [
      'Define vision and mission',
      'Assess current state',
      'Set strategic priorities',
      'Create action plans',
      'Establish metrics'
    ],
    samplePrompt: 'Design a strategic planning session for [organization/team] to achieve [strategic goals] over [timeframe].',
    isLocked: false,
    createdBy: 'user789',
    createdByName: 'Jennifer Lee'
  },
  {
    id: '7',
    title: 'Budget Analysis Report',
    description: 'Generate comprehensive budget variance analysis with actionable insights and recommendations.',
    category: 'Finance',
    tags: ['budget', 'analysis', 'reporting', 'variance'],
    version: 'v1.0',
    usageCount: 234,
    content: 'A structured framework for analyzing budget variances and creating actionable financial reports.',
    howToUse: [
      'Input budget vs actual figures',
      'Identify significant variances',
      'Analyze root causes',
      'Develop corrective actions',
      'Present clear recommendations'
    ],
    samplePrompt: 'Analyze the budget performance for [department/project] comparing planned vs actual for [time period]. Identify variances >10% and provide actionable recommendations.',
    isLocked: true,
    createdBy: 'admin',
    createdByName: 'Marcus Brown'
  }
];

const categories = [
  'All Prompts',
  'Customer Care',
  'Sales & Marketing',
  'Leadership',
  'Email Marketing',
  'Content Creation',
  'Team Building',
  'Strategy',
  'Finance'
];

export default function PromptLibraryMockup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Prompts');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Customer Care',
    tags: '',
    content: '',
    howToUse: '',
    samplePrompt: '',
    isLocked: false
  });

  // Make prompt library available to CopilotKit AI context
  useCopilotReadable({
    description: "Complete prompt library with all available templates",
    value: mockPrompts,
  });

  // Make the pending (selected) prompt available when user clicks "Use Now"
  useCopilotReadable({
    description: "Currently selected prompt template that the user wants to use immediately",
    value: pendingPrompt,
    available: pendingPrompt ? 'enabled' : 'disabled',
  });

  // CopilotKit action for using prompts - Enhanced with template matching
  useCopilotAction({
    name: "usePromptLibraryTemplate",
    description: "Help users find and use prompt templates from the library. Automatically detects when users mention prompt names or want to use templates.",
    parameters: [
      {
        name: "promptTitle",
        type: "string",
        description: "The title or name of the prompt template the user wants to use",
        required: false,
      },
      {
        name: "userRequest",
        type: "string",
        description: "The user's specific request about what they want to do with the prompt",
        required: false,
      },
    ],
        handler: async ({ promptTitle, userRequest }) => {
      // The AI now has direct access to:
      // 1. The complete prompt library via useCopilotReadable
      // 2. Any pending/selected prompt when "Use Now" is clicked
      //
      // Note: The AI can access these automatically through the readable context.
      // We just need to provide helpful responses based on user input.

      // Try to find matching prompt from our library
      const matchingPrompt = mockPrompts.find(prompt =>
        promptTitle && prompt.title.toLowerCase().includes(promptTitle.toLowerCase())
      );

      if (matchingPrompt) {
        let response = `🎯 Perfect! I found the "${matchingPrompt.title}" template for you.\n\n`;
        response += `**Template Content:**\n${matchingPrompt.samplePrompt}\n\n`;
        response += `**Description:** ${matchingPrompt.description}\n\n`;

        if (matchingPrompt.howToUse.length > 0) {
          response += `**How to use it:**\n${matchingPrompt.howToUse.map(tip => `• ${tip}`).join('\n')}\n\n`;
        }

        if (userRequest) {
          response += `Based on your request: "${userRequest}"\n\n`;
        }

        response += `**Next steps:**\n`;
        response += `• Copy the template above and modify it for your needs\n`;
        response += `• Ask me to customize specific parts\n`;
        response += `• Tell me about your specific use case for personalized suggestions\n`;
        response += `• Ask questions about any part you'd like clarified`;

        return response;
      } else {
        let response = `I'd be happy to help you with prompt templates! `;

        if (promptTitle) {
          response += `I couldn't find an exact match for "${promptTitle}", but here are some available templates:\n\n`;
        } else {
          response += `Here are the available prompt templates in our library:\n\n`;
        }

        const availablePrompts = mockPrompts.slice(0, 5); // Show top 5
        availablePrompts.forEach(prompt => {
          response += `**${prompt.title}** (${prompt.category})\n`;
          response += `${prompt.description}\n\n`;
        });

        response += `Which template interests you? Just mention the name and I'll help you use it!`;
        return response;
      }
    },
  });

      const handleUsePrompt = (prompt: Prompt) => {
    // SEAMLESS COPILOTKIT INTEGRATION:
    // Using useCopilotReadable to make the selected prompt immediately
    // available to the AI context - no alerts or manual steps needed!

    // 1. Set the pending prompt - this immediately makes it available to the AI
    setPendingPrompt(prompt);

    // 2. Open the CopilotKit chat modal
    const copilotButton = document.querySelector('.copilotKitButton');
    if (copilotButton instanceof HTMLElement) {
      copilotButton.click();

      // 3. Clear the pending prompt after a short delay to keep context clean
      setTimeout(() => {
        setPendingPrompt(null);
      }, 30000); // Clear after 30 seconds if not used
    }
  };

  const filteredPrompts = mockPrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Prompts' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Prompt Library
          </h1>
          <p className="text-sm text-gray-600">
            Discover proven prompts for specific tasks, situations, and business scenarios
          </p>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Prompt
        </button>
      </div>

      {/* Search & Filter - Combined Glassmorphism Card */}
      <div className="card-glass-subtle p-4 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search prompts by keyword, category, or tag..."
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

      {/* Prompt Grid - Using Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="card-glass-subtle p-4 hover:card-glass-interactive cursor-pointer"
            onClick={() => setSelectedPrompt(prompt)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-medium text-glass-primary">{prompt.title}</h3>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {prompt.category}
              </span>
            </div>

            <p className="text-sm text-glass-secondary mb-3">{prompt.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-glass-muted">
              <div className="flex items-center gap-2">
                <span>{prompt.version}</span>
                {prompt.isLocked ? (
                  <div className="relative group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Allow editing if user is creator or admin (for now, allow all for demo)
                        setEditingPrompt(prompt);
                        setFormData({
                          title: prompt.title,
                          description: prompt.description,
                          category: prompt.category,
                          tags: prompt.tags.join(', '),
                          content: prompt.content,
                          howToUse: prompt.howToUse.join('\n'),
                          samplePrompt: prompt.samplePrompt,
                          isLocked: prompt.isLocked
                        });
                        setShowManageModal(true);
                      }}
                      className="p-1 hover:bg-orange-50 rounded transition-all duration-200"
                      title={`Locked by ${prompt.createdByName} - Click to edit`}
                    >
                      <Lock className="w-3 h-3 text-orange-500" />
                    </button>
                    <div className="absolute bottom-full left-full mb-2 ml-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Locked by {prompt.createdByName}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPrompt(prompt);
                      setFormData({
                        title: prompt.title,
                        description: prompt.description,
                        category: prompt.category,
                        tags: prompt.tags.join(', '),
                        content: prompt.content,
                        howToUse: prompt.howToUse.join('\n'),
                        samplePrompt: prompt.samplePrompt,
                        isLocked: prompt.isLocked
                      });
                      setShowManageModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-all duration-200"
                    title="Edit prompt"
                  >
                    <Edit2 className="w-3 h-3 text-gray-500" />
                  </button>
                )}
                <span>Used {prompt.usageCount.toLocaleString()} times</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUsePrompt(prompt);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                title="Use this prompt"
              >
                <MessageSquare className="w-3 h-3" />
                Use Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Detail Modal - Glassmorphism */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card-glass-premium max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-glass-primary">{selectedPrompt.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {selectedPrompt.category}
                    </span>
                    <span className="text-xs text-glass-muted">
                      {selectedPrompt.version} • Used {selectedPrompt.usageCount.toLocaleString()} times
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-glass-secondary">{selectedPrompt.content}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-glass-primary mb-2">How to Use:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedPrompt.howToUse.map((step, index) => (
                      <li key={index} className="text-sm text-glass-secondary">{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-glass-primary mb-2">Sample Prompt:</h3>
                  <div className="card-glass-subtle p-3 rounded-lg">
                    <pre className="whitespace-pre-wrap text-xs text-glass-secondary font-mono">{selectedPrompt.samplePrompt}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-glass-primary mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag) => (
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
          </div>
        </div>
      )}

      {/* Manage Prompts Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
            <div
              className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setEditingPrompt(null);
                  setFormData({
                    title: '',
                    description: '',
                    category: 'Customer Care',
                    tags: '',
                    content: '',
                    howToUse: '',
                    samplePrompt: '',
                    isLocked: false
                  });
                }}
                className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
                style={{
                  color: 'var(--text-secondary, #64748b)'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.color = 'var(--text-primary, #1e293b)';
                  target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.color = 'var(--text-secondary, #64748b)';
                  target.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
                </h2>
                {editingPrompt && editingPrompt.isLocked && (
                  <div className="flex items-center gap-2 mt-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-600">
                      This prompt is locked by {editingPrompt.createdByName}
                    </span>
                  </div>
                )}
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: 'var(--text-primary, #1e293b)' }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{
                        border: '1px solid var(--border, #e2e8f0)',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(2px)',
                        color: 'var(--text-primary, #1e293b)',
                        '--tw-ring-color': 'var(--primary, #3b82f6)',
                        '--tw-ring-opacity': '0.3'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'var(--primary, #3b82f6)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'var(--border, #e2e8f0)';
                      }}
                      placeholder="Enter prompt title"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: 'var(--text-primary, #1e293b)' }}
                    >
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{
                        border: '1px solid var(--border, #e2e8f0)',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(2px)',
                        color: 'var(--text-primary, #1e293b)',
                        '--tw-ring-color': 'var(--primary, #3b82f6)',
                        '--tw-ring-opacity': '0.3'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = 'var(--primary, #3b82f6)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = 'var(--border, #e2e8f0)';
                      }}
                    >
                      <option value="Customer Care">Customer Care</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Email Marketing">Email Marketing</option>
                      <option value="Content Creation">Content Creation</option>
                      <option value="Team Building">Team Building</option>
                      <option value="Strategy">Strategy</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--text-primary, #1e293b)' }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
                    style={{
                      border: '1px solid var(--border, #e2e8f0)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(2px)',
                      color: 'var(--text-primary, #1e293b)',
                      '--tw-ring-color': 'var(--primary, #3b82f6)',
                      '--tw-ring-opacity': '0.3'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--primary, #3b82f6)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border, #e2e8f0)';
                    }}
                    placeholder="Brief description of the prompt's purpose"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--text-primary, #1e293b)' }}
                  >
                    Sample Prompt
                  </label>
                  <textarea
                    value={formData.samplePrompt}
                    onChange={(e) => setFormData({...formData, samplePrompt: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none font-mono"
                    style={{
                      border: '1px solid var(--border, #e2e8f0)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(2px)',
                      color: 'var(--text-primary, #1e293b)',
                      '--tw-ring-color': 'var(--primary, #3b82f6)',
                      '--tw-ring-opacity': '0.3'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--primary, #3b82f6)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border, #e2e8f0)';
                    }}
                    placeholder="Enter the actual prompt text here"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--text-primary, #1e293b)' }}
                  >
                    How to Use (one per line)
                  </label>
                  <textarea
                    value={formData.howToUse}
                    onChange={(e) => setFormData({...formData, howToUse: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
                    style={{
                      border: '1px solid var(--border, #e2e8f0)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(2px)',
                      color: 'var(--text-primary, #1e293b)',
                      '--tw-ring-color': 'var(--primary, #3b82f6)',
                      '--tw-ring-opacity': '0.3'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--primary, #3b82f6)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border, #e2e8f0)';
                    }}
                    placeholder="Instructions on how to use this prompt effectively&#10;Each line becomes a step"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--text-primary, #1e293b)' }}
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      border: '1px solid var(--border, #e2e8f0)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(2px)',
                      color: 'var(--text-primary, #1e293b)',
                      '--tw-ring-color': 'var(--primary, #3b82f6)',
                      '--tw-ring-opacity': '0.3'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = 'var(--primary, #3b82f6)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = 'var(--border, #e2e8f0)';
                    }}
                    placeholder="e.g., customer-care, communication, problem-solving"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isLocked}
                      onChange={(e) => setFormData({...formData, isLocked: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-primary, #1e293b)' }}
                    >
                      Lock prompt (only creator or admin can edit)
                    </span>
                    <Lock className="w-3 h-3 text-gray-400" />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-xs font-medium rounded-full transition-all duration-200 opacity-90 hover:opacity-100"
                    style={{
                      backgroundColor: 'var(--primary, #3b82f6)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'var(--primary-hover, var(--primary, #3b82f6))';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'var(--primary, #3b82f6)';
                    }}
                  >
                    {editingPrompt ? 'Update Prompt' : 'Add Prompt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowManageModal(false);
                      setEditingPrompt(null);
                      setFormData({
                        title: '',
                        description: '',
                        category: 'Customer Care',
                        tags: '',
                        content: '',
                        howToUse: '',
                        samplePrompt: '',
                        isLocked: false
                      });
                    }}
                    className="px-2 py-0.5 text-xs font-medium rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
                    style={{
                      backgroundColor: 'var(--surface, #f8fafc)',
                      color: 'var(--text-secondary, #64748b)',
                      border: '1px solid var(--border, #e2e8f0)'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'var(--border, #e2e8f0)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'var(--surface, #f8fafc)';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}