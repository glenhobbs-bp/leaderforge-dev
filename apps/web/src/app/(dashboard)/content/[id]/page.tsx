/**
 * File: src/app/(dashboard)/content/[id]/page.tsx
 * Purpose: Content detail/player page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import { fetchContentById } from '@/lib/tribe-social';
import { ContentViewer } from '@/components/content/content-viewer';
import { Button } from '@/components/ui/button';

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
  
  console.log('[ContentDetailPage] Fetching content ID:', id);
  const content = await fetchContentById(id);
  console.log('[ContentDetailPage] Content result:', content ? 'found' : 'not found');

  if (!content) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div>
          <Link href="/content">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Play className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            This content may have been removed or is temporarily unavailable.
            Please try again later or browse our content library.
          </p>
          <Link href="/content" className="mt-6">
            <Button>Browse Content Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <ContentViewer content={content} />;
}
