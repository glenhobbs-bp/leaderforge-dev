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

        <section className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Widget Registry Info</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              All widgets above are rendered via the <code className="bg-gray-200 px-1 rounded">WidgetDispatcher</code>
              {' '}using the extracted widget registry system. This demonstrates that the ComponentSchemaRenderer
              refactor is working correctly.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}