/**
 * File: packages/database/src/types.ts
 * Purpose: Database types - manually defined until supabase gen types is run
 * Owner: Core Team
 */

// ============================================
// Core Schema Types
// ============================================

export interface Tenant {
  id: string;
  tenant_key: string;
  display_name: string;
  theme: TenantTheme;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantTheme {
  logo_url: string | null;
  favicon_url: string | null;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text_primary: string;
  text_secondary: string;
  font_family: string;
  border_radius: string;
}

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  branding: OrgBranding;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgBranding {
  logo_url: string | null;
  primary_color: string | null;
  display_name: string | null;
  use_tenant_theme: boolean;
}

export interface Team {
  id: string;
  tenant_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  email_digest: 'daily' | 'weekly' | 'never';
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  organization_id: string;
  team_id: string | null;
  role: 'member' | 'manager' | 'admin' | 'owner';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  organization_id: string;
  email: string;
  role: 'member' | 'manager' | 'admin';
  team_id: string | null;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// ============================================
// Content Schema Types
// ============================================

export interface ContentItem {
  id: string;
  tenant_id: string;
  external_id: string | null;
  source: 'leaderforge' | 'tenant' | 'marketplace';
  type: 'video' | 'document' | 'link' | 'course';
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_url: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  tenant_id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentEntitlement {
  id: string;
  entitlement_id: string;
  content_id: string;
  created_at: string;
}

// ============================================
// Progress Schema Types
// ============================================

export interface UserProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  content_id: string;
  progress_type: 'video' | 'document' | 'quiz' | 'course' | 'custom';
  progress_percentage: number;
  completion_count: number;
  total_sessions: number;
  started_at: string;
  last_viewed_at: string;
  completed_at: string | null;
  metadata: ProgressMetadata;
  notes: string | null;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressMetadata {
  // Video-specific
  watch_time_seconds?: number;
  last_position_seconds?: number;
  playback_rate?: number;
  // Document-specific
  pages_viewed?: number[];
  scroll_position?: number;
  // Quiz-specific
  score?: number;
  answers?: Record<string, unknown>;
  // Generic
  [key: string]: unknown;
}

export interface UserStreak {
  id: string;
  tenant_id: string;
  user_id: string;
  streak_type: 'daily' | 'weekly';
  current_streak: number;
  longest_streak: number;
  streak_start: string | null;
  last_activity_date: string | null;
  updated_at: string;
}

export interface PointsLedger {
  id: string;
  tenant_id: string;
  user_id: string;
  points: number;
  reason: string;
  source_type: 'content' | 'streak' | 'achievement' | 'bonus' | 'adjustment';
  source_id: string | null;
  created_at: string;
}

export interface LeaderboardCache {
  id: string;
  tenant_id: string;
  organization_id: string | null;
  team_id: string | null;
  user_id: string;
  period_type: 'weekly' | 'monthly' | 'all_time';
  period_start: string;
  total_points: number;
  rank: number;
  videos_completed: number;
  current_streak: number;
  updated_at: string;
}

// ============================================
// Database Schema Definition
// ============================================

export interface Database {
  core: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tenant, 'id' | 'created_at'>>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      memberships: {
        Row: Membership;
        Insert: Omit<Membership, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Membership, 'id' | 'created_at'>>;
      };
      invitations: {
        Row: Invitation;
        Insert: Omit<Invitation, 'id' | 'created_at'>;
        Update: Partial<Omit<Invitation, 'id' | 'created_at'>>;
      };
    };
  };
  content: {
    Tables: {
      items: {
        Row: ContentItem;
        Insert: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ContentItem, 'id' | 'created_at'>>;
      };
      entitlements: {
        Row: Entitlement;
        Insert: Omit<Entitlement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Entitlement, 'id' | 'created_at'>>;
      };
      content_entitlements: {
        Row: ContentEntitlement;
        Insert: Omit<ContentEntitlement, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
  progress: {
    Tables: {
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProgress, 'id' | 'created_at'>>;
      };
      user_streaks: {
        Row: UserStreak;
        Insert: Omit<UserStreak, 'id' | 'updated_at'>;
        Update: Partial<Omit<UserStreak, 'id'>>;
      };
      points_ledger: {
        Row: PointsLedger;
        Insert: Omit<PointsLedger, 'id' | 'created_at'>;
        Update: never;
      };
      leaderboard_cache: {
        Row: LeaderboardCache;
        Insert: Omit<LeaderboardCache, 'id' | 'updated_at'>;
        Update: Partial<Omit<LeaderboardCache, 'id'>>;
      };
    };
  };
}

