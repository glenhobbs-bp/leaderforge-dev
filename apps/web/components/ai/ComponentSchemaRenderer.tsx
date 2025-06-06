"use client";

import { ComponentSchema, CardAction } from "../../../../packages/agent-core/types/ComponentSchema";
import Image from "next/image";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import Hls from "hls.js";
import React from "react";

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
    const [error, setError] = useState<string | null>(null);
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
        <DialogContent className="sm:max-w-3xl w-full p-0">
          <DialogTitle className="sr-only">{title || 'Video Player'}</DialogTitle>
          <DialogDescription className="sr-only">
            {description || (title ? `Watch ${title}` : 'Video player')}
          </DialogDescription>

          <div className="aspect-video w-full bg-black rounded-t-lg overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}

            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md"
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
          <div className="p-4 bg-white flex flex-col gap-2 rounded-b-lg">
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
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className="bg-[var(--primary)] h-1.5 rounded-full transition-all"
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
                className="mt-2 px-4 py-2 rounded bg-[var(--primary)] text-white text-sm hover:bg-[var(--accent)] transition font-normal"
                onClick={() => {
                  if (onCompleteAction.action) {
                    alert(`Action: ${onCompleteAction.action}`);
                  }
                }}
              >
                {onCompleteAction.label}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150">
          <div className="relative w-full aspect-video rounded-t-lg overflow-hidden px-0 lg:px-4">
            {cardImage ? (
              <Image
                src={cardImage}
                alt={title}
                fill
                className="object-cover rounded-t-lg"
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
                    { action: 'openVideoModal', label: 'Watch', videoUrl, title, videoWatched, worksheetSubmitted, pills, progress }
                  )
                }
                style={{ background: 'rgba(0,0,0,0.2)' }}
                aria-label="Play video"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#fff" fillOpacity="0.7"/>
                  <polygon points="20,16 36,24 20,32" fill="#333"/>
                </svg>
              </button>
            )}
            {/* Pill indicators */}
            <div className="absolute top-2 right-4 flex flex-row flex-wrap gap-1 z-10 items-end sm:items-center">
              {videoWatched === false && (
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-gray-200 shadow-sm whitespace-nowrap line-clamp-1">Video Not Watched</span>
              )}
              {worksheetSubmitted === false && (
                <span className="bg-yellow-50 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-yellow-100 shadow-sm whitespace-nowrap line-clamp-1">Worksheet Not Submitted</span>
              )}
              {publishedDate && (
                <span className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-blue-100 shadow-sm whitespace-nowrap line-clamp-1">{new Date(publishedDate).toLocaleDateString()}</span>
              )}
              {pills && pills.length > 0 && pills.map((pill, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: pill.color || '#e0e7ef', color: '#222' }}>{pill.label}</span>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col p-3 sm:p-4">
            <h4 className="font-medium text-[15px] mb-0.5 text-gray-900">{title}</h4>
            {subtitle && <div className="text-xs text-gray-400 mb-0.5">{subtitle}</div>}
            {description && (
              <p className="text-xs text-gray-500 mb-1 leading-snug line-clamp-3">{description}</p>
            )}
            {/* Progress bar */}
            {typeof progress === "number" && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 mt-auto">
                <div
                  className="bg-[var(--primary)] h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                {actions.map((action: CardAction, i: number) => (
                  <button
                    key={i}
                    className="px-2 py-1 rounded bg-[var(--primary)] text-white text-[11px] hover:bg-[var(--accent)] transition font-normal w-full sm:w-auto"
                    onClick={() => handleAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
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
      return <div>Unknown schema type: {(schema as any).type}</div>;
  }
}