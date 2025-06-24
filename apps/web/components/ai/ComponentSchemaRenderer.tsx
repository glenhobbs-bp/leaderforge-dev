/**
 * File: apps/web/components/ai/ComponentSchemaRenderer.tsx
 * Purpose: Primary component renderer for agent-generated UI schemas.
 * Handles all component types including Cards, Grids, VideoPlayer modals, and interactive elements.
 * Features: HLS video support, modal player, progress tracking, responsive design.
 * Used by: Agent context API responses, dynamic content rendering
 */
"use client";

import { ComponentSchema, CardAction } from "../../../../packages/agent-core/types/ComponentSchema";
import Image from "next/image";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import Hls from "hls.js";
import React from "react";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useUniversalProgress } from "../../app/hooks/useUniversalProgress";
import { WidgetDispatcher, isWidgetTypeAvailable } from "../widgets";

// Extracted Card component to use hooks properly
function CardComponent({ schema, onAction }: {
  schema: ComponentSchema;
  onAction: (action: CardAction) => void;
}) {
  // Type guard to ensure we have a Card schema
  if (schema.type !== 'Card') {
    return null;
  }

  const {
    image,
    featuredImage,
    coverImage,
    imageUrl,
    videoUrl,
    publishedDate,
    title,
    subtitle,
    description,
    videoWatched,
    worksheetSubmitted,
    progress,
    actions,
    pills,
  } = schema.props;
  const cardImage = image || featuredImage || coverImage || imageUrl || "/icons/placeholder.png";

  // Use passed progress data (should come from server-side agent response)
  // TODO: Agent responses should include progress data fetched server-side
  const actualProgress = progress || 0;
  const actualVideoWatched = actualProgress >= 90 || videoWatched;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow border border-[var(--bg-neutral)] flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150">
      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden px-0 lg:px-4">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={false}
            onError={e => (e.currentTarget.src = '/icons/placeholder.png')}
          />
        ) : null}
        {videoUrl && (
          <button
            className="absolute inset-0 flex items-center justify-center z-10 group"
            onClick={() =>
              onAction(
                actions?.find(a => a.action === 'openVideoModal') ||
                { action: 'openVideoModal', label: 'Watch', videoUrl, title }
              )
            }
            style={{ background: 'rgba(0,0,0,0.2)' }}
            aria-label="Play video"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#fff" fillOpacity="0.7" />
              <polygon points="20,16 34,24 20,32" fill="#222" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col p-4 gap-2">
        <div className="flex flex-row items-center gap-2 mb-1">
          <span className="font-semibold text-base line-clamp-1">{title}</span>
          {pills && pills.length > 0 && (
            <div className="flex flex-row gap-1 ml-auto">
              {pills.map((pill, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={pill.color ? { background: pill.color } : {}}>
                  {pill.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</div>
        {/* Status indicators */}
        <div className="flex flex-row items-center gap-4 mb-2">
          <div className="flex items-center gap-1 text-xs">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill={actualVideoWatched ? '#22c55e' : '#d1d5db'} />
              {actualVideoWatched ? (
                <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span className={actualVideoWatched ? 'text-green-600' : 'text-gray-400'}>
              {actualProgress > 0 ? `${Math.round(actualProgress)}% watched` : 'Video Not Watched'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill={worksheetSubmitted ? '#22c55e' : '#d1d5db'} />
              {worksheetSubmitted ? (
                <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span className={worksheetSubmitted ? 'text-green-600' : 'text-gray-400'}>
              Worksheet {worksheetSubmitted ? 'Submitted' : 'Not Submitted'}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        {typeof actualProgress === 'number' && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${actualProgress}%`, background: actualProgress === 100 ? 'var(--accent)' : 'var(--primary)' }}
            />
          </div>
        )}
        {/* Action buttons */}
        <div className="flex flex-row gap-2 mt-auto">
          {actions && actions.map((action, i) => (
            <button
              key={i}
              onClick={() => onAction(action)}
              className={
                `px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 shadow-sm ` +
                (action.label.toLowerCase().includes('watch')
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--secondary)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]')
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComponentSchemaRenderer({ schema, userId, onProgressUpdate }: {
  schema: ComponentSchema;
  userId?: string;
  onProgressUpdate?: () => void;
}) {
  // Debug: log the received schema
  console.log("[ComponentSchemaRenderer] schema:", schema);

  // Modal state for VideoPlayer
  const [videoModal, setVideoModal] = useState<null | {
    videoUrl: string;
    title?: string;
    poster?: string;
    progress?: number;
    pills?: { label: string; color?: string }[];
    videoWatched?: boolean;
    worksheetSubmitted?: boolean;
    onCompleteAction?: CardAction;
    description?: string;
  }>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to open modal from Card actions
  const handleAction = (action: CardAction) => {
    console.log('[handleAction] Called with action:', action);
    if (action.action === "openVideoModal" && 'videoUrl' in action) {
      console.log('[handleAction] Setting video modal state');
      setVideoModal({
        videoUrl: action.videoUrl,
        title: action.title,
        poster: action.poster,
        progress: action.progress,
        pills: action.pills,
        videoWatched: action.videoWatched,
        worksheetSubmitted: action.worksheetSubmitted,
        onCompleteAction: action.onCompleteAction,
        description: action.description,
      });
    } else {
      // Handle other actions as needed
      console.log('[handleAction] Non-modal action:', action.action);
      alert(`Action: ${action.action}`);
    }
  };

  // Progress update handler (if needed)
  async function handleProgressUpdate(contentId: string, progress: number) {
    setLoading(true);
    setError(null);
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
      const contextKey = (typeof window !== 'undefined' && localStorage.getItem('contextKey')) || '';
      const resp = await fetch('/api/agent/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contextKey,
          intent: {
            type: 'updateProgress',
            contentId,
            progress,
          },
        }),
      });
      if (!resp.ok) {
        setError('Server error. Please try again later.');
        setLoading(false);
        return;
      }
      let newSchema;
      try {
        newSchema = await resp.json();
      } catch {
        setError('Unexpected server response. Please try again later.');
        setLoading(false);
        return;
      }
      // Instead of setCurrentSchema, trigger a re-render by calling a callback or lifting state if needed
      // For now, just reload the page or let parent handle schema update
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to try fallback video URLs
  function tryFallbackUrls(videoElement: HTMLVideoElement, urls: string[], index: number) {
    if (index >= urls.length) {
      // All fallbacks failed
      console.error('All video fallback URLs failed');
      return;
    }

    const currentUrl = urls[index];
    console.log(`Trying fallback URL ${index + 1}/${urls.length}:`, currentUrl);

    videoElement.onerror = () => {
      console.error(`Fallback URL ${index + 1} failed:`, currentUrl);
      // Try next URL
      tryFallbackUrls(videoElement, urls, index + 1);
    };

    videoElement.onloadstart = () => {
      console.log(`Fallback URL ${index + 1} started loading:`, currentUrl);
    };

    videoElement.src = currentUrl;
  }

  function VideoPlayerModal({
    open,
    onOpenChange,
    videoUrl,
    title,
    poster,
    progress,
    pills,
    videoWatched,
    worksheetSubmitted,
    onCompleteAction,
    description,
    contentId,
    userId: propUserId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    videoUrl: string;
    title?: string;
    poster?: string;
    progress?: number;
    pills?: { label: string; color?: string }[];
    videoWatched?: boolean;
    worksheetSubmitted?: boolean;
    onCompleteAction?: CardAction;
    description?: string;
    contentId?: string;
    userId?: string;
  }) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hlsUsed, setHlsUsed] = useState(false);
    const [canPlayHlsNatively, setCanPlayHlsNatively] = useState<string | null>(null);
    const [currentProgress, setCurrentProgress] = useState(progress || 0);
    const [isWatched, setIsWatched] = useState(videoWatched || false);
    const [lastSavedTime, setLastSavedTime] = useState(0);
    const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);

    const progressUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
    const pendingProgressRequests = useRef<Map<string, Promise<any>>>(new Map());


    const actualUserId = propUserId || userId;
    const actualContentId = contentId || title || 'unknown';

    // Debug logging for userId resolution
    console.log('[Video Progress] User ID Debug:', {
      propUserId,
      userId,
      actualUserId,
      actualContentId
    });

    // Universal Progress Hook
    const { trackVideoProgress, getProgress } = useUniversalProgress({
      userId: actualUserId || '',
      contextKey: 'leaderforge',
      onProgressUpdate: (progressData) => {
        setCurrentProgress(progressData.progress_percentage || 0);
        // Check if video should be marked as watched (agent-configurable threshold)
        // Default to 90% if no agent parameters available
        const completionThreshold = 90; // TODO: Get from agent parameters
        if (progressData.progress_percentage >= completionThreshold) {
          setIsWatched(true);
        }
      },
      onError: (error) => {
        console.error('Progress tracking error:', error);
      }
    });

        // Cached progress getter to prevent excessive API calls with request deduplication
    const getCachedProgress = useCallback(async (contentId: string) => {
      const cacheKey = `${actualUserId}-${contentId}`;

      // Return cached result if available and recent (within 30 seconds)
      const cached = progressCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.data;
      }

      // Check if request is already in progress
      if (pendingProgressRequests.current.has(cacheKey)) {
        return pendingProgressRequests.current.get(cacheKey)!;
      }

      // Create new request and cache the promise
      const requestPromise = (async () => {
        try {
          const progressData = await getProgress(contentId);
          progressCache.current.set(cacheKey, {
            data: progressData,
            timestamp: Date.now()
          });
          return progressData;
        } catch (error) {
          console.error('Error fetching progress:', error);
          return null;
        } finally {
          // Clean up the pending request
          pendingProgressRequests.current.delete(cacheKey);
        }
      })();

      // Store the promise to prevent duplicate requests
      pendingProgressRequests.current.set(cacheKey, requestPromise);
      return requestPromise;
    }, [actualUserId, getProgress]);

    // Load initial progress when modal opens (only once)
    useEffect(() => {
      if (open && actualUserId && actualContentId && !hasLoadedInitialProgress) {
        setHasLoadedInitialProgress(true);
        getCachedProgress(actualContentId).then((progressData) => {
          if (progressData) {
            setCurrentProgress(progressData.progress_percentage || 0);
            setIsWatched(progressData.progress_percentage >= 90); // Default threshold
          }
        });
      }
    }, [open, actualUserId, actualContentId, hasLoadedInitialProgress, getCachedProgress]);

    // Reset progress loading state when modal closes
    useEffect(() => {
      if (!open) {
        setHasLoadedInitialProgress(false);
        // Clear any pending requests
        pendingProgressRequests.current.clear();
      }
    }, [open]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        pendingProgressRequests.current.clear();
        if (progressUpdateTimeoutRef.current) {
          window.clearTimeout(progressUpdateTimeoutRef.current);
        }
      };
    }, []);





    // Ensure video URL has CDN prefix if it's a relative path
    const fullVideoUrl = useMemo(() => {
      if (!videoUrl) return null;
      if (videoUrl.startsWith('http')) return videoUrl;
      return `https://cdn.tribesocial.io/${videoUrl}`;
    }, [videoUrl]);

    // Helper to detect Safari
    function isSafari() {
      if (typeof window === 'undefined') return false;
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }



    // Simple ref for video element
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Effect to handle video setup - runs when video element or URL changes
    useEffect(() => {
      // Add a small delay to ensure the video element is mounted
      const timeoutId = setTimeout(() => {
        const node = videoRef.current;
        if (!node || !fullVideoUrl) {
          console.log('[Video Progress] No video element or URL available');
          return;
        }

        console.log('[Video Progress] Setting up video for URL:', fullVideoUrl);

        setIsLoading(true);
        setError(null);
        setHlsUsed(false);
        setCanPlayHlsNatively(null);

        const handleError = (e: ErrorEvent) => {
          console.error('Video error:', e);
          setError('Failed to load video. Please try again later.');
          setIsLoading(false);
        };

        const handleCanPlay = () => {
          setIsLoading(false);
        };

        const handlePlay = () => {
          console.log('[Video Progress] Video started playing');
        };

        const handlePause = () => {
          console.log('[Video Progress] Video paused');
        };

        // Define event handlers inside the effect to avoid dependency issues
        const handleTimeUpdateLocal = () => {
          if (!node) return;
          const currentTime = node.currentTime;
          const duration = node.duration;

          if (!duration || isNaN(duration) || duration <= 0) {
            console.log(`[Video Progress] handleTimeUpdate: waiting for duration (current: ${duration})`);
            return;
          }

          console.log(`[Video Progress] handleTimeUpdate: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
          const progressPercentage = Math.round((currentTime / duration) * 100);
          setCurrentProgress(progressPercentage);

          if (progressPercentage >= 90 && !isWatched) {
            console.log('[Video Progress] Marking as watched (>90%)');
            setIsWatched(true);
          }

          // Update progress in database - simplified inline version
          if (actualUserId && actualContentId && duration) {
            const timeDiff = Math.abs(currentTime - lastSavedTime);
            console.log(`[Video Progress] DB Check: userId=${actualUserId}, contentId=${actualContentId}, timeDiff=${timeDiff.toFixed(1)}s, lastSaved=${lastSavedTime}s`);

            if (timeDiff >= 3) {
              console.log('[Video Progress] Time diff >= 3s, scheduling database save...');

              if (progressUpdateTimeoutRef.current) {
                console.log('[Video Progress] Clearing existing timeout');
                window.clearTimeout(progressUpdateTimeoutRef.current);
              }

              progressUpdateTimeoutRef.current = setTimeout(async () => {
                try {
                  const progressPercentage = Math.round((currentTime / duration) * 100);
                  console.log(`[Video Progress] Tracking progress: ${currentTime}s / ${duration}s (${progressPercentage}%)`);
                  const result = await trackVideoProgress(actualContentId, currentTime, currentTime, duration);
                  console.log('[Video Progress] Successfully tracked:', result);

                  if (result?.progress_percentage !== undefined) {
                    setCurrentProgress(result.progress_percentage);
                  }
                  setLastSavedTime(currentTime);
                } catch (error) {
                  console.error('[Video Progress] Failed to track progress:', error);
                }
              }, 1000);
            } else {
              console.log(`[Video Progress] Skipping save - time diff ${timeDiff.toFixed(1)}s < 3s threshold`);
            }
          } else {
            console.log('[Video Progress] Skipping save - missing requirements:', { actualUserId, actualContentId, duration });
          }
        };

        const handleLoadedMetadataLocal = async () => {
          if (!node) return;
          console.log(`[Video Progress] loadedmetadata: duration=${node.duration}s, videoWidth=${node.videoWidth}, videoHeight=${node.videoHeight}`);
          console.log(`[Video Progress] Video ready - currentTime=${node.currentTime}s, paused=${node.paused}`);

          // Try to get the cached progress data or fetch it
          try {
            const progressData = await getCachedProgress(actualContentId);
            if (progressData?.metadata?.lastPositionSeconds) {
              const savedPosition = Number(progressData.metadata.lastPositionSeconds);
              const resumePosition = Math.max(0, savedPosition - 10);
              console.log(`[Video Progress] Resuming from saved position: ${savedPosition}s, adjusted to: ${resumePosition}s`);
              node.currentTime = resumePosition;
            } else {
              console.log('[Video Progress] No saved position found, starting from beginning');
            }
          } catch (error) {
            console.error('[Video Progress] Error loading saved position:', error);
          }
        };

        const handleVideoEndLocal = async () => {
          if (actualUserId && actualContentId && node) {
            try {
              console.log('[Video Progress] Video ended, marking as complete');
              const result = await trackVideoProgress(actualContentId, node.duration, node.duration, node.duration);
              console.log('[Video Progress] Video completion tracked:', result);
              setCurrentProgress(100);
              setIsWatched(true);
            } catch (error) {
              console.error('[Video Progress] Failed to track video completion:', error);
            }
          }
        };

        // Add progress tracking event listeners
        node.addEventListener('error', handleError as any);
        node.addEventListener('canplay', handleCanPlay);
        node.addEventListener('play', handlePlay);
        node.addEventListener('pause', handlePause);
        node.addEventListener('timeupdate', handleTimeUpdateLocal);
        node.addEventListener('loadedmetadata', handleLoadedMetadataLocal as EventListener);
        node.addEventListener('ended', handleVideoEndLocal);

        console.log('[Video Progress] Event listeners attached to video element');

        // Debug: canPlayType for HLS
        const canPlay = node.canPlayType('application/vnd.apple.mpegurl');
        setCanPlayHlsNatively(canPlay);

        // Variable to hold HLS instance for cleanup
        let hls: any = null;

        // Handle HLS streams
        if (fullVideoUrl.endsWith('.m3u8')) {
          if (isSafari() && canPlay) {
            // Use native playback for Safari
            node.src = fullVideoUrl;
          } else if (Hls.isSupported()) {
            setHlsUsed(true);
            hls = new Hls({
              debug: false,
              lowLatencyMode: false,
              backBufferLength: 90,
            });

            hls.loadSource(fullVideoUrl);
            hls.attachMedia(node);
            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              // Only handle fatal errors that require fallback
              if (data?.fatal) {
                console.error('Fatal HLS error:', data?.details, data?.error);

                // Clean up current HLS instance safely
                try {
                  hls.destroy();
                } catch (e) {
                  console.warn('Error destroying HLS instance during error handling:', e);
                }

                // Try fallback strategies
                const baseUrl = fullVideoUrl.replace('/index.m3u8', '');
                const fallbackUrls = [
                  `${baseUrl}/index.mp4`,
                  `${baseUrl}.mp4`,
                  fullVideoUrl.replace('.m3u8', '.mp4'),
                  `${baseUrl}/video.mp4`
                ];

                console.log('Trying fallback URLs:', fallbackUrls);
                tryFallbackUrls(node, fallbackUrls, 0);
              }
              // Silently ignore non-fatal errors like bufferSeekOverHole, bufferAppendError
            });
          } else {
            setError('Your browser does not support HLS video playback.');
            setIsLoading(false);
          }
        } else {
          // For MP4 and other direct video formats
          node.src = fullVideoUrl;
        }

        // Store cleanup function for the timeout
        (node as any)._cleanupTimeout = () => {
          console.log('[Video Progress] Cleaning up video setup');
          node.removeEventListener('error', handleError as any);
          node.removeEventListener('canplay', handleCanPlay);
          node.removeEventListener('play', handlePlay);
          node.removeEventListener('pause', handlePause);
          node.removeEventListener('timeupdate', handleTimeUpdateLocal);
          node.removeEventListener('loadedmetadata', handleLoadedMetadataLocal);
          node.removeEventListener('ended', handleVideoEndLocal);

          if (hls) {
            try {
              hls.destroy();
            } catch (e) {
              console.warn('Error destroying HLS instance:', e);
            }
          }
        };
      }, 100); // Small delay to ensure video element is mounted

      // Cleanup function for the effect
      return () => {
        window.clearTimeout(timeoutId);
        const node = videoRef.current;
        if (node && (node as any)._cleanupTimeout) {
          (node as any)._cleanupTimeout();
        }
      };
    }, [fullVideoUrl]);

    // Cleanup on unmount or modal close
    useEffect(() => {
      return () => {
        // Clean up progress timeout
        if (progressUpdateTimeoutRef.current) {
          window.clearTimeout(progressUpdateTimeoutRef.current);
        }
      };
    }, []);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl w-full p-0 rounded-xl overflow-hidden">
          <div className="border border-[var(--bg-neutral)]/30 rounded-xl overflow-hidden" style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.15)' }}>
            <DialogTitle className="sr-only">{title || 'Video Player'}</DialogTitle>
            <DialogDescription className="sr-only">
              {description || (title ? `Watch ${title}` : 'Video player')}
            </DialogDescription>

            <div className="aspect-video w-full bg-black rounded-t-xl overflow-hidden relative">
              {/* Always render the video element to prevent unmounting */}
              {fullVideoUrl && (
                <video
                  key={`video-${contentId}-${fullVideoUrl}`}
                  ref={videoRef}
                  poster={poster || undefined}
                  controls
                  className="w-full h-full object-cover"
                  playsInline
                >
                  {!fullVideoUrl.endsWith('.m3u8') && (
                    <source src={fullVideoUrl} type="video/mp4" />
                  )}
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white"></div>
                </div>
              )}

              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-6 z-20">
                  <p className="text-red-300 mb-4 text-center">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      // Reload the video
                      if (videoRef.current && fullVideoUrl) {
                        videoRef.current.load();
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 bg-[var(--card-bg)] flex flex-col gap-3 rounded-b-xl">
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
              {pills && pills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {pills.map((pill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: pill.color || '#e0e7ef', color: '#222' }}>{pill.label}</span>
                  ))}
                </div>
              )}
              {/* Real-time progress bar */}
              <div className="w-full bg-[var(--bg-neutral)] rounded-full h-2 mb-3">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <div className="flex flex-row gap-2 items-center mt-2">
                <span className={`flex items-center gap-1 text-xs font-medium ${isWatched ? 'text-green-600' : 'text-gray-400'}`}>
                  {isWatched ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#e6f9ed"/><path d="M5 9.5l2.5 2.5L13 7.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#f3f4f6"/><path d="M9 5v4l2.5 2.5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                  {isWatched ? 'Watched' : `${currentProgress}% Complete`}
                </span>
                {worksheetSubmitted !== undefined && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${worksheetSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {worksheetSubmitted ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#fef9c3"/><path d="M5 9.5l2.5 2.5L13 7.5" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#fef9c3"/><path d="M9 5v4l2.5 2.5" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {worksheetSubmitted ? 'Worksheet Submitted' : 'Worksheet Not Submitted'}
                  </span>
                )}
              </div>
              {onCompleteAction && (
                <button
                  className="mt-2 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs hover:bg-[var(--secondary)] transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={async () => {
                    if (onCompleteAction.action && onCompleteAction.contentId) {
                      await handleProgressUpdate(onCompleteAction.contentId, onCompleteAction.progress || { progress_percentage: 100, completed_at: new Date().toISOString() });
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : onCompleteAction.label}
                </button>
              )}
              {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // User-friendly error UI
  function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-2" />
        <div className="text-lg font-semibold text-red-600 mb-1">No content available</div>
        <div className="text-gray-700 mb-3">{message}</div>
        {onRetry && (
          <button
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--secondary)] transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // If error at top level, show error UI
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }
  if (!schema || typeof schema !== 'object' || !schema.type) {
    return <ErrorMessage message="Unable to load content. Please try again later." onRetry={() => window.location.reload()} />;
  }

  switch (schema.type) {
    case "Panel":
      // Use WidgetDispatcher for extracted widgets
      if (isWidgetTypeAvailable(schema.type)) {
        return <WidgetDispatcher
          schema={schema}
          userId={userId}
          onProgressUpdate={onProgressUpdate}
          ComponentSchemaRenderer={ComponentSchemaRenderer}
        />;
      }
      // Fallback to original implementation if widget not available
      return (
        <div>
          <h2>{schema.props.heading}</h2>
          {schema.props.description && <p>{schema.props.description}</p>}
          {schema.props.widgets &&
            schema.props.widgets.map((w, i) => (
              <ComponentSchemaRenderer key={i} schema={w} userId={userId} onProgressUpdate={onProgressUpdate} />
            ))}
        </div>
      );
    case "StatCard":
      // Use WidgetDispatcher for extracted widgets
      if (isWidgetTypeAvailable(schema.type)) {
        return <WidgetDispatcher schema={schema} userId={userId} />;
      }
      // Fallback to original implementation if widget not available
      return (
        <div className="rounded-lg shadow bg-white p-4 mb-4">
          <h3 className="font-semibold text-lg mb-1">{schema.props.title}</h3>
          <div className="text-2xl font-bold">{schema.props.value}</div>
          {schema.props.description && <p className="text-gray-500 text-sm mt-1">{schema.props.description}</p>}
        </div>
      );
    case "Leaderboard":
      // Use WidgetDispatcher for extracted widgets
      if (isWidgetTypeAvailable(schema.type)) {
        return <WidgetDispatcher schema={schema} userId={userId} />;
      }
      // Fallback to original implementation if widget not available
      return (
        <div className="rounded-lg shadow bg-white p-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">{schema.props.title}</h3>
          <ol className="list-decimal pl-5">
            {schema.props.items && schema.props.items.map((item, i) => (
              <li key={i} className="flex justify-between py-1">
                <span>{item.name}</span>
                <span className="font-mono">{item.score}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "VideoList":
      // Use WidgetDispatcher for extracted widgets
      if (isWidgetTypeAvailable(schema.type)) {
        return <WidgetDispatcher schema={schema} userId={userId} />;
      }
      // Fallback to original implementation if widget not available
      return (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">{schema.props.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {schema.props.videos.map((video, i) => (
              <div key={video.props.title + i} className="rounded-lg shadow bg-white p-4 flex flex-col items-center">
                <img
                  src={video.props.image}
                  alt={video.props.title}
                  className="w-full h-32 object-cover rounded mb-2"
                  onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                />
                <div className="font-medium text-center">{video.props.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "Grid":
      // Use WidgetDispatcher for extracted widgets
      if (isWidgetTypeAvailable(schema.type)) {
        return (
          <>
            <WidgetDispatcher
              schema={schema}
              userId={userId}
              onProgressUpdate={onProgressUpdate}
              ComponentSchemaRenderer={ComponentSchemaRenderer}
            />
            {/* Video Modal - Always rendered when videoModal state exists */}
            {videoModal && (
              <VideoPlayerModal
                open={!!videoModal}
                onOpenChange={(open) => {
                  if (!open) {
                    setVideoModal(null);
                    // Trigger content refresh when modal closes to update card progress
                    if (onProgressUpdate) {
                      console.log('[ComponentSchemaRenderer] Video modal closed, triggering progress update');
                      onProgressUpdate();
                    }
                  }
                }}
                videoUrl={videoModal.videoUrl}
                title={videoModal.title}
                poster={videoModal.poster}
                progress={videoModal.progress}
                pills={videoModal.pills}
                videoWatched={videoModal.videoWatched}
                worksheetSubmitted={videoModal.worksheetSubmitted}
                onCompleteAction={videoModal.onCompleteAction}
                description={videoModal.description}
                contentId={videoModal.title}
                userId={userId}
              />
            )}
          </>
        );
      }
      // Fallback to original implementation if widget not available
      return (
        <>
          <div className="max-w-screen-2xl mx-auto p-6">
            <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
              {schema.props.items.map((item, i) => (
                <ComponentSchemaRenderer key={i} schema={item} userId={userId} onProgressUpdate={onProgressUpdate} />
              ))}
            </div>
          </div>
          {/* Video Modal - Always rendered when videoModal state exists */}
          {videoModal && (
            <VideoPlayerModal
              open={!!videoModal}
              onOpenChange={(open) => {
                if (!open) {
                  setVideoModal(null);
                  // Trigger content refresh when modal closes to update card progress
                  if (onProgressUpdate) {
                    console.log('[ComponentSchemaRenderer] Video modal closed, triggering progress update');
                    onProgressUpdate();
                  }
                }
              }}
              videoUrl={videoModal.videoUrl}
              title={videoModal.title}
              poster={videoModal.poster}
              progress={videoModal.progress}
              pills={videoModal.pills}
              videoWatched={videoModal.videoWatched}
              worksheetSubmitted={videoModal.worksheetSubmitted}
              onCompleteAction={videoModal.onCompleteAction}
              description={videoModal.description}
              contentId={videoModal.title}
              userId={userId}
            />
          )}
        </>
      );
    case "Card": {
      return (
        <>
          <CardComponent schema={schema} onAction={handleAction} />
          {/* Video Modal - Always rendered when videoModal state exists */}
          {videoModal && (
            <VideoPlayerModal
              open={!!videoModal}
              onOpenChange={(open) => {
                if (!open) {
                  setVideoModal(null);
                  // Trigger content refresh when modal closes to update card progress
                  if (onProgressUpdate) {
                    console.log('[ComponentSchemaRenderer] Video modal closed, triggering progress update');
                    onProgressUpdate();
                  }
                }
              }}
              videoUrl={videoModal.videoUrl}
              title={videoModal.title}
              poster={videoModal.poster}
              progress={videoModal.progress}
              pills={videoModal.pills}
              videoWatched={videoModal.videoWatched}
              worksheetSubmitted={videoModal.worksheetSubmitted}
              onCompleteAction={videoModal.onCompleteAction}
              description={videoModal.description}
              contentId={videoModal.title}
              userId={userId}
            />
          )}
        </>
      );
    }
    case "VideoPlayer": {
      // This case is now only for direct VideoPlayer schema, not modal trigger
      const { videoUrl, title, poster, progress, pills, onCompleteAction, videoWatched, worksheetSubmitted } = schema.props;
      return (
        <div className="w-full max-w-2xl mx-auto">
          <VideoPlayerModal
            open={true}
            onOpenChange={() => {}}
            videoUrl={videoUrl}
            title={title}
            poster={poster}
            progress={progress}
            pills={pills}
            videoWatched={videoWatched}
            worksheetSubmitted={worksheetSubmitted}
            onCompleteAction={onCompleteAction}
            description={schema.props.description}
            contentId={title}
            userId={userId}
          />
        </div>
      );
            }
    default:
      return <ErrorMessage message={(schema as any)?.type ? `No content available for this section.` : `No content available for this section.`} />;
  }
}