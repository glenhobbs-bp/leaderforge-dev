// All schema types are props-wrapped. Do not use flat schemas.

export type CardAction = {
  label: string;
  action: string;
};

export type ContentSchema =
  | {
      type: "Panel";
      props: {
        heading: string;
        description?: string;
        widgets?: ContentSchema[];
      };
    }
  | {
      type: "StatCard";
      props: {
        title: string;
        value: number | string;
        description?: string;
      };
    }
  | {
      type: "Leaderboard";
      props: {
        title: string;
        items: { name: string; score: number }[];
      };
    }
  | {
      type: "VideoList";
      props: {
        title: string;
        videos: { id: string; title: string; thumbnail: string }[];
      };
    }
  | {
      type: "Grid";
      props: {
        columns: number;
        items: ContentSchema[];
      };
    }
  | {
      type: "Card";
      props: {
        image: string;
        title: string;
        subtitle?: string;
        description?: string;
        longDescription?: string;
        videoWatched?: boolean;
        worksheetSubmitted?: boolean;
        progress?: number; // 0-100
        actions?: CardAction[];
      };
    };