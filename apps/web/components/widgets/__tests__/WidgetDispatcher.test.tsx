/**
 * File: apps/web/components/widgets/__tests__/WidgetDispatcher.test.tsx
 * Purpose: Test Universal Widget Dispatcher for schema routing and rendering
 * Owner: QA Team
 * Tags: #test #widgets #dispatcher #universal-rendering
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WidgetDispatcher, isWidgetTypeAvailable } from '../WidgetDispatcher';
import { UniversalWidgetSchema } from '../../../../../packages/agent-core/types/UniversalWidgetSchema';

// Mock child components
vi.mock('../LeaderForgeCard', () => ({
  LeaderForgeCard: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="leaderforge-card">Card: {schema.config.title}</div>
  ),
}));

vi.mock('../VideoPlayerModal', () => ({
  VideoPlayerModal: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="video-player">VideoPlayer: {schema.config.title}</div>
  ),
}));

vi.mock('../StatCard', () => ({
  default: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="stat-card">StatCard: {schema.config.title}</div>
  ),
}));

vi.mock('../Leaderboard', () => ({
  default: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="leaderboard">Leaderboard: {schema.config.title}</div>
  ),
}));

vi.mock('../VideoList', () => ({
  default: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="video-list">VideoList: {schema.config.title}</div>
  ),
}));

vi.mock('../Panel', () => ({
  default: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid="panel">Panel: {schema.config.title}</div>
  ),
}));

vi.mock('../Grid', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="grid">Grid: {title}</div>
  ),
}));

describe('WidgetDispatcher', () => {
  const mockUserId = 'test-user-123';
  const mockTenantKey = 'test-tenant';
  const mockOnAction = vi.fn();
  const mockOnProgressUpdate = vi.fn();

  const createMockSchema = (type: string, title: string = 'Test Title'): UniversalWidgetSchema => ({
    type,
    id: `test-${type.toLowerCase()}-1`,
    data: {
      source: 'test',
      staticContent: { items: [] },
    },
    config: {
      title,
      subtitle: 'Test Subtitle',
    },
    version: '1.0.0',
  });

  describe('Widget Type Availability', () => {
    it('should correctly identify available widget types', () => {
      expect(isWidgetTypeAvailable('Card')).toBe(true);
      expect(isWidgetTypeAvailable('VideoPlayer')).toBe(true);
      expect(isWidgetTypeAvailable('StatCard')).toBe(true);
      expect(isWidgetTypeAvailable('Leaderboard')).toBe(true);
      expect(isWidgetTypeAvailable('VideoList')).toBe(true);
      expect(isWidgetTypeAvailable('Panel')).toBe(true);
      expect(isWidgetTypeAvailable('Grid')).toBe(true);
    });

    it('should return false for unavailable widget types', () => {
      expect(isWidgetTypeAvailable('UnknownWidget')).toBe(false);
      expect(isWidgetTypeAvailable('CustomWidget')).toBe(false);
      expect(isWidgetTypeAvailable('')).toBe(false);
    });
  });

  describe('Widget Routing', () => {
    it('should render Card widget correctly', () => {
      const schema = createMockSchema('Card', 'Test Card');
      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('leaderforge-card')).toBeInTheDocument();
      expect(screen.getByText('Card: Test Card')).toBeInTheDocument();
    });

    it('should render VideoPlayer widget correctly', () => {
      const schema = createMockSchema('VideoPlayer', 'Test Video');
      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('video-player')).toBeInTheDocument();
      expect(screen.getByText('VideoPlayer: Test Video')).toBeInTheDocument();
    });

    it('should render StatCard widget correctly', () => {
      const schema = createMockSchema('StatCard', 'Test Stat');
      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('stat-card')).toBeInTheDocument();
      expect(screen.getByText('StatCard: Test Stat')).toBeInTheDocument();
    });

    it('should render Grid widget with proper configuration', () => {
      const schema = createMockSchema('Grid', 'Test Grid');
      schema.config.layout = { columns: 4 };
      schema.data = {
        source: 'test',
        staticContent: {
          items: [{ id: '1', title: 'Item 1' }],
          availableContent: [],
        },
      };

      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('grid')).toBeInTheDocument();
      expect(screen.getByText('Grid: Test Grid')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message for unknown widget type', () => {
      const schema = createMockSchema('UnknownWidget', 'Unknown Widget');
      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('Unknown Widget Type')).toBeInTheDocument();
      expect(screen.getByText('Widget type "UnknownWidget" is not supported.')).toBeInTheDocument();
    });

    it('should include debug information in error display', () => {
      const schema = createMockSchema('InvalidWidget', 'Invalid Widget');
      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const debugSummary = screen.getByText('Debug Info');
      expect(debugSummary).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass all required props to widgets', () => {
      const schema = createMockSchema('Card', 'Props Test');
      const { rerender } = render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('leaderforge-card')).toBeInTheDocument();

      // Test prop changes
      const updatedSchema = { ...schema, config: { ...schema.config, title: 'Updated Title' } };
      rerender(
        <WidgetDispatcher
          schema={updatedSchema}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('Card: Updated Title')).toBeInTheDocument();
    });
  });

  describe('Schema Validation', () => {
    it('should handle schema with missing config gracefully', () => {
      const schema: UniversalWidgetSchema = {
        type: 'Card',
        id: 'test-card-missing-config',
        data: { source: 'test' },
        config: {}, // Empty config
        version: '1.0.0',
      };

      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('leaderforge-card')).toBeInTheDocument();
    });

    it('should handle schema with missing data gracefully', () => {
      const schema = createMockSchema('Panel', 'Data Test');
      schema.data = { source: 'test' }; // Minimal data

      render(
        <WidgetDispatcher
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('panel')).toBeInTheDocument();
    });
  });
});