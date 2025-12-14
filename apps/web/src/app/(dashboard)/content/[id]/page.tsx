/**
 * File: src/app/(dashboard)/content/[id]/page.tsx
 * Purpose: Content detail/player page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Clock, Calendar } from 'lucide-react';
import { fetchContentById } from '@/lib/tribe-social';
import { VideoPlayer } from '@/components/content/video-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const content = await fetchContentById(id);
  
  return {
    title: content?.title || 'Content',
    description: content?.description || 'View learning content',
  };
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const content = await fetchContentById(id);

  if (!content) {
    notFound();
  }

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
              <h3 className="font-semibold mb-4">Your Progress</h3>
              <div className="space-y-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full w-0" />
                </div>
                <p className="text-sm text-muted-foreground">Not started</p>
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

