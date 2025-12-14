/**
 * File: src/app/(dashboard)/content/page.tsx
 * Purpose: Content library page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { fetchContentCollection } from '@/lib/tribe-social';
import { createClient } from '@/lib/supabase/server';
import { ContentLibrary } from '@/components/content/content-library';

export const metadata: Metadata = {
  title: 'Content Library',
  description: 'Browse available learning content',
};

export default async function ContentPage() {
  const [content, supabase] = await Promise.all([
    fetchContentCollection(),
    createClient(),
  ]);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user progress
  let progressMap: Record<string, { progress: number; completed: boolean }> = {};
  
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('content_id, progress_percentage, completed_at')
      .eq('user_id', user.id);

    for (const item of progress || []) {
      progressMap[item.content_id] = {
        progress: item.progress_percentage || 0,
        completed: !!item.completed_at,
      };
    }
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Library</h1>
        <p className="text-muted-foreground mt-1">
          Explore videos, documents, and learning materials
        </p>
      </div>

      {/* Content Grid */}
      {content.length > 0 ? (
        <ContentLibrary items={content} progressMap={progressMap} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">No content available</h2>
          <p className="text-muted-foreground mt-1">
            Check back soon for new learning materials.
          </p>
        </div>
      )}
    </div>
  );
}
