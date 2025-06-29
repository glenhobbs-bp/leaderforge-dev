/**
 * File: apps/web/components/widgets/StatCard.tsx
 * Purpose: Displays key performance metrics with glassmorphism design (Universal Widget Schema)
 * Owner: Frontend team
 * Tags: widget, stats, metrics, glassmorphism, universal-schema, adr-0009
 */

"use client";

import React from 'react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';
import * as LucideIcons from "lucide-react";

// StatCard component props (transformed from Universal Widget Schema)
interface StatCardProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function StatCard({ schema, onAction }: StatCardProps) {
  // Extract data from Universal Widget Schema (ADR-0009)
  const title = schema.config.title || 'Statistic';
  const data = schema.data as unknown as {
    value?: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: string;
    showButton?: boolean;
    buttonText?: string;
    buttonAction?: string;
    [key: string]: unknown;
  };

  const value = data.value || '0';
  const change = data.change;
  const trend = data.trend || 'neutral';
  const iconName = data.icon;
  const showButton = data.showButton || false;
  const buttonText = data.buttonText || 'Action';
  const buttonAction = data.buttonAction || 'defaultAction';

  const trendColor = {
    up: 'var(--success-500)',
    down: 'var(--error-500)',
    neutral: 'var(--text-secondary)'
  }[trend];

  const trendIcon = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }[trend];

  // Render Lucide icon dynamically
  const renderIcon = () => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5 text-glass-secondary" />;
  };

  // Handle button click
  const handleButtonClick = () => {
    if (onAction) {
      onAction({
        action: buttonAction,
        label: buttonText,
        cardId: schema.id
      });
    }
  };

  return (
    <div className="card-glass-subtle card-glass-interactive p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-glass-muted uppercase tracking-wide font-medium text-xs">
          {title}
        </h3>
        {renderIcon()}
      </div>

      <div className="mb-2">
        <span className="text-glass-primary text-3xl font-bold tracking-tight">
          {value}
        </span>
      </div>

      {/* Spacer to push button/change to bottom */}
      <div className="flex-1"></div>

      {/* Button or Change Display */}
      {showButton ? (
        <div className="mt-3">
          <button
            onClick={handleButtonClick}
            className="w-full px-2 py-1 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
          >
            {buttonAction === 'openStandupModal' && <LucideIcons.Calendar className="w-2.5 h-2.5" />}
            {buttonAction === 'openJournalModal' && <LucideIcons.Edit className="w-2.5 h-2.5" />}
            {buttonAction !== 'openStandupModal' && buttonAction !== 'openJournalModal' && <LucideIcons.Calendar className="w-2.5 h-2.5" />}
            {buttonText}
          </button>
        </div>
      ) : (
        change && (
          <div className="flex items-center gap-1 mt-3">
            <span
              className="text-glass-tiny font-medium"
              style={{ color: trendColor }}
            >
              {trendIcon} {change}
            </span>
            <span className="text-glass-tiny">from last period</span>
          </div>
        )
      )}
    </div>
  );
}