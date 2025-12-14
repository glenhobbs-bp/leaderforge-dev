/**
 * File: src/components/content/content-card.tsx
 * Purpose: Content item card with video and worksheet status
 * Owner: Core Team
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, FileText, ExternalLink, CheckCircle, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentCardProps {
  item: ContentItem;
  videoProgress?: number;
  videoCompleted?: boolean;
  worksheetCompleted?: boolean;
}

export function ContentCard({ 
  item, 
  videoProgress = 0, 
  videoCompleted = false,
  worksheetCompleted = false,
}: ContentCardProps) {
  const typeIcon = {
    video: Play,
    document: FileText,
    link: ExternalLink,
  };
  const Icon = typeIcon[item.type];

  // Calculate overall progress (50% video + 50% worksheet)
  const overallProgress = Math.round(
    (videoCompleted ? 50 : (videoProgress / 2)) + 
    (worksheetCompleted ? 50 : 0)
  );
  const isFullyCompleted = videoCompleted && worksheetCompleted;

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
          {item.type === 'video' && !isFullyCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Completed overlay */}
          {isFullyCompleted && (
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
          {isFullyCompleted && (
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

          {/* Progress Section */}
          {(videoProgress > 0 || worksheetCompleted) && !isFullyCompleted && (
            <div className="mt-3 space-y-2">
              {/* Overall Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-3 text-xs">
                <span className={`flex items-center gap-1 ${videoCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {videoCompleted ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Video className="h-3 w-3" />
                  )}
                  Video
                </span>
                <span className={`flex items-center gap-1 ${worksheetCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {worksheetCompleted ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  Worksheet
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
