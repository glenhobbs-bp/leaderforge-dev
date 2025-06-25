/**
 * File: apps/web/components/widgets/Leaderboard.tsx
 * Purpose: Displays ranking list with glassmorphism design and elegant typography
 * Owner: Frontend team
 * Tags: widget, leaderboard, ranking, glassmorphism
 */

"use client";

import React from 'react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  trend?: 'up' | 'down' | 'same';
}

interface LeaderboardProps {
  title?: string;
  entries: LeaderboardEntry[];
  maxEntries?: number;
}

export default function Leaderboard({ title = "Leaderboard", entries, maxEntries = 5 }: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries);

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
    <div className="card-glass-subtle p-6">
      <h3 className="text-glass-primary text-lg font-semibold mb-5">
        {title}
      </h3>

      <div className="space-y-3">
        {displayEntries.map((entry) => (
          <div
            key={`${entry.rank}-${entry.name}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/30 transition-all duration-200"
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
              <span className="text-glass-primary font-medium text-sm truncate block">
                {entry.name}
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

      {entries.length === 0 && (
        <div className="text-center py-8">
          <span className="text-glass-muted text-sm">No leaderboard data available</span>
        </div>
      )}
    </div>
  );
}