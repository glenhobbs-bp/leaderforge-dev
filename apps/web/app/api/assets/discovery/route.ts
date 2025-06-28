/**
 * File: apps/web/app/api/assets/discovery/route.ts
 * Purpose: Unified Asset Discovery API for agent widget, tool, and composition discovery
 * Owner: Engineering Team
 * Tags: #agent-discovery #unified-api #asset-search #phase3
 */

import { NextRequest, NextResponse } from 'next/server';

interface DiscoveryQuery {
  type?: 'widget' | 'tool' | 'composition' | 'all';
  category?: string;
  tag?: string;
  search?: string;
  capabilities?: string[];
  limit?: number;
}

interface AssetReference {
  id: string;
  type: 'widget' | 'tool' | 'composition';
  name: string;
  displayName: string;
  description: string;
  category: string;
  capabilities: string[];
  tags: string[];
  schemaUrl?: string;
  version: string;
  dependencies: string[];
}

/**
 * GET /api/assets/discovery/
 * Unified search across all asset types for agent discovery
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const query: DiscoveryQuery = {
      type: (searchParams.get('type') as DiscoveryQuery['type']) || 'all',
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      search: searchParams.get('search') || undefined,
      capabilities: searchParams.get('capabilities')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '50')
    };

    const results: AssetReference[] = [];

    // Widget Discovery
    if (query.type === 'all' || query.type === 'widget') {
      try {
        const widgetResponse = await fetch(new URL('/api/assets/registry/widgets/', request.url), {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (widgetResponse.ok) {
          const widgetData = await widgetResponse.json();
          const widgets = widgetData.widgets || [];

          widgets.forEach((widget: {
            id: string;
            name: string;
            displayName: string;
            description: string;
            category: string;
            capabilities: Array<{ name: string }>;
            tags: string[];
            version: string;
            dependencies: string[]
          }) => {
            results.push({
              id: widget.id,
              type: 'widget',
              name: widget.name,
              displayName: widget.displayName,
              description: widget.description,
              category: widget.category,
              capabilities: widget.capabilities.map(cap => cap.name),
              tags: widget.tags,
              schemaUrl: `/api/assets/registry/widgets/${widget.id}`,
              version: widget.version,
              dependencies: widget.dependencies
            });
          });
        }
      } catch (error) {
        console.warn('[Discovery API] Widget fetch failed:', error);
      }
    }

    // Tool Discovery (Future - placeholder for now)
    if (query.type === 'all' || query.type === 'tool') {
      // TODO: Implement tool discovery when tool registry is available
      // This would call /api/assets/registry/tools/ endpoint
    }

    // Composition Discovery (Future - placeholder for now)
    if (query.type === 'all' || query.type === 'composition') {
      // TODO: Implement composition discovery when composition registry is available
      // This would call /api/assets/registry/compositions/ endpoint
    }

    // Apply filters
    let filteredResults = results;

    if (query.category) {
      filteredResults = filteredResults.filter(asset => asset.category === query.category);
    }

    if (query.tag) {
      filteredResults = filteredResults.filter(asset => asset.tags.includes(query.tag));
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredResults = filteredResults.filter(asset =>
        asset.name.toLowerCase().includes(searchLower) ||
        asset.displayName.toLowerCase().includes(searchLower) ||
        asset.description.toLowerCase().includes(searchLower) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (query.capabilities && query.capabilities.length > 0) {
      filteredResults = filteredResults.filter(asset =>
        query.capabilities!.some(cap => asset.capabilities.includes(cap))
      );
    }

    // Apply limit
    if (query.limit && query.limit > 0) {
      filteredResults = filteredResults.slice(0, query.limit);
    }

    const responseTime = Date.now() - startTime;

    // Generate discovery summary
    const summary = {
      totalAssets: filteredResults.length,
      byType: {
        widget: filteredResults.filter(a => a.type === 'widget').length,
        tool: filteredResults.filter(a => a.type === 'tool').length,
        composition: filteredResults.filter(a => a.type === 'composition').length
      },
      byCategory: filteredResults.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      availableCapabilities: [...new Set(filteredResults.flatMap(a => a.capabilities))],
      availableTags: [...new Set(filteredResults.flatMap(a => a.tags))]
    };

    return NextResponse.json({
      assets: filteredResults,
      query,
      summary,
      meta: {
        responseTime: `${responseTime}ms`,
        apiVersion: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache
        'X-Response-Time': `${responseTime}ms`,
        'X-Discovery-Version': '1.0.0'
      }
    });

  } catch (error) {
    console.error('[Discovery API] Error:', error);

    return NextResponse.json({
      error: 'Asset discovery unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      assets: [],
      summary: { totalAssets: 0, byType: {}, byCategory: {}, availableCapabilities: [], availableTags: [] },
      meta: { responseTime: `${Date.now() - startTime}ms` }
    }, {
      status: 500,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

/**
 * POST /api/assets/discovery/
 * Advanced discovery with complex queries and agent context
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      query,
      agentContext,
      userContext,
      requirements
    } = body;

    // Enhanced discovery based on agent context
    const enhancedQuery = {
      ...query,
      // Add agent-specific filtering based on context
      agentType: agentContext?.type,
      tenantKey: userContext?.tenantKey,
      userRole: userContext?.role
    };

    // For now, redirect to GET with enhanced parameters
    const searchParams = new URLSearchParams();

    if (enhancedQuery.type) searchParams.set('type', enhancedQuery.type);
    if (enhancedQuery.category) searchParams.set('category', enhancedQuery.category);
    if (enhancedQuery.search) searchParams.set('search', enhancedQuery.search);
    if (enhancedQuery.capabilities) searchParams.set('capabilities', enhancedQuery.capabilities.join(','));
    if (enhancedQuery.limit) searchParams.set('limit', enhancedQuery.limit.toString());

    const getUrl = new URL(request.url);
    getUrl.search = searchParams.toString();

    // Internal fetch to GET endpoint with enhanced query
    const getResponse = await fetch(getUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const getResult = await getResponse.json();

    // Add POST-specific enhancements
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...getResult,
      agentContext,
      userContext,
      requirements,
      meta: {
        ...getResult.meta,
        responseTime: `${responseTime}ms`,
        method: 'POST',
        enhanced: true
      }
    }, {
      status: getResponse.status,
      headers: {
        'Cache-Control': 'no-cache', // POST responses not cached
        'X-Response-Time': `${responseTime}ms`,
        'X-Discovery-Version': '1.0.0'
      }
    });

  } catch (error) {
    console.error('[Discovery API POST] Error:', error);

    return NextResponse.json({
      error: 'Enhanced discovery unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      assets: [],
      meta: { responseTime: `${Date.now() - startTime}ms`, method: 'POST' }
    }, {
      status: 500,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}