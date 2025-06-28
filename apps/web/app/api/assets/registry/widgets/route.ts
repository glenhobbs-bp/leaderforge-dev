/**
 * File: apps/web/app/api/assets/registry/widgets/route.ts
 * Purpose: Agent Discovery API - Widget Registry endpoint for dynamic widget discovery
 * Owner: Engineering Team
 * Tags: #agent-discovery #widget-registry #api #phase3
 */

import { NextRequest, NextResponse } from 'next/server';

interface WidgetCapability {
  name: string;
  description: string;
  required: boolean;
  type: string;
}

interface WidgetSchemaProperty {
  type: string;
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
  min?: number;
  max?: number;
  format?: string;
  items?: WidgetSchemaProperty;
  properties?: Record<string, WidgetSchemaProperty>;
}

interface WidgetExample {
  name: string;
  description: string;
  schema: {
    type: string;
    props?: Record<string, unknown>;
    data?: Record<string, unknown>;
    config?: Record<string, unknown>;
  };
}

interface WidgetMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  version: string;
  capabilities: WidgetCapability[];
  schema: {
    props: Record<string, WidgetSchemaProperty>;
    data: Record<string, WidgetSchemaProperty>;
    config: Record<string, WidgetSchemaProperty>;
  };
  dependencies: string[];
  examples: WidgetExample[];
  tags: string[];
}

// Widget Registry - Current available widgets with their capabilities
const WIDGET_REGISTRY: WidgetMetadata[] = [
  {
    id: 'Card',
    name: 'Card',
    displayName: 'Content Card',
    description: 'Versatile card component for displaying content with optional actions, progress, and media',
    category: 'content',
    version: '1.0.0',
    capabilities: [
      { name: 'title', description: 'Display card title', required: true, type: 'string' },
      { name: 'description', description: 'Card description text', required: false, type: 'string' },
      { name: 'image', description: 'Card image/thumbnail', required: false, type: 'string' },
      { name: 'actions', description: 'Interactive buttons', required: false, type: 'array' },
      { name: 'progress', description: 'Progress indicators', required: false, type: 'object' },
      { name: 'stats', description: 'Status and statistics', required: false, type: 'object' },
      { name: 'content', description: 'Rich content blocks', required: false, type: 'array' }
    ],
    schema: {
      props: {
        title: { type: 'string', required: true },
        description: { type: 'string', required: false },
        variant: { type: 'string', enum: ['default', 'elevated', 'outlined'], default: 'default' },
        maxWidth: { type: 'string', required: false }
      },
      data: {
        image: { type: 'string', format: 'url', required: false },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', required: true },
              variant: { type: 'string', enum: ['primary', 'secondary'], default: 'primary' },
              href: { type: 'string', required: false },
              onClick: { type: 'string', required: false }
            }
          }
        },
        progress: {
          type: 'object',
          properties: {
            percentage: { type: 'number', min: 0, max: 100 },
            label: { type: 'string' },
            variant: { type: 'string', enum: ['default', 'success', 'warning'] }
          }
        },
        stats: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            value: { type: 'string' }
          }
        },
        content: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['text', 'list', 'link'] },
              content: { type: 'string' }
            }
          }
        }
      },
      config: {
        clickable: { type: 'boolean', default: false },
        showProgress: { type: 'boolean', default: false },
        showStats: { type: 'boolean', default: false }
      }
    },
    dependencies: [],
    examples: [
      {
        name: 'Basic Content Card',
        description: 'Simple card with title and description',
        schema: {
          type: 'Card',
          props: { title: 'Sample Card', description: 'This is a sample card' },
          data: {},
          config: {}
        }
      },
      {
        name: 'Progress Card',
        description: 'Card with progress indicator',
        schema: {
          type: 'Card',
          props: { title: 'Video Training' },
          data: {
            progress: { percentage: 75, label: '75% Complete', variant: 'success' }
          },
          config: { showProgress: true }
        }
      }
    ],
    tags: ['content', 'display', 'interactive']
  },
  {
    id: 'Grid',
    name: 'Grid',
    displayName: 'Layout Grid',
    description: 'Responsive grid layout for organizing multiple widgets or content items',
    category: 'layout',
    version: '1.0.0',
    capabilities: [
      { name: 'responsive', description: 'Responsive column layout', required: true, type: 'object' },
      { name: 'items', description: 'Grid items/widgets', required: true, type: 'array' },
      { name: 'gap', description: 'Grid spacing', required: false, type: 'number' },
      { name: 'alignment', description: 'Content alignment', required: false, type: 'string' }
    ],
    schema: {
      props: {},
      data: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', required: true },
              props: { type: 'object' },
              data: { type: 'object' },
              config: { type: 'object' }
            }
          },
          required: true
        }
      },
      config: {
        columns: {
          type: 'object',
          properties: {
            default: { type: 'number', default: 1 },
            sm: { type: 'number' },
            md: { type: 'number' },
            lg: { type: 'number' },
            xl: { type: 'number' }
          },
          required: true
        },
        gap: { type: 'number', default: 4 },
        alignment: { type: 'string', enum: ['start', 'center', 'end'], default: 'start' }
      }
    },
    dependencies: [],
    examples: [
      {
        name: 'Responsive Card Grid',
        description: 'Grid of cards with responsive columns',
        schema: {
          type: 'Grid',
          config: { columns: { default: 1, md: 2, lg: 3 }, gap: 6 },
          data: {
            items: [
              { type: 'Card', props: { title: 'Card 1' }, data: {}, config: {} },
              { type: 'Card', props: { title: 'Card 2' }, data: {}, config: {} }
            ]
          }
        }
      }
    ],
    tags: ['layout', 'responsive', 'container']
  },
  {
    id: 'Panel',
    name: 'Panel',
    displayName: 'Content Panel',
    description: 'Structured panel for displaying organized content with optional headers and footers',
    category: 'layout',
    version: '1.0.0',
    capabilities: [
      { name: 'header', description: 'Panel header with title/actions', required: false, type: 'object' },
      { name: 'content', description: 'Main panel content', required: true, type: 'array' },
      { name: 'footer', description: 'Panel footer', required: false, type: 'object' },
      { name: 'collapsible', description: 'Collapsible functionality', required: false, type: 'boolean' }
    ],
    schema: {
      props: {
        title: { type: 'string', required: false },
        collapsible: { type: 'boolean', default: false }
      },
      data: {
        header: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            actions: { type: 'array' }
          }
        },
        content: {
          type: 'array',
          items: { type: 'object' },
          required: true
        },
        footer: {
          type: 'object',
          properties: {
            actions: { type: 'array' },
            text: { type: 'string' }
          }
        }
      },
      config: {
        variant: { type: 'string', enum: ['default', 'bordered', 'elevated'], default: 'default' },
        padding: { type: 'string', enum: ['none', 'sm', 'md', 'lg'], default: 'md' }
      }
    },
    dependencies: [],
    examples: [
      {
        name: 'Content Panel',
        description: 'Panel with header and content',
        schema: {
          type: 'Panel',
          props: { title: 'Content Panel' },
          data: {
            content: [
              { type: 'text', content: 'Panel content here' }
            ]
          },
          config: { variant: 'bordered' }
        }
      }
    ],
    tags: ['layout', 'container', 'structured']
  },
  {
    id: 'VideoPlayerModal',
    name: 'VideoPlayerModal',
    displayName: 'Video Player Modal',
    description: 'Modal video player with progress tracking and playback controls',
    category: 'media',
    version: '1.0.0',
    capabilities: [
      { name: 'video', description: 'Video playback', required: true, type: 'object' },
      { name: 'progress', description: 'Progress tracking', required: true, type: 'object' },
      { name: 'modal', description: 'Modal overlay', required: true, type: 'boolean' },
      { name: 'controls', description: 'Playback controls', required: false, type: 'object' }
    ],
    schema: {
      props: {
        isOpen: { type: 'boolean', required: true },
        onClose: { type: 'function', required: true }
      },
      data: {
        video: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'url', required: true },
            title: { type: 'string', required: true },
            duration: { type: 'number' }
          },
          required: true
        },
        progress: {
          type: 'object',
          properties: {
            currentTime: { type: 'number', default: 0 },
            percentage: { type: 'number', min: 0, max: 100, default: 0 }
          },
          required: true
        }
      },
      config: {
        autoplay: { type: 'boolean', default: false },
        controls: { type: 'boolean', default: true },
        trackProgress: { type: 'boolean', default: true }
      }
    },
    dependencies: ['video-js', 'react-modal'],
    examples: [
      {
        name: 'Training Video Player',
        description: 'Video player for training content',
        schema: {
          type: 'VideoPlayerModal',
          props: { isOpen: true },
          data: {
            video: { url: 'https://example.com/video.mp4', title: 'Training Video' },
            progress: { currentTime: 0, percentage: 0 }
          },
          config: { autoplay: false, trackProgress: true }
        }
      }
    ],
    tags: ['media', 'video', 'modal', 'interactive']
  },
  {
    id: 'LeaderForgeCard',
    name: 'LeaderForgeCard',
    displayName: 'LeaderForge Training Card',
    description: 'Specialized card for LeaderForge training content with progress and action integration',
    category: 'content',
    version: '1.0.0',
    capabilities: [
      { name: 'training', description: 'Training content display', required: true, type: 'object' },
      { name: 'progress', description: 'Progress tracking', required: true, type: 'object' },
      { name: 'actions', description: 'Training actions', required: true, type: 'array' },
      { name: 'certification', description: 'Certification status', required: false, type: 'object' }
    ],
    schema: {
      props: {
        variant: { type: 'string', enum: ['training', 'assessment', 'certification'], default: 'training' }
      },
      data: {
        training: {
          type: 'object',
          properties: {
            title: { type: 'string', required: true },
            description: { type: 'string' },
            instructor: { type: 'string' },
            duration: { type: 'string' },
            level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
          },
          required: true
        },
        progress: {
          type: 'object',
          properties: {
            percentage: { type: 'number', min: 0, max: 100 },
            completed: { type: 'boolean' },
            lastAccessed: { type: 'string', format: 'date-time' }
          },
          required: true
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['start', 'continue', 'review', 'certificate'] },
              label: { type: 'string' },
              enabled: { type: 'boolean', default: true }
            }
          },
          required: true
        }
      },
      config: {
        showInstructor: { type: 'boolean', default: true },
        showDuration: { type: 'boolean', default: true },
        showLevel: { type: 'boolean', default: true },
        trackingEnabled: { type: 'boolean', default: true }
      }
    },
    dependencies: [],
    examples: [
      {
        name: 'Leadership Training Card',
        description: 'Card for leadership training module',
        schema: {
          type: 'LeaderForgeCard',
          props: { variant: 'training' },
          data: {
            training: {
              title: 'Leadership Fundamentals',
              description: 'Core principles of effective leadership',
              instructor: 'John Smith',
              duration: '45 minutes',
              level: 'beginner'
            },
            progress: { percentage: 60, completed: false },
            actions: [
              { type: 'continue', label: 'Continue Training', enabled: true }
            ]
          },
          config: { trackingEnabled: true }
        }
      }
    ],
    tags: ['content', 'training', 'leaderforge', 'specialized']
  }
];

/**
 * GET /api/assets/registry/widgets/
 * Returns all available widgets with their metadata, schemas, and capabilities
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let widgets = WIDGET_REGISTRY;

    // Apply filters
    if (category) {
      widgets = widgets.filter(widget => widget.category === category);
    }

    if (tag) {
      widgets = widgets.filter(widget => widget.tags.includes(tag));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      widgets = widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchLower) ||
        widget.displayName.toLowerCase().includes(searchLower) ||
        widget.description.toLowerCase().includes(searchLower) ||
        widget.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      widgets,
      meta: {
        total: widgets.length,
        categories: [...new Set(WIDGET_REGISTRY.map(w => w.category))],
        tags: [...new Set(WIDGET_REGISTRY.flatMap(w => w.tags))],
        responseTime: `${responseTime}ms`,
        apiVersion: '1.0.0'
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache
        'X-Response-Time': `${responseTime}ms`,
        'X-Registry-Version': '1.0.0'
      }
    });

  } catch (error) {
    console.error('[Widget Registry API] Error:', error);

    return NextResponse.json({
      error: 'Widget registry unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      widgets: [],
      meta: { total: 0, responseTime: `${Date.now() - startTime}ms` }
    }, {
      status: 500,
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}