/**
 * File: apps/web/components/widgets/index.ts
 * Purpose: Widget registry setup and widget exports
 * Owner: Widget Team
 * Tags: #widgets #registry #exports
 */

import { WidgetRegistry, WidgetCapabilities, AssetCapabilities } from './types';
import StatCard from './StatCard';
import Leaderboard from './Leaderboard';
import VideoList from './VideoList';
import Panel from './Panel';
import Grid from './Grid';
import { LeaderForgeCard } from './LeaderForgeCard';
import { FormWidget, formSchemaToProps } from './FormWidget';
import { TableWidget, tableSchemaToProps } from './TableWidget';
// 🚀 PERFORMANCE FIX: Lazy load VideoPlayerModal to avoid bundling hls.js (400kB)
// import { VideoPlayerModal } from './VideoPlayerModal'; // ❌ Removed static import

// Create global widget registry instance
export const widgetRegistry = new WidgetRegistry();

// Create a lazy wrapper component for registry compatibility
import { lazy } from 'react';
const LazyVideoPlayerModal = lazy(() =>
  import('./VideoPlayerModal').then(module => ({
    default: module.VideoPlayerModal
  }))
);

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

// Register LeaderForgeCard widget
widgetRegistry.registerWidget({
  metadata: {
    id: 'leaderforge-card',
    type: 'Widget',
    name: 'LeaderForge Card',
    description: 'Specialized content card for LeaderForge platform with video modals, progress tracking, and worksheet status',
    version: '1.0.0',
    category: 'content',
    capabilities: [
      WidgetCapabilities.VIDEO_PLAYBACK,
      WidgetCapabilities.PROGRESS_TRACKING,
      'content-display',
      'video-modal',
      'progress-indicator',
      'action-handling',
      'platform-specific'
    ],
    tags: ['card', 'video', 'progress', 'leaderforge', 'content', 'modal'],
    author: 'Widget Team',
    sizeHint: 'medium',
    themeable: true,
  },
  component: LeaderForgeCard,
  componentPath: './LeaderForgeCard',
});

// Register VideoPlayerModal with lazy wrapper instead of null component
widgetRegistry.registerWidget({
  metadata: {
    id: 'videoplayer-modal',
    type: 'Widget',
    name: 'Video Player Modal',
    description: 'HLS video player with modal display and progress tracking',
    version: '1.0.0',
    category: 'content',
    capabilities: [
      WidgetCapabilities.VIDEO_PLAYBACK,
      WidgetCapabilities.MODAL_DISPLAY,
      WidgetCapabilities.PROGRESS_TRACKING,
      'hls-streaming',
      'fullscreen-support'
    ],
    tags: ['video', 'modal', 'hls', 'streaming', 'progress'],
    author: 'Widget Team',
    sizeHint: 'fullscreen',
    themeable: true,
  },
  component: LazyVideoPlayerModal,
  componentPath: './VideoPlayerModal',
});

// Register FormWidget
widgetRegistry.registerWidget({
  metadata: {
    id: 'form',
    type: 'Widget',
    name: 'Form',
    description: 'Dynamic form widget using React JSON Schema Form',
    version: '1.0.0',
    category: 'input',
    capabilities: [
      'form-input',
      'validation',
      'schema-driven',
      'admin-action'
    ],
    tags: ['form', 'input', 'admin', 'rjsf', 'schema'],
    author: 'Engineering Team',
    sizeHint: 'flexible',
    themeable: true,
  },
  component: FormWidget,
  componentPath: './FormWidget',
  schemaToProps: formSchemaToProps,
});

// Register TableWidget
widgetRegistry.registerWidget({
  metadata: {
    id: 'table',
    type: 'Widget',
    name: 'Table',
    description: 'Data table widget with sorting, selection, and actions',
    version: '1.0.0',
    category: 'data',
    capabilities: [
      WidgetCapabilities.DATA_DISPLAY,
      'table-display',
      'sorting',
      'selection',
      'pagination',
      'admin-action'
    ],
    tags: ['table', 'data', 'admin', 'list'],
    author: 'Engineering Team',
    sizeHint: 'large',
    themeable: true,
  },
  component: TableWidget,
  componentPath: './TableWidget',
  schemaToProps: tableSchemaToProps,
});

// Export widgets and dispatcher
export { default as StatCard } from './StatCard';
export { default as Leaderboard } from './Leaderboard';
export { default as VideoList } from './VideoList';
export { default as Panel } from './Panel';
export { default as Grid } from './Grid';
export { LeaderForgeCard } from './LeaderForgeCard';
export { FormWidget } from './FormWidget';
export { TableWidget } from './TableWidget';
// ✅ PERFORMANCE: VideoPlayerModal export removed to avoid SSR errors
// Component is imported dynamically when needed to prevent bundle bloat
export { WidgetDispatcher, isWidgetTypeAvailable } from './WidgetDispatcher';