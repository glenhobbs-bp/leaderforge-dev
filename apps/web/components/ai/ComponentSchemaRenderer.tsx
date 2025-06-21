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

export function ComponentSchemaRenderer({ schema }: { schema: ComponentSchema }) {
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
    if (action.action === "openVideoModal" && (action as any).videoUrl) {
      setVideoModal({
        videoUrl: (action as any).videoUrl,
        title: (action as any).title,
        poster: (action as any).poster,
        progress: (action as any).progress,
        pills: (action as any).pills,
        videoWatched: (action as any).videoWatched,
        worksheetSubmitted: (action as any).worksheetSubmitted,
        onCompleteAction: (action as any).onCompleteAction,
        description: (action as any).description,
      });
    } else {
      // Handle other actions as needed
      alert(`Action: ${action.action}`);
    }
  };

  // Progress update handler (if needed)
  async function handleProgressUpdate(contentId: string, progress: any) {
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
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
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
  }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hlsUsed, setHlsUsed] = useState(false);
    const [canPlayHlsNatively, setCanPlayHlsNatively] = useState<string | null>(null);
    const videoElRef = useRef<HTMLVideoElement | null>(null);

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

    // Ref callback for video element
    const setVideoEl = useCallback((node: HTMLVideoElement | null) => {
      videoElRef.current = node;
      if (!node || !fullVideoUrl) return;

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

      node.addEventListener('error', handleError as any);
      node.addEventListener('canplay', handleCanPlay);

      // Debug: canPlayType for HLS
      const canPlay = node.canPlayType('application/vnd.apple.mpegurl');
      setCanPlayHlsNatively(canPlay);

      // Handle HLS streams
      if (fullVideoUrl.endsWith('.m3u8')) {
        if (isSafari() && canPlay) {
          // Use native playback for Safari only
          node.src = fullVideoUrl;
        } else if (Hls.isSupported()) {
          setHlsUsed(true);
          const hls = new Hls({
            xhrSetup: (xhr) => {
              xhr.withCredentials = false;
            },
          });
          hls.loadSource(fullVideoUrl);
          hls.attachMedia(node);
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('HLS error:', data);
              setError('Failed to load video stream. Please try again later.');
              setIsLoading(false);
            }
          });
          // Clean up on unmount
          (node as any)._hlsCleanup = () => hls.destroy();
        } else {
          setError('Your browser does not support HLS video playback.');
          setIsLoading(false);
        }
      } else {
        // For MP4 and other direct video formats
        node.src = fullVideoUrl;
      }
    }, [fullVideoUrl]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (videoElRef.current && typeof (videoElRef.current as any)._hlsCleanup === 'function') {
          (videoElRef.current as any)._hlsCleanup();
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
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white"></div>
                </div>
              )}

              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-6">
                  <p className="text-red-300 mb-4 text-center">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                fullVideoUrl && (
                  <video
                    ref={setVideoEl}
                    poster={poster || undefined}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                    playsInline
                    crossOrigin="anonymous"
                  >
                    {!fullVideoUrl.endsWith('.m3u8') && (
                      <source src={fullVideoUrl} type="video/mp4" />
                    )}
                    Your browser does not support the video tag.
                  </video>
                )
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
              {typeof progress === "number" && (
                <div className="w-full bg-[var(--bg-neutral)] rounded-full h-2 mb-3">
                  <div
                    className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <div className="flex flex-row gap-2 items-center mt-2">
                {videoWatched !== undefined && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${videoWatched ? 'text-green-600' : 'text-gray-400'}`}>
                    {videoWatched ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#e6f9ed"/><path d="M5 9.5l2.5 2.5L13 7.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#f3f4f6"/><path d="M9 5v4l2.5 2.5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {videoWatched ? 'Watched' : 'Not Watched'}
                  </span>
                )}
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
      return (
        <div>
          <h2>{schema.props.heading}</h2>
          {schema.props.description && <p>{schema.props.description}</p>}
          {schema.props.widgets &&
            schema.props.widgets.map((w, i) => (
              <ComponentSchemaRenderer key={i} schema={w} />
            ))}
        </div>
      );
    case "StatCard":
      return (
        <div className="rounded-lg shadow bg-white p-4 mb-4">
          <h3 className="font-semibold text-lg mb-1">{schema.props.title}</h3>
          <div className="text-2xl font-bold">{schema.props.value}</div>
          {schema.props.description && <p className="text-gray-500 text-sm mt-1">{schema.props.description}</p>}
        </div>
      );
    case "Leaderboard":
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
      return (
        <div className="max-w-screen-2xl mx-auto p-6">
          <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {schema.props.items.map((item, i) => (
              <ComponentSchemaRenderer key={i} schema={item} />
            ))}
          </div>
        </div>
      );
    case "Card": {
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
                  handleAction(
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
                  <circle cx="8" cy="8" r="8" fill={videoWatched ? '#22c55e' : '#d1d5db'} />
                  {videoWatched ? (
                    <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
                <span className={videoWatched ? 'text-green-600' : 'text-gray-400'}>
                  Video {videoWatched ? 'Watched' : 'Not Watched'}
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
            {typeof progress === 'number' && (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: progress === 100 ? 'var(--accent)' : 'var(--primary)' }}
                />
              </div>
            )}
            {/* Action buttons */}
            <div className="flex flex-row gap-2 mt-auto">
              {actions && actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(action)}
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
          {/* VideoPlayer modal trigger */}
          {videoModal && (
            <VideoPlayerModal
              open={!!videoModal}
              onOpenChange={open => setVideoModal(open ? videoModal : null)}
              videoUrl={videoModal.videoUrl}
              title={videoModal.title}
              poster={videoModal.poster}
              progress={videoModal.progress}
              pills={videoModal.pills}
              videoWatched={videoModal.videoWatched}
              worksheetSubmitted={videoModal.worksheetSubmitted}
              onCompleteAction={videoModal.onCompleteAction}
              description={videoModal.description}
            />
          )}
        </div>
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
          />
        </div>
      );
    }
    default:
      return <ErrorMessage message={(schema as any)?.type ? `No content available for this section.` : `No content available for this section.`} />;
  }
}