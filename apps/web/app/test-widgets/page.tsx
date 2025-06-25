/**
 * File: apps/web/app/test-widgets/page.tsx
 * Purpose: Test page for extracted widgets with sample data - Design System Showcase
 * Owner: Widget Team
 * Tags: #test #widgets #development #design-system
 */

"use client";

import React, { useState } from 'react';
import { WidgetDispatcher } from '../../components/widgets';

export default function TestWidgetsPage() {
  const [theme, setTheme] = useState<'leaderforge' | 'brilliant'>('leaderforge');

  // Sample widget schemas for testing - Fixed to match widget prop interfaces
  const statCardSchema = {
    type: 'StatCard',
    props: {
      title: 'Total Users',
      value: '1,234',
      change: '+12.5%',
      trend: 'up' as const,
      icon: '👥'
    }
  };

  const leaderboardSchema = {
    type: 'Leaderboard',
    props: {
      title: 'Top Performers',
      entries: [
        { rank: 1, name: 'Alice Johnson', score: 95, trend: 'up' as const },
        { rank: 2, name: 'Bob Smith', score: 92, trend: 'up' as const },
        { rank: 3, name: 'Carol Wilson', score: 89, trend: 'same' as const },
        { rank: 4, name: 'David Brown', score: 87, trend: 'down' as const },
        { rank: 5, name: 'Eve Davis', score: 85, trend: 'up' as const }
      ]
    }
  };

  const videoListSchema = {
    type: 'VideoList',
    props: {
      title: 'Featured Videos',
      videos: [
        {
          id: 'video1',
          title: 'Introduction to React',
          thumbnail: '/thumb1.png',
          description: 'Learn the fundamentals of React development',
          duration: '12:34',
          isWatched: false,
          url: 'https://example.com/video1.mp4'
        },
        {
          id: 'video2',
          title: 'Advanced TypeScript',
          thumbnail: '/thumb2.png',
          description: 'Master advanced TypeScript patterns',
          duration: '18:45',
          isWatched: true,
          url: 'https://example.com/video2.mp4'
        },
        {
          id: 'video3',
          title: 'Component Architecture',
          thumbnail: '/thumb3.png',
          description: 'Build scalable component systems',
          duration: '22:17',
          isWatched: false,
          url: 'https://example.com/video3.mp4'
        }
      ]
    }
  };

  const leaderForgeCardSchema = {
    type: 'Card',
    props: {
      title: 'Leadership Fundamentals',
      description: 'Master the core principles of effective leadership in this comprehensive course.',
      image: '/thumb1.png',
      videoUrl: 'https://example.com/video.mp4',
      progress: 45,
      videoWatched: false,
      worksheetSubmitted: false,
      pills: [
        { label: 'Leadership', color: '#3b82f6' },
        { label: 'Beginner', color: '#10b981' }
      ],
      actions: [
        { label: 'Watch Video', action: 'openVideoModal' },
        { label: 'Download Worksheet', action: 'downloadWorksheet' }
      ]
    }
  };

  const handleCardAction = (action: { action: string; label: string; [key: string]: unknown }) => {
    console.log('Card action triggered:', action);
    alert(`Action: ${action.action} - ${action.label}`);
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 tenant-${theme}`}
      style={{
        background: 'var(--background)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="container mx-auto p-8 max-w-7xl">
        {/* Header with Theme Switcher */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-1 mb-2">Widget Testing Dashboard</h1>
            <p className="body-large text-[var(--text-secondary)]">
              Showcasing Design System compliant widgets with dynamic theming
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('leaderforge')}
              className={`btn ${theme === 'leaderforge' ? 'btn-primary' : 'btn-secondary'}`}
            >
              LeaderForge Theme
            </button>
            <button
              onClick={() => setTheme('brilliant')}
              className={`btn ${theme === 'brilliant' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Brilliant Movement Theme
            </button>
          </div>
        </div>

        <div className="space-y-12">
          {/* StatCard Widget Section */}
          <section>
            <h2 className="heading-3 mb-6">StatCard Widgets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WidgetDispatcher schema={statCardSchema} />
              <WidgetDispatcher schema={{
                type: 'StatCard',
                props: {
                  title: 'Revenue',
                  value: '$45,678',
                  change: '+8.2%',
                  trend: 'up' as const,
                  icon: '💰'
                }
              }} />
              <WidgetDispatcher schema={{
                type: 'StatCard',
                props: {
                  title: 'Completion Rate',
                  value: '87.5%',
                  change: '-1.2%',
                  trend: 'down' as const,
                  icon: '📊'
                }
              }} />
            </div>
          </section>

          {/* Leaderboard Widget Section */}
          <section>
            <h2 className="heading-3 mb-6">Leaderboard Widgets</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <WidgetDispatcher schema={leaderboardSchema} />
              <WidgetDispatcher schema={{
                type: 'Leaderboard',
                props: {
                  title: 'Sales Team',
                  entries: [
                    { rank: 1, name: 'Sarah Miller', score: 125000, trend: 'up' as const },
                    { rank: 2, name: 'Mike Chen', score: 98500, trend: 'same' as const },
                    { rank: 3, name: 'Lisa Garcia', score: 87200, trend: 'up' as const },
                    { rank: 4, name: 'Tom Wilson', score: 76800, trend: 'down' as const },
                    { rank: 5, name: 'Amy Davis', score: 65300, trend: 'up' as const }
                  ]
                }
              }} />
            </div>
          </section>

          {/* VideoList Widget Section */}
          <section>
            <h2 className="heading-3 mb-6">VideoList Widget</h2>
            <WidgetDispatcher schema={videoListSchema} />
          </section>

          {/* LeaderForge Card Widget Section */}
          <section>
            <h2 className="heading-3 mb-6">LeaderForge Card Widgets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <WidgetDispatcher
                schema={leaderForgeCardSchema}
                onAction={handleCardAction}
              />
              <WidgetDispatcher
                schema={{
                  type: 'Card',
                  props: {
                    title: 'Team Building Strategies',
                    description: 'Learn proven techniques for building high-performing teams.',
                    image: '/thumb2.png',
                    videoUrl: 'https://example.com/video2.mp4',
                    progress: 100,
                    videoWatched: true,
                    worksheetSubmitted: true,
                    pills: [
                      { label: 'Team Building', color: '#8b5cf6' },
                      { label: 'Intermediate', color: '#f59e0b' }
                    ],
                    actions: [
                      { label: 'Rewatch', action: 'openVideoModal' },
                      { label: 'View Certificate', action: 'viewCertificate' }
                    ]
                  }
                }}
                onAction={handleCardAction}
              />
              <WidgetDispatcher
                schema={{
                  type: 'Card',
                  props: {
                    title: 'Communication Excellence',
                    description: 'Develop advanced communication skills for leadership success.',
                    image: '/thumb3.png',
                    videoUrl: 'https://example.com/video3.mp4',
                    progress: 0,
                    videoWatched: false,
                    worksheetSubmitted: false,
                    pills: [
                      { label: 'Communication', color: '#ef4444' }
                    ],
                    actions: [
                      { label: 'Start Course', action: 'openVideoModal' }
                    ]
                  }
                }}
                onAction={handleCardAction}
              />
            </div>
          </section>

          {/* Design System Information */}
          <section className="mt-12 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <h2 className="heading-3 mb-4">Design System Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="heading-4 mb-3">Theme Variables</h3>
                <ul className="space-y-2 body-small">
                  <li>• Dynamic CSS variables per tenant</li>
                  <li>• Consistent color tokens</li>
                  <li>• Typography scale compliance</li>
                  <li>• Component-based styling</li>
                </ul>
              </div>
              <div>
                <h3 className="heading-4 mb-3">Current Theme: {theme === 'leaderforge' ? 'LeaderForge' : 'Brilliant Movement'}</h3>
                <div className="space-y-2 body-small">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--primary)' }}></div>
                    <span>Primary: var(--primary)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--secondary)' }}></div>
                    <span>Secondary: var(--secondary)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--accent)' }}></div>
                    <span>Accent: var(--accent)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}