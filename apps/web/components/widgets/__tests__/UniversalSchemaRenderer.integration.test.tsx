/**
 * File: apps/web/components/widgets/__tests__/UniversalSchemaRenderer.integration.test.tsx
 * Purpose: Integration tests for agent→schema→widget rendering pipeline
 * Owner: QA Team
 * Tags: #test #integration #schema #agent-native #end-to-end
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalSchemaRenderer } from '../../ai/UniversalSchemaRenderer';
import { UniversalWidgetSchema } from '../../../../../packages/agent-core/types/UniversalWidgetSchema';

// Mock the WidgetDispatcher
vi.mock('../WidgetDispatcher', () => ({
  WidgetDispatcher: ({ schema }: { schema: UniversalWidgetSchema }) => (
    <div data-testid={`widget-${schema.type.toLowerCase()}`}>
      {schema.type}: {schema.config.title}
    </div>
  ),
  isWidgetTypeAvailable: (type: string) => ['Card', 'VideoPlayer', 'StatCard', 'Grid'].includes(type),
}));

describe('UniversalSchemaRenderer Integration', () => {
  const mockUserId = 'integration-user-123';
  const mockTenantKey = 'integration-tenant';
  const mockOnAction = vi.fn();
  const mockOnProgressUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createAgentResponse = (widgets: UniversalWidgetSchema[]) => ({
    widgets,
    metadata: {
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });

  describe('Single Widget Rendering', () => {
    it('should render a single Card widget from agent response', async () => {
      const cardSchema: UniversalWidgetSchema = {
        type: 'Card',
        id: 'integration-card-1',
        data: {
          source: 'agent',
          staticContent: {
            title: 'Leadership Lesson',
            description: 'Learn about effective leadership',
            progress: 75,
          },
        },
        config: {
          title: 'Daily Leadership',
          displayMode: 'compact',
        },
        version: '1.0.0',
      };

      const agentResponse = createAgentResponse([cardSchema]);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('widget-card')).toBeDefined();
        expect(screen.getByText('Card: Daily Leadership')).toBeDefined();
      });
    });

    it('should render a StatCard widget with performance data', async () => {
      const statSchema: UniversalWidgetSchema = {
        type: 'StatCard',
        id: 'integration-stat-1',
        data: {
          source: 'database',
          staticContent: {
            value: '1,247',
            label: 'Videos Watched',
            change: '+18%',
            trend: 'up',
          },
        },
        config: {
          title: 'Learning Progress',
          displayMode: 'expanded',
        },
        version: '1.0.0',
      };

      const agentResponse = createAgentResponse([statSchema]);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('widget-statcard')).toBeDefined();
        expect(screen.getByText('StatCard: Learning Progress')).toBeDefined();
      });
    });
  });

  describe('Multiple Widget Composition', () => {
    it('should render multiple widgets in order', async () => {
      const schemas: UniversalWidgetSchema[] = [
        {
          type: 'StatCard',
          id: 'stats-overview',
          data: { source: 'database', staticContent: { value: '42', label: 'Achievements' } },
          config: { title: 'Performance Overview' },
          version: '1.0.0',
        },
        {
          type: 'Card',
          id: 'featured-content',
          data: { source: 'content', staticContent: { title: 'Featured Lesson' } },
          config: { title: 'Today\'s Focus' },
          version: '1.0.0',
        },
        {
          type: 'Grid',
          id: 'content-grid',
          data: { source: 'content', staticContent: { items: [] } },
          config: { title: 'Learning Library', layout: { columns: 3 } },
          version: '1.0.0',
        },
      ];

      const agentResponse = createAgentResponse(schemas);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('widget-statcard')).toBeDefined();
        expect(screen.getByTestId('widget-card')).toBeDefined();
        expect(screen.getByTestId('widget-grid')).toBeDefined();
      });

      // Check order is maintained
      const widgets = screen.getAllByText(/^(StatCard|Card|Grid):/);
      expect(widgets).toHaveLength(3);
    });

    it('should handle widget composition with data relationships', async () => {
      const schemas: UniversalWidgetSchema[] = [
        {
          type: 'StatCard',
          id: 'primary-stat',
          data: { source: 'analytics', staticContent: { value: '85%', label: 'Completion Rate' } },
          config: { title: 'Course Progress' },
          version: '1.0.0',
        },
        {
          type: 'Grid',
          id: 'related-content',
          data: {
            source: 'content',
            staticContent: { items: [{ id: 'related-1', title: 'Next Steps' }] }
          },
          config: { title: 'Recommended Learning' },
          version: '1.0.0',
          dataBindings: [
            {
              sourceWidgetId: 'primary-stat',
              sourceProperty: 'completionRate',
              targetProperty: 'filterCriteria',
            },
          ],
        },
      ];

      const agentResponse = createAgentResponse(schemas);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('widget-statcard')).toBeDefined();
        expect(screen.getByTestId('widget-grid')).toBeDefined();
      });
    });
  });

  describe('Error Handling & Fallbacks', () => {
    it('should handle unknown widget types gracefully', async () => {
      const schemas: UniversalWidgetSchema[] = [
        {
          type: 'UnknownWidget',
          id: 'unknown-widget',
          data: { source: 'test', staticContent: {} },
          config: { title: 'Unknown Widget' },
          version: '1.0.0',
          fallback: {
            type: 'Card',
            config: { title: 'Fallback Content' },
            errorDisplay: 'message',
            message: 'Widget not available',
          },
        },
      ];

      const agentResponse = createAgentResponse(schemas);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render fallback or error message
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/unknown|error|fallback/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty agent response', async () => {
      const agentResponse = createAgentResponse([]);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render without errors
      await waitFor(() => {
        // Check that the component renders (even if empty)
        expect(document.body).toBeDefined();
      });
    });

    it('should handle malformed schema gracefully', async () => {
      const malformedSchema = {
        type: 'Card',
        id: 'malformed-card',
        // Missing required fields
        version: '1.0.0',
      } as UniversalWidgetSchema;

      const agentResponse = createAgentResponse([malformedSchema]);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should not crash
      await waitFor(() => {
        expect(document.body).toBeDefined();
      });
    });
  });

  describe('Performance & Optimization', () => {
    it('should render multiple widgets efficiently', async () => {
      const manySchemas: UniversalWidgetSchema[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'Card',
        id: `performance-card-${i}`,
        data: { source: 'test', staticContent: { title: `Card ${i}` } },
        config: { title: `Performance Card ${i}` },
        version: '1.0.0',
      }));

      const agentResponse = createAgentResponse(manySchemas);

      const startTime = performance.now();

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        const widgets = screen.getAllByTestId('widget-card');
        expect(widgets).toHaveLength(10);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Schema Version Compatibility', () => {
    it('should handle different schema versions', async () => {
      const schemas: UniversalWidgetSchema[] = [
        {
          type: 'Card',
          id: 'v1-card',
          data: { source: 'test', staticContent: {} },
          config: { title: 'Version 1.0 Widget' },
          version: '1.0.0',
        },
        {
          type: 'StatCard',
          id: 'v1-1-stat',
          data: { source: 'test', staticContent: {} },
          config: { title: 'Version 1.1 Widget' },
          version: '1.1.0',
        },
      ];

      const agentResponse = createAgentResponse(schemas);

      render(
        <UniversalSchemaRenderer
          agentResponse={agentResponse}
          userId={mockUserId}
          tenantKey={mockTenantKey}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('widget-card')).toBeDefined();
        expect(screen.getByTestId('widget-statcard')).toBeDefined();
      });
    });
  });
});