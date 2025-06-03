export interface UserProgress {
  user_id: string;
  content_id: string;
  context_key: string;
  progress_percentage: number;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
}

export class UserProgressTool {
  private store: Map<string, UserProgress> = new Map();

  private key(userId: string, contentId: string, contextKey: string) {
    return `${userId}:${contentId}:${contextKey}`;
  }

  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    return this.store.get(this.key(userId, contentId, contextKey)) || null;
  }

  async listProgressForUser(userId: string, contextKey: string): Promise<UserProgress[]> {
    return Array.from(this.store.values()).filter(
      p => p.user_id === userId && p.context_key === contextKey
    );
  }

  async updateProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    progress: Partial<UserProgress>
  ): Promise<UserProgress> {
    const key = this.key(userId, contentId, contextKey);
    const existing = this.store.get(key) || {
      user_id: userId,
      content_id: contentId,
      context_key: contextKey,
      progress_percentage: 0,
      watch_time_seconds: 0,
      last_position_seconds: 0,
    };
    const updated = { ...existing, ...progress };
    this.store.set(key, updated);
    return updated;
  }
}