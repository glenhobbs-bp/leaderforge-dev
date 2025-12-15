/**
 * File: src/components/content/content-card.tsx
 * Purpose: Content item card with 4-step progress indicators
 * Owner: Core Team
 * 
 * 4-Step Visual Layout:
 * ┌─────────────────────────┐
 * │ [Video 30%]       [🎯] │  ← Top: Video+progress, Bold Action goal
 * │                        │
 * │      [Progress/✓]      │  ← Center: Overall progress or complete
 * │                        │
 * │ [Check-in]             │  ← Bottom left: Check-in status
 * │        [17:21]         │  ← Duration (bottom center)
 * └─────────────────────────┘
 * 
 * Top-left (Video) badge states:
 * - "▶ Video" (blue) - not started
 * - "▶ Video 30%" (amber) - in progress
 * - "✓ Video" (green) - complete
 * 
 * Top-right (Bold Action Goal) badge states:
 * - 🎯 (grey/muted) - bold action not complete
 * - 🎯 (green) - bold action complete
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Play, FileText, ExternalLink, CheckCircle, 
  Handshake, Target, CalendarCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentCardProps {
  item: ContentItem;
  videoProgress?: number;
  videoCompleted?: boolean;
  worksheetCompleted?: boolean;
  checkinStatus?: 'none' | 'pending' | 'scheduled' | 'completed';
  boldActionStatus?: 'none' | 'pending' | 'completed' | 'signed_off';
}

export function ContentCard({ 
  item, 
  videoProgress = 0, 
  videoCompleted = false,
  worksheetCompleted = false,
  checkinStatus = 'none',
  boldActionStatus = 'none',
}: ContentCardProps) {
  const typeIcon = {
    video: Play,
    document: FileText,
    link: ExternalLink,
  };
  const Icon = typeIcon[item.type];

  // Calculate 4-step completion
  const step1Complete = videoCompleted;
  const step2Complete = worksheetCompleted;
  const step3Complete = checkinStatus === 'completed';
  // Step 4 is complete if bold action is 'completed' OR 'signed_off'
  const step4Complete = boldActionStatus === 'completed' || boldActionStatus === 'signed_off';
  
  const completedSteps = [step1Complete, step2Complete, step3Complete, step4Complete].filter(Boolean).length;
  const overallProgress = (completedSteps / 4) * 100;
  const isFullyCompleted = completedSteps === 4;
  const isInProgress = completedSteps > 0 && !isFullyCompleted;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Status badge colors and icons
  const getStepBadge = (
    complete: boolean, 
    inProgress: boolean, 
    icon: React.ReactNode, 
    label: string,
    position: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    const positionClasses = {
      tl: 'top-2 left-2',
      tr: 'top-2 right-2',
      bl: 'bottom-2 left-2',
      br: 'bottom-8 right-2', // Leave room for duration
    };

    if (complete) {
      return (
        <div className={`absolute ${positionClasses[position]} px-2 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1`}>
          <CheckCircle className="h-3 w-3" />
          {label}
        </div>
      );
    }
    
    if (inProgress) {
      return (
        <div className={`absolute ${positionClasses[position]} px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1`}>
          {icon}
          {label}
        </div>
      );
    }

    return null;
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
          
          {/* Center overlay - Progress ring or completion check */}
          {isFullyCompleted ? (
            // Fully completed - big green check
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : isInProgress ? (
            // In progress - show progress ring
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="relative w-14 h-14">
                {/* Background ring */}
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="transparent"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeDasharray={`${overallProgress * 1.5} 150`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">{completedSteps}/4</span>
                </div>
              </div>
            </div>
          ) : (
            // Not started - play overlay on hover
            item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
                </div>
              </div>
            )
          )}

          {/* TOP LEFT - Video badge with progress */}
          <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded capitalize flex items-center gap-1 ${
            step1Complete 
              ? 'bg-green-500 text-white' 
              : videoProgress > 0
                ? 'bg-amber-500 text-white'
                : 'bg-primary text-primary-foreground'
          }`}>
            {step1Complete ? (
              <>
                <CheckCircle className="h-3 w-3" />
                {item.type}
              </>
            ) : videoProgress > 0 ? (
              <>
                <Icon className="h-3 w-3" />
                {item.type} {Math.round(videoProgress)}%
              </>
            ) : (
              <>
                <Icon className="h-3 w-3" />
                {item.type}
              </>
            )}
          </div>

          {/* TOP RIGHT - Bold Action (Goal) status */}
          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
            step4Complete 
              ? 'bg-green-500 text-white' 
              : 'bg-white/90 text-muted-foreground'
          }`}>
            <Target className={`h-3 w-3 ${step4Complete ? '' : 'text-muted-foreground'}`} />
          </div>

          {/* BOTTOM LEFT - Check-in status */}
          {checkinStatus === 'completed' ? (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1">
              <Handshake className="h-3 w-3" />
              Met
            </div>
          ) : checkinStatus === 'scheduled' ? (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" />
              Scheduled
            </div>
          ) : checkinStatus === 'pending' ? (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" />
              Requested
            </div>
          ) : null}

          {/* Duration badge - bottom center */}
          {item.duration && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/75 text-white text-xs font-medium rounded">
              {formatDuration(item.duration)}
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

          {/* 4-Step Progress indicators (below title) */}
          {isInProgress && (
            <div className="mt-3 flex items-center gap-1">
              {/* Step 1: Video */}
              <div className={`flex-1 h-1.5 rounded-full ${step1Complete ? 'bg-green-500' : 'bg-muted'}`} title="Video" />
              {/* Step 2: Worksheet */}
              <div className={`flex-1 h-1.5 rounded-full ${step2Complete ? 'bg-green-500' : 'bg-muted'}`} title="Worksheet" />
              {/* Step 3: Check-in */}
              <div className={`flex-1 h-1.5 rounded-full ${step3Complete ? 'bg-green-500' : checkinStatus !== 'none' ? 'bg-amber-400' : 'bg-muted'}`} title="Check-in" />
              {/* Step 4: Bold Action */}
              <div className={`flex-1 h-1.5 rounded-full ${step4Complete ? 'bg-green-500' : boldActionStatus !== 'none' ? 'bg-amber-400' : 'bg-muted'}`} title="Bold Action" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
