/**
 * File: packages/services/src/content.service.ts
 * Purpose: Content management service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentItem } from '@leaderforge/database';
import type { ServiceResult, PaginatedResult, PaginationParams, UserContext } from './types';

export interface GetContentParams extends PaginationParams {
  type?: 'video' | 'document' | 'link' | 'course';
  tags?: string[];
  search?: string;
  sort?: 'title' | 'created_at' | 'sort_order';
}

export interface ContentWithProgress extends ContentItem {
  progress?: {
    percentage: number;
    completed: boolean;
    lastViewedAt: string;
  };
}

export class ContentService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get content library
   */
  async getContent(
    context: UserContext,
    params: GetContentParams
  ): Promise<ServiceResult<PaginatedResult<ContentWithProgress>>> {
    const { page = 1, limit = 20, type, tags, search, sort = 'sort_order' } = params;
    const offset = (page - 1) * limit;

    // First get content items
    let query = this.supabase
      .from('items')
      .select('*', { count: 'exact' })
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true)
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order(sort === 'sort_order' ? 'sort_order' : sort);

    const { data: items, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      };
    }

    // Get progress for these items
    const contentIds = items?.map((item) => item.id) || [];
    const { data: progressData } = await this.supabase
      .from('user_progress')
      .select('content_id, progress_percentage, completed_at, last_viewed_at')
      .eq('user_id', context.userId)
      .in('content_id', contentIds);

    // Merge progress with content
    const progressMap = new Map(
      progressData?.map((p) => [p.content_id, p]) || []
    );

    const itemsWithProgress: ContentWithProgress[] = (items || []).map((item) => {
      const progress = progressMap.get(item.id);
      return {
        ...item,
        progress: progress
          ? {
              percentage: progress.progress_percentage,
              completed: !!progress.completed_at,
              lastViewedAt: progress.last_viewed_at,
            }
          : undefined,
      };
    });

    return {
      success: true,
      data: {
        items: itemsWithProgress,
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      },
    };
  }

  /**
   * Get single content item
   */
  async getContentById(
    context: UserContext,
    contentId: string
  ): Promise<ServiceResult<ContentWithProgress>> {
    const { data: item, error } = await this.supabase
      .from('items')
      .select('*')
      .eq('id', contentId)
      .eq('tenant_id', context.tenantId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Content not found',
        },
      };
    }

    // Get progress
    const { data: progress } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('content_id', contentId)
      .eq('user_id', context.userId)
      .single();

    return {
      success: true,
      data: {
        ...item,
        progress: progress
          ? {
              percentage: progress.progress_percentage,
              completed: !!progress.completed_at,
              lastViewedAt: progress.last_viewed_at,
            }
          : undefined,
      },
    };
  }
}

