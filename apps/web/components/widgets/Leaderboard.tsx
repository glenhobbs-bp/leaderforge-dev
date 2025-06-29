/**
 * File: apps/web/components/widgets/Leaderboard.tsx
 * Purpose: Displays ranking list with glassmorphism design (Universal Widget Schema)
 * Owner: Frontend team
 * Tags: widget, leaderboard, ranking, glassmorphism, universal-schema, adr-0009
 */

"use client";

import React from 'react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  trend?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

// Leaderboard component props (transformed from Universal Widget Schema)
interface LeaderboardProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: { action: string; label: string; [key: string]: unknown }) => void;
  onProgressUpdate?: () => void;
}

export default function Leaderboard({ schema }: LeaderboardProps) {
  // Extract data from Universal Widget Schema (ADR-0009)
  const title = schema.config.title || "Leaderboard";
  const entries = (schema.data as unknown as { entries: LeaderboardEntry[] }).entries || [];

  // Handle undefined or null entries
  const safeEntries = entries || [];

  // Find current user and total team size
  const currentUser = safeEntries.find((entry: LeaderboardEntry) => entry.isCurrentUser);
  const currentUserRank = currentUser?.rank || 0;
  const totalTeamSize = safeEntries.length;

  const getRankDisplay = (rank: number) => {
    if (rank <= 3) {
      const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      return medals[rank as keyof typeof medals];
    }
    return rank.toString();
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="card-glass-elevated group h-full overflow-hidden flex flex-col">
      {/* Compact Header - Just title and rank */}
      <div className="p-5 pb-3 flex items-center justify-between flex-shrink-0 border-b border-white/10">
        <h3 className="text-glass-primary text-lg font-semibold">
          {title}
        </h3>

        {/* Rank Display */}
        {currentUserRank > 0 && (
          <div className="px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/30 shadow-lg bg-white/90 text-gray-900">
            #{currentUserRank} of {totalTeamSize}
          </div>
        )}
      </div>

      {/* Scrollable Content Area - Fills remaining space */}
      <div className="flex-1 p-5 pt-3 min-h-0">
        <div className="h-full overflow-y-auto space-y-3 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent' }}>
          {safeEntries.map((entry: LeaderboardEntry) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                entry.isCurrentUser
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 shadow-md'
                  : 'hover:bg-white/30'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {entry.rank <= 3 ? (
                  <span className="text-lg">{getRankDisplay(entry.rank)}</span>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                    <span className="text-glass-primary text-xs font-medium">
                      {entry.rank}
                    </span>
                  </div>
                )}
              </div>

              {/* Avatar */}
              {entry.avatar && (
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className={`font-medium text-sm truncate block ${
                  entry.isCurrentUser ? 'text-blue-900 font-semibold' : 'text-glass-primary'
                }`}>
                  {entry.name}
                  {entry.isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="text-glass-primary font-semibold text-sm">
                  {entry.score.toLocaleString()}
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
              </div>
            </div>
          ))}
        </div>

        {safeEntries.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <span className="text-glass-muted text-sm">No leaderboard data available</span>
          </div>
        )}
      </div>
    </div>
  );
}