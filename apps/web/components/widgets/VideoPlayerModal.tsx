/**
 * VideoPlayerModal.tsx
 * Purpose: Advanced video player modal widget with HLS support, progress tracking, and platform compatibility
 * Owner: Component System
 * Tags: #widget #video #modal #hls #progress #platform-agnostic
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import Hls from 'hls.js';
import { useUniversalProgress } from '../../app/hooks/useUniversalProgress';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

// CardAction interface from agent-core types
interface CardAction {
  label: string;
  action: string;
  [key: string]: unknown;
}

interface VideoPlayerModalProps {
  schema: ComponentSchema;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userId?: string;
  onProgressUpdate?: () => void;
}

export function VideoPlayerModal({
  schema,
  open = true,
  onOpenChange = () => {},
  userId,
  onProgressUpdate
}: VideoPlayerModalProps) {
  // Type guard to ensure we have a VideoPlayer schema
  if (schema.type !== 'VideoPlayer') {
    return null;
  }

  // Extract props from schema
  const {
    videoUrl,
    title,
    poster,
    progress,
    pills,
    videoWatched,
    worksheetSubmitted,
    onCompleteAction,
    description,
  } = schema.props;

  // Video player state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localProgress, setLocalProgress] = useState(progress || 0);

  // Refs for video element and HLS instance
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressUpdateTimeoutRef = useRef<number | null>(null);
  const lastSavedProgressRef = useRef<number>(0);

  // Universal Progress API integration
  const { trackVideoProgress } = useUniversalProgress({
    userId: userId || '',
    contextKey: 'training', // Default context for video content
    onProgressUpdate: (progress) => {
      console.log('[VideoPlayerModal] Progress updated from API:', progress);
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    },
    onError: (error) => {
      console.error('[VideoPlayerModal] Progress API error:', error);
    }
  });

  // Progress saving with debouncing (save every 3 seconds minimum)
  const saveProgressToAPI = useCallback(async (currentTime: number, duration: number) => {
    if (!title || !userId) return;

    const progressPercent = (currentTime / duration) * 100;

    // Only save if progress has changed significantly (more than 2%) and it's been at least 3 seconds
    if (Math.abs(progressPercent - lastSavedProgressRef.current) > 2) {
      try {
        await trackVideoProgress(title, currentTime, currentTime, duration);
        lastSavedProgressRef.current = progressPercent;
        console.log(`[VideoPlayerModal] Progress saved: ${Math.round(progressPercent)}% for ${title}`);
      } catch (error) {
        console.error('[VideoPlayerModal] Failed to save progress:', error);
      }
    }
  }, [title, userId, trackVideoProgress]);

  // Video event handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTimeVal = videoRef.current.currentTime;
      const durationVal = videoRef.current.duration;

      setCurrentTime(currentTimeVal);
      const newProgress = (currentTimeVal / durationVal) * 100;
      setLocalProgress(newProgress);

      // Debounced progress saving
      if (progressUpdateTimeoutRef.current) {
        window.clearTimeout(progressUpdateTimeoutRef.current);
      }

      progressUpdateTimeoutRef.current = window.setTimeout(() => {
        saveProgressToAPI(currentTimeVal, durationVal);
      }, 3000); // Save progress after 3 seconds of no updates
    }
  };
  const handleError = () => {
    setError('Video failed to load');
    setIsLoading(false);
  };

  // Handle video completion
  const handleVideoEnd = useCallback(async () => {
    if (videoRef.current && title && userId) {
      try {
        const duration = videoRef.current.duration;
        // Save 100% completion
        await trackVideoProgress(title, duration, duration, duration);
        setLocalProgress(100);

        // Trigger completion action if available
        if (onCompleteAction) {
          console.log('[VideoPlayerModal] Video completed, triggering action:', onCompleteAction);
        }
      } catch (error) {
        console.error('[VideoPlayerModal] Failed to save completion:', error);
      }
    }
  }, [title, userId, trackVideoProgress, onCompleteAction]);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setIsLoading(true);
    setError(null);

    // Check if HLS is supported and needed
    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          setError('HLS stream failed to load');
          setIsLoading(false);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = videoUrl;
      } else {
        setError('HLS not supported in this browser');
        setIsLoading(false);
      }
    } else {
      // Regular video file
      video.src = videoUrl;
    }

    // Set initial time based on progress
    if (progress && progress > 0) {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = (progress / 100) * video.duration;
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (progressUpdateTimeoutRef.current) {
        window.clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, [videoUrl, progress]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-blue-800">🎥 VideoPlayerModal Widget</h3>
        <p className="text-sm text-blue-600">This is a working video player widget</p>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl w-full p-0 rounded-xl overflow-hidden">
          <div className="border border-[var(--bg-neutral)]/30 rounded-xl overflow-hidden" style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.15)' }}>
            <DialogTitle className="sr-only">{title || 'Video Player'}</DialogTitle>
            <DialogDescription className="sr-only">
              {description || (title ? `Watch ${title}` : 'Video player')}
            </DialogDescription>

            <div className="aspect-video w-full bg-black rounded-t-xl overflow-hidden relative">
              {/* Video element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster={poster}
                controls
                onPlay={handlePlay}
                onPause={handlePause}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onError={handleError}
                onEnded={handleVideoEnd}
                preload="metadata"
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <div>Loading video...</div>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-red-400 mb-2">⚠️ Error</div>
                    <div className="text-sm">{error}</div>
                    <button
                      onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-[var(--card-bg)] flex flex-col gap-3 rounded-b-xl">
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}

              {/* Progress and status indicators */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Progress: {Math.round(localProgress)}%</span>
                  <span className={videoWatched ? 'text-green-600' : 'text-gray-500'}>
                    {videoWatched ? '✅ Watched' : '⏸️ Not Watched'}
                  </span>
                </div>

                {/* Real-time progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, localProgress))}%` }}
                  />
                </div>

                {worksheetSubmitted !== undefined && (
                  <div className="flex justify-between">
                    <span>Worksheet Status:</span>
                    <span className={worksheetSubmitted ? 'text-green-600' : 'text-gray-500'}>
                      {worksheetSubmitted ? '✅ Submitted' : '📝 Not Submitted'}
                    </span>
                  </div>
                )}

                {pills && pills.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {pills.map((pill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: pill.color || '#gray',
                          color: 'white'
                        }}
                      >
                        {pill.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug info outside modal for testing */}
      <div className="mt-4 p-3 bg-white rounded border text-xs text-gray-600">
        <div><strong>Widget State:</strong> Loading: {isLoading ? 'Yes' : 'No'} | Progress: {Math.round(localProgress)}%</div>
        <div><strong>URL:</strong> {videoUrl}</div>
        {error && <div className="text-red-600"><strong>Error:</strong> {error}</div>}
        <div><strong>Playing:</strong> {isPlaying ? 'Yes' : 'No'} | <strong>Time:</strong> {Math.round(currentTime)}s / {Math.round(duration)}s</div>
      </div>
    </div>
  );
}