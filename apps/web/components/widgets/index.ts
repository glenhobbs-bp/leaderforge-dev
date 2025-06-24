/**
 * File: apps/web/components/widgets/index.ts
 * Purpose: Widget registry setup and widget exports
 * Owner: Widget Team
 * Tags: #widgets #registry #exports
 */

import { WidgetRegistry, WidgetCapabilities, AssetCapabilities } from '@leaderforge/asset-core';
import { StatCard } from './StatCard';
import { Leaderboard } from './Leaderboard';
import { VideoList } from './VideoList';
import { Panel } from './Panel';
import { Grid } from './Grid';

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

// Register Leaderboard widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'leaderboard',
    type: 'Widget',
    name: 'Leaderboard',
    description: 'Displays a ranked list of items with scores',
    version: '1.0.0',
    category: 'data',
    capabilities: [
      WidgetCapabilities.LEADERBOARD_DISPLAY,
      'leaderboard-display',
      'ranking',
      'data-visualization'
    ],
    tags: ['leaderboard', 'ranking', 'data', 'list'],
    author: 'Widget Team',
    sizeHint: 'medium',
    themeable: true,
  },
  component: Leaderboard,
  componentPath: './Leaderboard',
});

// Register VideoList widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'videolist',
    type: 'Widget',
    name: 'Video List',
    description: 'Displays a grid of video thumbnails with titles',
    version: '1.0.0',
    category: 'content',
    capabilities: [
      WidgetCapabilities.VIDEO_PLAYBACK,
      'video-list',
      'content-display',
      'grid-layout'
    ],
    tags: ['video', 'list', 'content', 'grid'],
    author: 'Widget Team',
    sizeHint: 'large',
    themeable: true,
  },
  component: VideoList,
  componentPath: './VideoList',
});

// Register Panel widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'panel',
    type: 'Widget',
    name: 'Panel',
    description: 'Layout container with heading and child widgets',
    version: '1.0.0',
    category: 'layout',
    capabilities: [
      AssetCapabilities.COMPOSABLE,
      'layout-container',
      'heading-display',
      'widget-composition'
    ],
    tags: ['panel', 'layout', 'container', 'heading'],
    author: 'Widget Team',
    sizeHint: 'flexible',
    themeable: true,
  },
  component: Panel,
  componentPath: './Panel',
});

// Register Grid widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'grid',
    type: 'Widget',
    name: 'Grid',
    description: 'Responsive grid layout for displaying multiple widgets',
    version: '1.0.0',
    category: 'layout',
    capabilities: [
      WidgetCapabilities.GRID_LAYOUT,
      WidgetCapabilities.RESPONSIVE_LAYOUT,
      AssetCapabilities.COMPOSABLE,
      'layout-container'
    ],
    tags: ['grid', 'layout', 'responsive', 'container'],
    author: 'Widget Team',
    sizeHint: 'fullwidth',
    themeable: true,
  },
  component: Grid,
  componentPath: './Grid',
});

// Export widgets and dispatcher
export { StatCard } from './StatCard';
export { Leaderboard } from './Leaderboard';
export { VideoList } from './VideoList';
export { Panel } from './Panel';
export { Grid } from './Grid';
export { WidgetDispatcher, isWidgetTypeAvailable } from './WidgetDispatcher';