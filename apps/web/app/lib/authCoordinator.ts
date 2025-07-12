// Authentication Coordinator - Prevents race conditions during login
// Ensures all components wait for session sync to complete before making authenticated calls

class AuthenticationCoordinator {
  private isSessionSyncing = false;
  private sessionSyncPromise: Promise<boolean> | null = null;
  private listeners: ((isSessionReady: boolean) => void)[] = [];

  // Called by login page when session sync starts
  startSessionSync(): Promise<boolean> {
    if (this.sessionSyncPromise) {
      return this.sessionSyncPromise;
    }

    this.isSessionSyncing = true;
    this.notifyListeners(false);

    this.sessionSyncPromise = new Promise((resolve) => {
      // Session sync will complete when finishSessionSync is called
      const checkCompletion = () => {
        if (!this.isSessionSyncing) {
          resolve(true);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });

    return this.sessionSyncPromise;
  }

  // Called by login page when session sync completes
  finishSessionSync() {
    this.isSessionSyncing = false;
    this.sessionSyncPromise = null;
    this.notifyListeners(true);
    console.log('[AuthCoordinator] ✅ Session sync completed - components can now make authenticated calls');
  }

  // Called by login page if session sync fails
  failSessionSync() {
    this.isSessionSyncing = false;
    this.sessionSyncPromise = null;
    this.notifyListeners(false);
    console.log('[AuthCoordinator] ❌ Session sync failed');
  }

  // Components call this to wait for session sync to complete
  async waitForSessionReady(): Promise<boolean> {
    if (!this.isSessionSyncing && !this.sessionSyncPromise) {
      return true; // No sync in progress
    }

    if (this.sessionSyncPromise) {
      return await this.sessionSyncPromise;
    }

    return true;
  }

  // Check if session sync is currently in progress
  isSessionSyncInProgress(): boolean {
    return this.isSessionSyncing;
  }

  // Subscribe to session sync state changes
  onSessionStateChange(callback: (isSessionReady: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(isSessionReady: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isSessionReady);
      } catch (error) {
        console.error('[AuthCoordinator] Error notifying listener:', error);
      }
    });
  }

  // Reset coordinator (for logout or errors)
  reset() {
    this.isSessionSyncing = false;
    this.sessionSyncPromise = null;
    this.notifyListeners(false);
  }
}

// Global singleton instance
export const authCoordinator = new AuthenticationCoordinator();