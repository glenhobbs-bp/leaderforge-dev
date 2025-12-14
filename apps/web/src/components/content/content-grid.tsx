/**
 * File: src/components/content/content-grid.tsx
 * Purpose: Grid display of content items
 * Owner: Core Team
 */

'use client';

import { ContentCard } from './content-card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentGridProps {
  items: ContentItem[];
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}

