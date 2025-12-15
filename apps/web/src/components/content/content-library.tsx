/**
 * File: src/components/content/content-library.tsx
 * Purpose: Content library with 4-step progress and sequence integration
 * Owner: Core Team
 */

'use client';

import { ContentCard } from './content-card';
import type { ContentItem } from '@/lib/tribe-social';

interface ProgressData {
  videoProgress: number;
  videoCompleted: boolean;
  worksheetCompleted: boolean;
  checkinStatus: 'none' | 'pending' | 'scheduled' | 'completed';
  boldActionStatus: 'none' | 'pending' | 'completed' | 'signed_off';
  isLocked: boolean;
  unlockReason: string | null;
  sequenceOrder: number | null;
}

interface ContentLibraryProps {
  items: ContentItem[];
  progressMap: Record<string, ProgressData>;
}

export function ContentLibrary({ items, progressMap }: ContentLibraryProps) {
  // Sort items by sequence order if they have one, otherwise keep original order
  const sortedItems = [...items].sort((a, b) => {
    const aOrder = progressMap[a.id]?.sequenceOrder;
    const bOrder = progressMap[b.id]?.sequenceOrder;
    
    // Items with sequence order come first, sorted by order
    if (aOrder !== null && bOrder !== null) {
      return aOrder - bOrder;
    }
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedItems.map((item) => {
        const itemProgress = progressMap[item.id];
        return (
          <ContentCard 
            key={item.id} 
            item={item} 
            videoProgress={itemProgress?.videoProgress || 0}
            videoCompleted={itemProgress?.videoCompleted || false}
            worksheetCompleted={itemProgress?.worksheetCompleted || false}
            checkinStatus={itemProgress?.checkinStatus || 'none'}
            boldActionStatus={itemProgress?.boldActionStatus || 'none'}
            isLocked={itemProgress?.isLocked || false}
            unlockReason={itemProgress?.unlockReason || null}
            sequenceOrder={itemProgress?.sequenceOrder || null}
          />
        );
      })}
    </div>
  );
}
