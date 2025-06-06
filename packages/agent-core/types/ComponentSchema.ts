// ComponentSchema.ts
// Defines the UI component/layout schema for agent-driven rendering (props-wrapped only)

import type { ContentSchema } from "./contentSchema";

export type ComponentSchema =
  | PanelSchema
  | StatCardSchema
  | LeaderboardSchema
  | VideoListSchema
  | GridSchema
  | CardSchema;

export interface PanelSchema {
  type: "Panel";
  props: {
    heading: string;
    description?: string;
    widgets?: ComponentSchema[];
  };
}

export interface StatCardSchema {
  type: "StatCard";
  props: {
    title: string;
    value: number | string;
    description?: string;
  };
}

export interface LeaderboardSchema {
  type: "Leaderboard";
  props: {
    title: string;
    items: { name: string; score: number }[];
  };
}

export interface VideoListSchema {
  type: "VideoList";
  props: {
    title: string;
    videos: CardSchema[]; // Each video is a CardSchema, which can embed ContentSchema
  };
}

export interface GridSchema {
  type: "Grid";
  props: {
    columns: number;
    items: ComponentSchema[];
  };
}

export interface CardSchema {
  type: "Card";
  props: {
    image?: string;
    featuredImage?: string;
    coverImage?: string;
    imageUrl?: string;
    videoUrl?: string;
    publishedDate?: string;
    title: string;
    subtitle?: string;
    description?: string;
    longDescription?: string;
    videoWatched?: boolean;
    worksheetSubmitted?: boolean;
    progress?: number; // 0-100
    actions?: CardAction[];
    content?: ContentSchema; // Embed domain content if needed
  };
}

export interface CardAction {
  label: string;
  action: string;
}