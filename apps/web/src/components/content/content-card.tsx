/**
 * File: src/components/content/content-card.tsx
 * Purpose: Content item card component
 * Owner: Core Team
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, FileText, ExternalLink, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentCardProps {
  item: ContentItem;
  progress?: number;
  completed?: boolean;
}

export function ContentCard({ item, progress = 0, completed = false }: ContentCardProps) {
  const typeIcon = {
    video: Play,
    document: FileText,
    link: ExternalLink,
  };
  const Icon = typeIcon[item.type];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link href={`/content/${item.id}`}>
      <Card className="group overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <Icon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Play overlay for videos */}
          {item.type === 'video' && !completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Completed overlay */}
          {completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          {/* Duration badge */}
          {item.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs font-medium rounded">
              {formatDuration(item.duration)}
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded capitalize flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {item.type}
          </div>

          {/* Completed badge */}
          {completed && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Done
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Progress bar */}
          {progress > 0 && !completed && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
