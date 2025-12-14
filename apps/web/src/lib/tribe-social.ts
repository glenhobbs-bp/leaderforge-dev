/**
 * File: src/lib/tribe-social.ts
 * Purpose: Tribe Social CMS integration for content fetching
 * Owner: Core Team
 */

const TRIBE_API_URL = process.env.TRIBE_SOCIAL_API_URL || 'https://edge.tribesocial.io';
const TRIBE_TOKEN = process.env.TRIBE_SOCIAL_TOKEN || '';
const TRIBE_CDN_URL = 'https://cdn.tribesocial.io';

// LeaderForge content collection ID in Tribe Social
export const LEADERFORGE_COLLECTION_ID = 99735660;

export interface TribeContentItem {
  id: number;
  title: string;
  description: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  type: string;
  featuredImage?: string;
  coverImage?: string;
  collectionBGImage?: string;
  video?: string;
  transcodingDataLP?: string;
  publishedDate?: string;
  duration?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link';
  thumbnailUrl: string | null;
  videoUrl: string | null;
  duration: number | null;
  publishedAt: string | null;
}

/**
 * Get image URL from Tribe content item
 */
function getImageUrl(item: TribeContentItem): string | null {
  if (item.collectionBGImage) {
    return `${TRIBE_CDN_URL}/${item.collectionBGImage}`;
  }
  if (item.featuredImage) {
    return item.featuredImage.startsWith('http') 
      ? item.featuredImage 
      : `${TRIBE_CDN_URL}/${item.featuredImage}`;
  }
  if (item.coverImage) {
    return item.coverImage.startsWith('http') 
      ? item.coverImage 
      : `${TRIBE_CDN_URL}/${item.coverImage}`;
  }
  return null;
}

/**
 * Get video URL from Tribe content item (prefer HLS for streaming)
 */
function getVideoUrl(item: TribeContentItem): string | null {
  // Try HLS transcoded video first
  if (item.transcodingDataLP) {
    try {
      const transcoding = typeof item.transcodingDataLP === 'string' 
        ? JSON.parse(item.transcodingDataLP) 
        : item.transcodingDataLP;
      if (transcoding?.hls) {
        return transcoding.hls.startsWith('http') 
          ? transcoding.hls 
          : `${TRIBE_CDN_URL}/${transcoding.hls}`;
      }
    } catch {
      // Fall through to video field
    }
  }
  
  // Fallback to video field
  if (item.video) {
    return item.video.startsWith('http') 
      ? item.video 
      : `${TRIBE_CDN_URL}/${item.video}`;
  }
  
  return null;
}

/**
 * Transform Tribe content to our ContentItem format
 */
function transformContent(item: TribeContentItem): ContentItem {
  const videoUrl = getVideoUrl(item);
  
  return {
    id: String(item.id),
    title: item.title || 'Untitled',
    description: item.descriptionPlain || item.description || '',
    type: videoUrl ? 'video' : 'document',
    thumbnailUrl: getImageUrl(item),
    videoUrl,
    duration: item.duration || null,
    publishedAt: item.publishedDate || null,
  };
}

/**
 * Fetch content collection from Tribe Social
 */
export async function fetchContentCollection(collectionId: number = LEADERFORGE_COLLECTION_ID): Promise<ContentItem[]> {
  if (!TRIBE_TOKEN) {
    console.error('TRIBE_SOCIAL_TOKEN not configured');
    return [];
  }

  const url = `${TRIBE_API_URL}/api/collection-by-id/${collectionId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `token=${TRIBE_TOKEN}`,
        'User-Agent': 'LeaderForge/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Tribe API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items: TribeContentItem[] = Array.isArray(data.Contents) ? data.Contents : [];
    
    return items.map(transformContent);
  } catch (error) {
    console.error('Failed to fetch from Tribe Social:', error);
    return [];
  }
}

/**
 * Fetch single content item by ID
 * We fetch from the collection and find the item, as single-item API may have different structure
 */
export async function fetchContentById(contentId: string): Promise<ContentItem | null> {
  console.log('[fetchContentById] Looking for content ID:', contentId);
  
  if (!TRIBE_TOKEN) {
    console.error('[fetchContentById] TRIBE_SOCIAL_TOKEN not configured');
    return null;
  }

  try {
    // Fetch collection and find item by ID (more reliable than single-item endpoint)
    const items = await fetchContentCollection();
    console.log('[fetchContentById] Collection has', items.length, 'items');
    console.log('[fetchContentById] Available IDs:', items.map(i => i.id).join(', '));
    
    const item = items.find(i => i.id === contentId);
    
    if (item) {
      console.log('[fetchContentById] Found item:', item.title);
      return item;
    }

    console.log('[fetchContentById] Item not found in collection, trying direct API');
    
    // Fallback: try direct API call
    const url = `${TRIBE_API_URL}/content/${contentId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `token=${TRIBE_TOKEN}`,
        'User-Agent': 'LeaderForge/1.0',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[fetchContentById] Tribe API error: ${response.status}`);
      return null;
    }

    const data: TribeContentItem = await response.json();
    console.log('[fetchContentById] Got item from direct API:', data.title);
    return transformContent(data);
  } catch (error) {
    console.error('[fetchContentById] Failed to fetch content item:', error);
    return null;
  }
}

