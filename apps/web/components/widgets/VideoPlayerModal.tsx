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
    onCompleteAction,
    description,
  } = schema.props;

  // Remove this console.log that's causing spam on every render
  // Only log when component first mounts
  useEffect(() => {
    console.log('[VideoPlayerModal] Component mounted with props:', {
      videoUrl,
      title,
      poster,
      progress,
      hasProps: !!schema.props
    });
  }, []); // Empty dependency array - only runs on mount

  // Video player state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localProgress, setLocalProgress] = useState(progress || 0);

  // Modal positioning and sizing state
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({ width: 800, height: 450 });


  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Update local progress when schema progress changes
  useEffect(() => {
    if (progress !== undefined && progress !== localProgress) {
      setLocalProgress(progress);
      console.log('[VideoPlayerModal] Updated local progress from schema:', progress);
    }
  }, [progress]);

  // Refs for video element and HLS instance
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const saveProgressRef = useRef<typeof saveProgressToAPI>();

  // Universal Progress API integration
  const { trackVideoProgress } = useUniversalProgress({
    userId: userId || '',
    contextKey: 'leaderforge', // Use contextKey instead of tenantKey
    onProgressUpdate: (progress) => {
      console.log('[VideoPlayerModal] Progress saved to database:', progress);
      // Progress is being tracked and saved to database, but we don't trigger
      // content reloads here to prevent the modal from disappearing
    },
    onError: (error) => {
      console.error('[VideoPlayerModal] Progress API error:', error);
    }
  });

  // Simple progress saving - just save current position
  const saveProgressToAPI = useCallback(async (currentTime: number, duration: number) => {
    if (!title || !userId || !currentTime || !duration) {
      return;
    }

    const progressPercent = (currentTime / duration) * 100;

    try {
      await trackVideoProgress(title, currentTime, currentTime, duration);
      lastSavedProgressRef.current = progressPercent;
      console.log(`[VideoPlayerModal] Progress auto-saved: ${Math.round(progressPercent)}% at ${Math.round(currentTime)}s`);
    } catch (error) {
      console.error('[VideoPlayerModal] Failed to save progress:', error);
    }
  }, [title, userId, trackVideoProgress]);

  // Update the ref whenever the function changes
  saveProgressRef.current = saveProgressToAPI;

  // Mouse event handlers for dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - modalPosition.x, y: e.clientY - modalPosition.y });
  }, [modalPosition]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers for resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: modalSize.width,
      height: modalSize.height
    });
  }, [modalSize]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
        if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;

      // Maintain 16:9 aspect ratio
      const newWidth = Math.max(400, resizeStart.width + deltaX);
      const newHeight = (newWidth * 9) / 16;

      setModalSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Video event handlers
  const handlePlay = () => {
    console.log('[VideoPlayerModal] Video play event - setting isPlaying to true');
    setIsPlaying(true);
  };
  const handlePause = () => {
    console.log('[VideoPlayerModal] Video pause event - setting isPlaying to false');
    setIsPlaying(false);
          // Progress will be auto-saved by the 5-second interval
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);

      // Also check if video is already playing (in case events were missed)
      if (!videoRef.current.paused) {
        console.log('[VideoPlayerModal] Video is already playing on metadata load');
        setIsPlaying(true);
      }
    }
  };
    const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTimeVal = videoRef.current.currentTime;
      const durationVal = videoRef.current.duration;

      setCurrentTime(currentTimeVal);
      const newProgress = (currentTimeVal / durationVal) * 100;
      setLocalProgress(newProgress);

      // Ensure we detect playing state if time is updating
      if (!videoRef.current.paused && !isPlaying) {
        console.log('[VideoPlayerModal] Detected video playing via timeupdate - setting isPlaying to true');
        setIsPlaying(true);
      }
    }
  };
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('[VideoPlayerModal] Video element error occurred:', e);
    if (videoRef.current?.error) {
      const error = videoRef.current.error;
      console.error('[VideoPlayerModal] Video error details:', {
        code: error.code,
        message: error.message,
        MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
        MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED
      });

      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          setError('Video loading was aborted');
          break;
        case error.MEDIA_ERR_NETWORK:
          setError('Network error while loading video');
          break;
        case error.MEDIA_ERR_DECODE:
          setError('Video decoding error');
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setError('Video format not supported');
          break;
        default:
          setError(`Video error (code: ${error.code})`);
      }
    } else {
      setError('Video failed to load');
    }
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

        // Only trigger parent progress update on actual completion
        if (onProgressUpdate) {
          console.log('[VideoPlayerModal] Video completed, triggering parent progress update');
          onProgressUpdate();
        }
      } catch (error) {
        console.error('[VideoPlayerModal] Failed to save completion:', error);
      }
    }
  }, [title, userId, trackVideoProgress, onCompleteAction, onProgressUpdate]);

  // Save progress when modal closes - use separate effects for tracking and saving
  const prevOpenRef = useRef(open);

  useEffect(() => {
    // Update the ref for next time
    prevOpenRef.current = open;
  });

  useEffect(() => {
    // Only run when open changes to false (modal closing)
    if (!open && videoRef.current && title && userId) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (currentTime > 0 && duration > 0) {
        console.log('[VideoPlayerModal] Modal closing, progress was auto-saved by interval');
      }
    }
  }, [open, title, userId, saveProgressToAPI]);

  // Auto-save progress every 5 seconds while playing (industry standard)
  useEffect(() => {
    console.log('[VideoPlayerModal] Auto-save effect triggered:', {
      isPlaying,
      hasVideo: !!videoRef.current,
      title,
      userId,
      willStartInterval: isPlaying && !!videoRef.current && !!title && !!userId
    });

    if (!isPlaying || !videoRef.current || !title || !userId) {
      console.log('[VideoPlayerModal] Auto-save not starting - missing requirements');
      return;
    }

    console.log('[VideoPlayerModal] Starting auto-save interval (5 seconds)');
    const interval = window.setInterval(() => {
      console.log('[VideoPlayerModal] Auto-save interval triggered');
      if (videoRef.current && title && userId && saveProgressRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        console.log('[VideoPlayerModal] Auto-save checking:', { currentTime, duration });
        if (currentTime > 0 && duration > 0) {
          console.log('[VideoPlayerModal] Auto-saving progress...');
          saveProgressRef.current(currentTime, duration);
        } else {
          console.log('[VideoPlayerModal] Auto-save skipped - no valid time/duration');
        }
      } else {
        console.log('[VideoPlayerModal] Auto-save skipped - missing video/title/user/saveFunction');
      }
    }, 5000); // Save every 5 seconds (industry standard)

    return () => {
      console.log('[VideoPlayerModal] Clearing auto-save interval');
      window.clearInterval(interval);
    };
  }, [isPlaying, title, userId]); // Removed saveProgressToAPI dependency

  // Initialize video player
  useEffect(() => {
    const initializeVideo = () => {
      const video = videoRef.current;
      const testVideoUrl = videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Fallback test video

      if (!video) {
        console.log('[VideoPlayerModal] Video element not ready, retrying...');
        // Retry after a short delay
        setTimeout(initializeVideo, 100);
        return;
      }

      if (!testVideoUrl) {
        console.log('[VideoPlayerModal] No video URL available');
        setError('No video URL provided');
        setIsLoading(false);
        return;
      }

      console.log('[VideoPlayerModal] Initializing video player with URL:', testVideoUrl);
      setIsLoading(true);
      setError(null);

      // Check if HLS is supported and needed
      if (testVideoUrl.includes('.m3u8')) {
        console.log('[VideoPlayerModal] Detected HLS stream');
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(testVideoUrl);
          hls.attachMedia(video);
          hlsRef.current = hls;

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('[VideoPlayerModal] HLS error event:', event);
            console.error('[VideoPlayerModal] HLS error data:', data);

            // More detailed error handling based on error type
            if (data?.fatal) {
              console.error('[VideoPlayerModal] Fatal HLS error - cannot recover');
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                setError('Network error: Unable to load video stream');
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                setError('Media error: Video format not supported');
              } else {
                setError(`HLS error: ${data.details || 'Unknown streaming error'}`);
              }
              setIsLoading(false);
            } else {
              // Non-fatal error - try to recover
              console.warn('[VideoPlayerModal] Non-fatal HLS error, attempting recovery');
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('[VideoPlayerModal] HLS manifest parsed successfully');
            setIsLoading(false);
          });

          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log('[VideoPlayerModal] HLS media attached successfully');
          });

          hls.on(Hls.Events.FRAG_LOADED, () => {
            console.log('[VideoPlayerModal] HLS fragment loaded');
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          console.log('[VideoPlayerModal] Using native HLS support');
          video.src = testVideoUrl;
        } else {
          console.error('[VideoPlayerModal] HLS not supported in this browser');
          setError('HLS not supported in this browser');
          setIsLoading(false);
        }
      } else {
        // Regular video file
        console.log('[VideoPlayerModal] Using regular video file');
        video.src = testVideoUrl;
      }

      // Set initial time based on progress
      if (progress && progress > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = (progress / 100) * video.duration;
          console.log('[VideoPlayerModal] Set initial time to:', video.currentTime);
        }, { once: true });
      }
    };

    // Start initialization
    initializeVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
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
        <DialogContent className="max-w-4xl w-auto h-auto p-0 !bg-transparent border-[0.5px] border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <DialogTitle className="sr-only">{title || 'Video Player'}</DialogTitle>
            <DialogDescription className="sr-only">
              {description || (title ? `Watch ${title}` : 'Video player')}
            </DialogDescription>

            <div className="aspect-video w-full relative">

              {/* Video element */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain rounded-xl"
                poster={poster}
                controls
                onPlay={handlePlay}
                onPause={handlePause}
                onPlaying={() => {
                  console.log('[VideoPlayerModal] onPlaying event triggered');
                  if (!isPlaying) {
                    console.log('[VideoPlayerModal] onPlaying setting isPlaying to true');
                    setIsPlaying(true);
                  }
                }}
                onWaiting={() => {
                  console.log('[VideoPlayerModal] onWaiting event triggered');
                }}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onError={handleError}
                onEnded={handleVideoEnd}
                preload="metadata"
                playsInline
                crossOrigin="anonymous"
              />

              {/* Title overlay - only shows when paused */}
              {!isPlaying && !isLoading && !error && title && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                    <h3 className="text-white text-sm font-medium">{title}</h3>
                  </div>
                </div>
              )}

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
        </DialogContent>
        </Dialog>
    </div>
  );
}