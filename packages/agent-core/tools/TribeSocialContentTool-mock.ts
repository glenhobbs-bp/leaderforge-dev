import type { ComponentSchema, CardSchema } from "../types/ComponentSchema";

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

export class TribeSocialContentTool {
  // Mock: no constructor params needed for now

  async listContentAsComponentSchema(platformId: number, query?: string): Promise<any> {
    // Return a Grid of Cards as ContentSchema (props-wrapped)
    const content: TribeSocialContent[] = [
      {
        id: 1,
        title: 'Video One',
        description: 'Moving From Success to Prime',
        type: 'video',
        featuredImage: '/thumb1.png',
        contentURI: '/mock/video1.mp4',
        publishedDate: '2024-01-01',
      },
      {
        id: 2,
        title: 'Video Two',
        description: 'The Power of Reframing',
        type: 'video',
        featuredImage: '/thumb2.png',
        contentURI: '/mock/video2.mp4',
        publishedDate: '2024-01-02',
      },
    ];
    const cards = content.map((item) => ({
      type: "Card",
      props: {
        title: item.title,
        description: item.description,
        image: item.featuredImage,
        actions: [
          { label: "Watch", action: "watch" },
        ],
        progress: 0,
      },
    }));
    const grid = {
      type: "Grid",
      props: {
        items: cards,
        columns: 2,
      },
    };
    return grid;
  }

  async getContentByIdAsComponentSchema(id: number): Promise<any> {
    // Return a single Card as ContentSchema (props-wrapped)
    return {
      type: "Card",
      props: {
        title: `Video ${id}`,
        description: `Description for video ${id}`,
        image: `/thumb${id}.png`,
        actions: [
          { label: "Watch", action: "watch" },
        ],
        progress: 0,
      },
    };
  }
}