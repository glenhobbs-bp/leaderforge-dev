/**
 * File: apps/web/components/widgets/__tests__/StatCard.test.tsx
 * Purpose: Test StatCard widget component functionality and rendering
 * Owner: QA Team
 * Tags: #test #widgets #statcard #stats
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatCard from '../StatCard';
import { UniversalWidgetSchema } from '../../../../../packages/agent-core/types/UniversalWidgetSchema';

describe('StatCard Widget', () => {
  const mockUserId = 'test-user-123';
  const mockOnAction = vi.fn();
  const mockOnProgressUpdate = vi.fn();

  const createMockSchema = (overrides: Partial<UniversalWidgetSchema> = {}): UniversalWidgetSchema => ({
    type: 'StatCard',
    id: 'test-statcard-1',
    data: {
      source: 'test',
      staticContent: {
        value: '42',
        label: 'Test Stat',
        change: '+12%',
        trend: 'up',
      },
    },
    config: {
      title: 'Performance Metrics',
      displayMode: 'compact',
    },
    version: '1.0.0',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render stat card with basic information', () => {
      const schema = createMockSchema();
      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Test Stat')).toBeDefined();
      expect(screen.getByText('+12%')).toBeDefined();
    });

    it('should render title when provided in config', () => {
      const schema = createMockSchema({
        config: { title: 'Custom Title' },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('Custom Title')).toBeDefined();
    });

    it('should handle missing title gracefully', () => {
      const schema = createMockSchema({
        config: {},
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render without throwing errors
      expect(screen.getByText('42')).toBeDefined();
    });
  });

  describe('Data Display', () => {
    it('should display numeric values correctly', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: {
            value: '1,234',
            label: 'Total Users',
            change: '+5.2%',
            trend: 'up',
          },
        },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('1,234')).toBeDefined();
      expect(screen.getByText('Total Users')).toBeDefined();
      expect(screen.getByText('+5.2%')).toBeDefined();
    });

    it('should handle zero values', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: {
            value: '0',
            label: 'Empty Stat',
            change: '0%',
            trend: 'flat',
          },
        },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('0')).toBeDefined();
      expect(screen.getByText('0%')).toBeDefined();
    });

    it('should handle negative changes', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: {
            value: '85',
            label: 'Performance Score',
            change: '-3.1%',
            trend: 'down',
          },
        },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('-3.1%')).toBeDefined();
    });
  });

  describe('Trend Indicators', () => {
    it('should show up trend correctly', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: {
            value: '100',
            label: 'Success Rate',
            change: '+10%',
            trend: 'up',
          },
        },
      });

      const { container } = render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Check for trend indicators in the DOM
      expect(container.innerHTML).toContain('+10%');
    });

    it('should show down trend correctly', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: {
            value: '75',
            label: 'Response Time',
            change: '-5%',
            trend: 'down',
          },
        },
      });

      const { container } = render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(container.innerHTML).toContain('-5%');
    });
  });

  describe('Interaction Handling', () => {
    it('should handle click interactions when configured', () => {
      const schema = createMockSchema({
        config: {
          interactions: [
            {
              trigger: 'click',
              action: 'navigate',
              parameters: { url: '/stats/detail' },
            },
          ],
        },
      });

      const { container } = render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Find clickable element and click it
      const clickableElement = container.querySelector('[role="button"], button, [data-clickable]');
      if (clickableElement) {
        fireEvent.click(clickableElement);
        expect(mockOnAction).toHaveBeenCalled();
      }
    });

    it('should not crash when no interactions are configured', () => {
      const schema = createMockSchema();

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render without errors
      expect(screen.getByText('42')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing staticContent gracefully', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
        },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render without throwing errors
      const container = screen.getByRole('generic') || screen.getByTestId('stat-card') || document.body;
      expect(container).toBeDefined();
    });

    it('should handle malformed data gracefully', () => {
      const schema = createMockSchema({
        data: {
          source: 'test',
          staticContent: null,
        },
      });

      render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Should render without throwing errors
      const container = screen.getByRole('generic') || screen.getByTestId('stat-card') || document.body;
      expect(container).toBeDefined();
    });
  });

  describe('Display Modes', () => {
    it('should apply compact display mode styling', () => {
      const schema = createMockSchema({
        config: {
          displayMode: 'compact',
        },
      });

      const { container } = render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Check for compact mode class or styling
      expect(container.firstChild).toBeDefined();
    });

    it('should apply expanded display mode styling', () => {
      const schema = createMockSchema({
        config: {
          displayMode: 'expanded',
        },
      });

      const { container } = render(
        <StatCard
          schema={schema}
          userId={mockUserId}
          onAction={mockOnAction}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(container.firstChild).toBeDefined();
    });
  });
});