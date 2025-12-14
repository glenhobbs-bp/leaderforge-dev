/**
 * Local Widget Types
 * Purpose: Widget types and registry functionality for production build
 * Owner: Widget Team
 * Tags: #widgets #types #local
 */

export enum WidgetCapabilities {
  STATISTICS_DISPLAY = 'statistics-display',
  LEADERBOARD_DISPLAY = 'leaderboard-display',
  VIDEO_PLAYBACK = 'video-playback',
  PROGRESS_TRACKING = 'progress-tracking',
  MODAL_DISPLAY = 'modal-display',
  GRID_LAYOUT = 'grid-layout',
  RESPONSIVE_LAYOUT = 'responsive-layout',
}

export enum AssetCapabilities {
  COMPOSABLE = 'composable',
}

export interface WidgetMetadata {
  id: string;
  type: string;
  name: string;
  description: string;
  version: string;
  category: string;
  capabilities: (WidgetCapabilities | string)[];
  tags: string[];
  author: string;
  sizeHint: string;
  themeable: boolean;
}

export interface RegisteredWidget {
  metadata: WidgetMetadata;
  component: React.ComponentType<unknown>;
  componentPath: string;
}

export class WidgetRegistry {
  private widgets: Map<string, RegisteredWidget> = new Map();

  registerWidget(widget: RegisteredWidget): void {
    this.widgets.set(widget.metadata.id, widget);
  }

  getWidget(id: string): RegisteredWidget | undefined {
    return this.widgets.get(id);
  }

  getAllWidgets(): RegisteredWidget[] {
    return Array.from(this.widgets.values());
  }
}