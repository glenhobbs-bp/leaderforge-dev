/**
 * File: apps/web/components/widgets/List.tsx
 * Purpose: Generic list widget for displaying ranking/activity data with glassmorphism design (Universal Widget Schema)
 * Owner: Frontend team
 * Tags: widget, list, ranking, activity, glassmorphism, universal-schema, adr-0009
 */

"use client";

import React from 'react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';
import * as LucideIcons from "lucide-react";

interface ListEntry {
  id?: string;
  rank?: number;
  name?: string;
  score?: number;
  avatar?: string;
  trend?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
  timestamp?: string;
  activity?: string;
  description?: string;
  icon?: string;
  type?: 'leaderboard' | 'activity';
}

// List component props (transformed from Universal Widget Schema)
interface ListProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function List({ schema }: ListProps) {
  // Extract data from Universal Widget Schema (ADR-0009)
  const title = schema.config.title || "List";
  const config = schema.config as unknown as {
    listType?: string;
    showRankInfo?: boolean;
    showActivityInfo?: boolean;
    activityCount?: number;
    activityPeriod?: string;
  };
  const listType = config.listType || 'leaderboard';
  const showRankInfo = config.showRankInfo || false;
  const showActivityInfo = config.showActivityInfo || false;
  const activityCount = config.activityCount || 0;
  const activityPeriod = config.activityPeriod || 'this week';
  const entries = (schema.data as unknown as { entries: ListEntry[] }).entries || [];

  // Handle undefined or null entries
  const safeEntries = entries || [];

  // Find current user and total team size (for leaderboard)
  const currentUser = safeEntries.find((entry: ListEntry) => entry.isCurrentUser);
  const currentUserRank = currentUser?.rank || 0;
  const totalTeamSize = safeEntries.length;

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getActivityIcon = (activity?: string) => {
    const iconProps = { className: "w-4 h-4 text-glass-secondary" };

    switch (activity?.toLowerCase()) {
      case 'watched video':
      case 'video watched': return <LucideIcons.Video {...iconProps} />;
      case 'completed worksheet':
      case 'worksheet completed': return <LucideIcons.FileText {...iconProps} />;
      case 'journaled':
      case 'journal entry': return <LucideIcons.BookOpen {...iconProps} />;
      case 'had standup':
      case 'standup meeting': return <LucideIcons.Users {...iconProps} />;
      case 'completed bold action':
      case 'bold action': return <LucideIcons.Target {...iconProps} />;
      default: return <LucideIcons.Activity {...iconProps} />;
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="card-glass-elevated group h-full overflow-hidden flex flex-col">
      {/* Compact Header */}
      <div className="p-5 pb-3 flex items-center justify-between flex-shrink-0 border-b border-white/10">
        <h3 className="text-glass-primary text-lg font-semibold">
          {title}
        </h3>

        {/* Rank Display (for leaderboard) */}
        {showRankInfo && currentUserRank > 0 && (
          <div className="px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/30 shadow-lg bg-white/90 text-gray-900">
            #{currentUserRank} of {totalTeamSize}
          </div>
        )}

        {/* Activity Info Display (for activity) */}
        {showActivityInfo && activityCount > 0 && (
          <div className="px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/30 shadow-lg bg-white/90 text-gray-900">
            {activityCount} {activityPeriod}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 p-5 pt-3 min-h-0">
        <div className="h-full overflow-y-auto space-y-3 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent' }}>
          {safeEntries.map((entry: ListEntry, index: number) => (
            <div
              key={entry.id || `${entry.rank || index}-${entry.name || entry.activity}`}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                entry.isCurrentUser
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 shadow-md'
                  : 'hover:bg-white/30'
              }`}
            >
              {/* Icon/Avatar */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {listType === 'leaderboard' && entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.name || ''}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="flex items-center justify-center">{getActivityIcon(entry.activity)}</div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {listType === 'leaderboard' ? (
                  <span className={`font-medium text-sm truncate block ${
                    entry.isCurrentUser ? 'text-blue-900 font-semibold' : 'text-glass-primary'
                  }`}>
                    {entry.name}
                    {entry.isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                  </span>
                ) : (
                  <div>
                    <div className="font-medium text-sm text-glass-primary truncate">
                      {entry.activity}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-glass-secondary truncate mt-0.5">
                        {entry.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Score/Time */}
              <div className="flex items-center gap-2">
                {listType === 'leaderboard' ? (
                  <>
                    <span className="text-glass-primary font-semibold text-sm">
                      {entry.score?.toLocaleString()}
                    </span>
                    {entry.trend && (
                      <span
                        className="text-glass-muted text-xs"
                        style={{
                          color: entry.trend === 'up' ? 'var(--success-500)' :
                                 entry.trend === 'down' ? 'var(--error-500)' :
                                 'var(--text-secondary)'
                        }}
                      >
                        {getTrendIcon(entry.trend)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-glass-muted text-xs">
                    {formatTime(entry.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {safeEntries.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <span className="text-glass-muted text-sm">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
}