/**
 * File: src/components/content/video-player.tsx
 * Purpose: Video player component with HLS support
 * Owner: Core Team
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  initialProgress?: number; // 0-100 percentage to resume from
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ src, poster, title, initialProgress = 0, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasResumed = useRef(false);

  const initializePlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !src) {
      setError('No video source provided');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS stream (.m3u8)
    const isHls = src.includes('.m3u8');

    console.log('[VideoPlayer] Source:', src);
    console.log('[VideoPlayer] Is HLS:', isHls);
    console.log('[VideoPlayer] HLS.js supported:', Hls.isSupported());

    if (isHls && Hls.isSupported()) {
      // Use HLS.js for HLS streams
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        debug: false,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[VideoPlayer] HLS manifest parsed');
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('[VideoPlayer] HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[VideoPlayer] Network error');
              setError('Network error loading video. The video may be unavailable.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[VideoPlayer] Media error, attempting recovery');
              hls.recoverMediaError();
              break;
            default:
              setError('Unable to play this video format.');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('[VideoPlayer] Using native HLS support');
      video.src = src;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', () => setError('Failed to load video'));
    } else {
      // Regular video file (MP4, WebM, etc.)
      console.log('[VideoPlayer] Using native video element');
      video.src = src;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', (e) => {
        console.error('[VideoPlayer] Video error:', e);
        setError('Failed to load video. The format may not be supported.');
      });
    }
  }, [src]);

  useEffect(() => {
    initializePlayer();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  // Resume from saved position when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Only resume once and if we have a valid initial progress
      if (!hasResumed.current && initialProgress > 0 && initialProgress < 100 && video.duration > 0) {
        const targetTime = (initialProgress / 100) * video.duration;
        console.log('[VideoPlayer] Resuming from', initialProgress, '% ->', targetTime, 'seconds');
        video.currentTime = targetTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Also try on canplay for HLS streams where duration might not be available immediately
    video.addEventListener('canplay', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleLoadedMetadata);
    };
  }, [initialProgress]);

  // Track progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const progress = Math.round((video.currentTime / video.duration) * 100);
        onProgress?.(progress);

        // Mark as complete at 90%
        if (progress >= 90) {
          onComplete?.();
        }
      }
    };

    const handleEnded = () => {
      onComplete?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onProgress, onComplete]);

  const handleRetry = () => {
    initializePlayer();
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg mb-2">Unable to play video</p>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-white/40 mt-4 break-all">
              Source: {src}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls
        playsInline
        crossOrigin="anonymous"
        title={title}
      >
        <p>Your browser does not support HTML5 video.</p>
      </video>
    </div>
  );
}
