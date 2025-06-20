// Real TribeSocialContentTool: Connects to TribeSocial API. For mock/demo, see TribeSocialContentTool-mock.ts
//
// ENV REQUIRED:
//   TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
//   TRIBE_SOCIAL_TOKEN=your_api_token_here
//
// Place these in your .env file for local dev or in your deployment environment.

import type { ComponentSchema, CardSchema } from "../types/ComponentSchema";
import { supabase } from '../../../apps/web/app/lib/supabaseClient';

export interface TribeSocialContent {
  id: number;
  title: string;
  description: string;
  type: string;
  featuredImage?: string;
  contentURI?: string;
  video?: string;
  publishedDate?: string;
}

/**
 * TribeSocialContentTool
 * Production implementation for fetching content from TribeSocial API.
 * Requires TRIBE_SOCIAL_API_URL and TRIBE_SOCIAL_TOKEN in env.
 */
export class TribeSocialContentTool {
  private apiUrl: string;
  private token: string;

  constructor() {
    this.apiUrl = process.env.TRIBE_SOCIAL_API_URL || "https://edge.tribesocial.io";
    this.token = process.env.TRIBE_SOCIAL_TOKEN || "";
  }

  /**
   * Fetches a single collection by id from the internal proxy route, not TribeSocial directly.
   * Always returns { type, props } shape for all schemas.
   */
  async listContentAsComponentSchema(collectionId: number, query?: string, sessionToken?: string): Promise<ComponentSchema> {
    if (!collectionId) {
      throw new Error("Missing required collectionId");
    }
    // Use absolute URL in Node.js, relative in browser
    const isServer = typeof window === 'undefined';
    // Point to centralized API proxy in apps/api
    const baseUrl = isServer
      ? process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000'
      : '';
    const url = `${baseUrl}/api/tribe/content/${collectionId}`;
    const headers = {
      'Accept': 'application/json',
      // No need to send sessionToken for server-to-server
    };
    console.log('[TribeSocialContentTool] Fetching from proxy:', url);
    console.log('[TribeSocialContentTool] Headers:', headers);
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Proxy API error: ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Proxy API did not return JSON. Raw response:", text);
        throw new Error("Proxy API did not return JSON");
      }
      if (data.error) {
        throw new Error(`Proxy API error: ${data.error}`);
      }
      // Map to CardSchema[]
      const items = Array.isArray(data.Contents) ? data.Contents : [];
      const cards: CardSchema[] = items.map((item: any) => {
        // Image selection logic (legacy compatible)
        let image: string | undefined = undefined;
        if (item.collectionBGImage) {
          image = `https://cdn.tribesocial.io/${item.collectionBGImage}`;
        } else if (item.featuredImage) {
          image = item.featuredImage.startsWith('http') ? item.featuredImage : `https://cdn.tribesocial.io/${item.featuredImage}`;
        } else if (item.coverImage) {
          image = item.coverImage.startsWith('http') ? item.coverImage : `https://cdn.tribesocial.io/${item.coverImage}`;
        } else if (item.imageUrl && typeof item.imageUrl === 'string') {
          image = item.imageUrl;
        }
        // Video URL logic
        let videoUrl = undefined;
        if (item.transcodingDataLP) {
          try {
            const transcoding = typeof item.transcodingDataLP === 'string' ? JSON.parse(item.transcodingDataLP) : item.transcodingDataLP;
            if (transcoding && transcoding.hls) {
              videoUrl = transcoding.hls.startsWith('http') ? transcoding.hls : `https://cdn.tribesocial.io/${transcoding.hls}`;
            }
          } catch {}
        } else if (item.video) {
          videoUrl = item.video.startsWith('http') ? item.video : `https://cdn.tribesocial.io/${item.video}`;
        }
        return {
          type: 'Card',
          props: {
            id: String(item.id),
            title: item.title || item.name,
            subtitle: item.type || '',
            image,
            featuredImage: item.featuredImage,
            coverImage: item.coverImage,
            imageUrl: item.imageUrl,
            videoUrl,
            description: item.descriptionPlain || item.description || '',
            longDescription: item.descriptionHtml || '',
            publishedDate: item.publishedDate,
          }
        };
      });
      return {
        type: 'Grid',
        props: {
          columns: 3,
          items: cards
        }
      };
    } catch (err) {
      console.error('[TribeSocialContentTool] Fetch error:', err);
      throw err;
    }
  }

  async getContentByIdAsComponentSchema(contentId: number, sessionToken?: string): Promise<CardSchema | null> {
    const url = `${this.apiUrl}/content/${contentId}`;
    const cookieToken = sessionToken || this.token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': `token=${cookieToken}`,
      'User-Agent': 'Mozilla/5.0 (LeaderForge/1.0)'
    };
    // Debug log outgoing request
    console.log('[TribeSocialContentTool] Fetching:', url);
    console.log('[TribeSocialContentTool] Headers:', headers);
    const res = await fetch(url, { headers, cache: 'no-store' });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("TribeSocial API did not return JSON. Raw response:", text);
      throw new Error("TribeSocial API did not return JSON");
    }
    if (!res.ok) {
      const msg = data?.message || res.statusText;
      throw new Error(`TribeSocial API error: ${res.status} - ${msg}`);
    }
    return {
      type: 'Card',
      props: {
      title: data.title,
      subtitle: data.type,
      image: data.featuredImage ? `${this.apiUrl}/${data.featuredImage}` : undefined,
      description: data.description,
      longDescription: data.description,
        videoUrl: data.video || data.contentURI || undefined,
      publishedDate: data.publishedDate,
      }
    };
  }

  /**
   * Fetches all content for a given contextKey from TribeSocial (via proxy).
   * PATCH: For 'leaderforge', fetch directly from TribeSocial using collectionId 99735660.
   * Ignore Supabase for now.
   */
  async getContentForContext(contextKey: string): Promise<any[]> {
    // Map contextKey to collectionId
    let collectionId: number | undefined = undefined;
    if (contextKey === 'leaderforge') {
      collectionId = 99735660;
    } else {
      // TODO: Map other contextKeys to collectionIds as needed
      throw new Error(`No collectionId mapping for contextKey: ${contextKey}`);
    }
    // Fetch from proxy/TribeSocial
    const data = await this.listContentAsComponentSchema(collectionId);
    // Return items array (cards)
    if (data && data.type === 'Grid' && data.props && Array.isArray(data.props.items)) {
      return data.props.items;
    }
    return [];
  }
}