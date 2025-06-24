/**
 * File: apps/web/components/widgets/index.ts
 * Purpose: Widget registry setup and widget exports
 * Owner: Widget Team
 * Tags: #widgets #registry #exports
 */

import { WidgetRegistry, WidgetCapabilities } from '@leaderforge/asset-core';
import { StatCard } from './StatCard';

// Create global widget registry instance
export const widgetRegistry = new WidgetRegistry();

// Register StatCard widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'statcard',
    type: 'Widget',
    name: 'Statistics Card',
    description: 'Displays a statistical value with title and optional description',
    version: '1.0.0',
    category: 'data',
    capabilities: [
      WidgetCapabilities.STATISTICS_DISPLAY,
      'statistics-display',
      'data-visualization'
    ],
    tags: ['stats', 'card', 'data', 'display'],
    author: 'Widget Team',
    sizeHint: 'medium',
    themeable: true,
  },
  component: StatCard,
  componentPath: './StatCard',
});

// Export widgets and dispatcher
export { StatCard } from './StatCard';
export { WidgetDispatcher } from './WidgetDispatcher';