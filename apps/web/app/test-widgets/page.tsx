/**
 * File: apps/web/app/test-widgets/page.tsx
 * Purpose: Test page for extracted widgets with sample data
 * Owner: Widget Team
 * Tags: #test #widgets #development
 */

"use client";

import React from 'react';
import { WidgetDispatcher } from '../../components/widgets';

export default function TestWidgetsPage() {
  // Sample widget schemas for testing
  const statCardSchema = {
    type: 'StatCard',
    props: {
      title: 'Total Users',
      value: '1,234',
      description: 'Active users this month'
    }
  };

  const leaderboardSchema = {
    type: 'Leaderboard',
    props: {
      title: 'Top Performers',
      items: [
        { name: 'Alice Johnson', score: '95%' },
        { name: 'Bob Smith', score: '92%' },
        { name: 'Carol Wilson', score: '89%' },
        { name: 'David Brown', score: '87%' },
        { name: 'Eve Davis', score: '85%' }
      ]
    }
  };

  const videoListSchema = {
    type: 'VideoList',
    props: {
      title: 'Featured Videos',
      videos: [
        {
          props: {
            title: 'Introduction to React',
            image: '/thumb1.png'
          }
        },
        {
          props: {
            title: 'Advanced TypeScript',
            image: '/thumb2.png'
          }
        },
        {
          props: {
            title: 'Component Architecture',
            image: '/thumb3.png'
          }
        }
      ]
    }
  };

  const videoPlayerSchema = {
    type: 'VideoPlayer',
    props: {
      videoUrl: 'https://example.com/sample-video.mp4',
      title: 'Sample Training Video',
      description: 'This is a demo video player modal widget',
      progress: 25,
      videoWatched: false,
      worksheetSubmitted: false,
      pills: [
        { label: 'Training', color: '#3b82f6' },
        { label: 'Demo', color: '#10b981' }
      ]
    }
  };

  // Type the action parameter
  const handleCardAction = (action: { action: string; label: string; [key: string]: unknown }) => {
    console.log('Card action triggered:', action);
    alert(`Action: ${action.action} - ${action.label}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Widget Testing Dashboard</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">StatCard Widget</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WidgetDispatcher schema={statCardSchema} />
            <WidgetDispatcher schema={{
              type: 'StatCard',
              props: {
                title: 'Revenue',
                value: '$45,678',
                description: 'Monthly recurring revenue'
              }
            }} />
            <WidgetDispatcher schema={{
              type: 'StatCard',
              props: {
                title: 'Completion Rate',
                value: '87.5%'
              }
            }} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Leaderboard Widget</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WidgetDispatcher schema={leaderboardSchema} />
            <WidgetDispatcher schema={{
              type: 'Leaderboard',
              props: {
                title: 'Sales Team',
                items: [
                  { name: 'Sarah Miller', score: '$125,000' },
                  { name: 'Mike Chen', score: '$98,500' },
                  { name: 'Lisa Garcia', score: '$87,200' }
                ]
              }
            }} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">VideoList Widget</h2>
          <WidgetDispatcher schema={videoListSchema} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">LeaderForge Card Widget</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WidgetDispatcher
              schema={{
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
              }}
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

        <section>
          <h2 className="text-2xl font-semibold mb-4">Video Player Modal Widget</h2>
          <div className="max-w-lg mx-auto">
            <p className="text-sm text-gray-600 mb-4">
              Basic VideoPlayerModal widget structure (video functionality will be added incrementally)
            </p>
            <WidgetDispatcher schema={videoPlayerSchema} />
          </div>
        </section>

        <section className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Widget Registry Info</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              All widgets above are rendered via the <code className="bg-gray-200 px-1 rounded">WidgetDispatcher</code>
              {' '}using the extracted widget registry system. This demonstrates that the ComponentSchemaRenderer
              refactor is working correctly.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <strong>Progress:</strong> 7 of 7 widget types now registered in the system
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}