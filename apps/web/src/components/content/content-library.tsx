/**
 * File: src/components/content/content-library.tsx
 * Purpose: Content library with progress integration
 * Owner: Core Team
 */

'use client';

import { ContentCard } from './content-card';
import type { ContentItem } from '@/lib/tribe-social';

interface ProgressData {
  progress: number;
  completed: boolean;
}

interface ContentLibraryProps {
  items: ContentItem[];
  progressMap: Record<string, ProgressData>;
}

export function ContentLibrary({ items, progressMap }: ContentLibraryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const itemProgress = progressMap[item.id];
        return (
          <ContentCard 
            key={item.id} 
            item={item} 
            progress={itemProgress?.progress || 0}
            completed={itemProgress?.completed || false}
          />
        );
      })}
    </div>
  );
}

