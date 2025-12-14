/**
 * File: src/components/content/content-viewer.tsx
 * Purpose: Client-side content viewer with interactive video controls
 * Owner: Core Team
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Clock, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { VideoPlayer } from './video-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentViewerProps {
  content: ContentItem;
}

interface ProgressData {
  progress_percentage: number;
  completed_at: string | null;
  started_at: string | null;
}

export function ContentViewer({ content }: ContentViewerProps) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastSavedProgress = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(`/api/progress/${content.id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const data: ProgressData = result.data;
          setProgress(data.progress_percentage || 0);
          setIsCompleted(!!data.completed_at);
          lastSavedProgress.current = data.progress_percentage || 0;
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [content.id]);

  // Save progress to database (debounced)
  const saveProgress = useCallback(async (progressPercent: number, completed: boolean) => {
    // Only save if progress increased significantly (5% increments) or completed
    const shouldSave = 
      completed || 
      progressPercent >= 100 ||
      progressPercent - lastSavedProgress.current >= 5;

    if (!shouldSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/progress/${content.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercentage: progressPercent,
          completed,
        }),
      });

      if (response.ok) {
        lastSavedProgress.current = progressPercent;
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content.id]);

  // Debounced save
  const debouncedSave = useCallback((progressPercent: number, completed: boolean) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(progressPercent, completed);
    }, 1000); // Save after 1 second of no updates
  }, [saveProgress]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    debouncedSave(newProgress, newProgress >= 90);
  }, [debouncedSave]);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    // Save immediately on completion
    saveProgress(100, true);
  }, [saveProgress]);

  const handleStartLearning = () => {
    // Scroll to video and play
    const videoContainer = document.querySelector('video');
    if (videoContainer) {
      videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        videoContainer.play().catch(() => {
          // Autoplay might be blocked
        });
      }, 300);
    }
  };

  const getProgressText = () => {
    if (isCompleted) return 'Completed!';
    if (progress === 0) return 'Not started';
    return `${progress}% complete`;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Back navigation */}
      <div>
        <Link href="/content">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
      </div>

      {/* Video Player or Placeholder */}
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        {content.videoUrl ? (
          <VideoPlayer 
            src={content.videoUrl} 
            poster={content.thumbnailUrl || undefined}
            title={content.title}
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="text-center">
              <Play className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Video not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {content.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(content.duration)}
                </span>
              )}
              {content.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(content.publishedAt)}
                </span>
              )}
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded capitalize">
                {content.type}
              </span>
            </div>
          </div>

          {/* Description */}
          {content.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {content.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your Progress</h3>
                {isSaving && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {getProgressText()}
                    </p>
                    {content.videoUrl && (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartLearning}
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isCompleted ? 'Watch Again' : progress > 0 ? 'Continue' : 'Start Learning'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
