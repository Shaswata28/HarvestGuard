import { offlineStorageService, PendingAction } from './offlineStorage';

/**
 * Sync Service
 * Handles synchronization of offline changes when connection is restored
 */
class SyncService {
  private isSyncing = false;
  private syncListeners: Array<(status: 'syncing' | 'complete' | 'error') => void> = [];

  /**
   * Add a listener for sync status changes
   */
  onSyncStatusChange(callback: (status: 'syncing' | 'complete' | 'error') => void) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(status: 'syncing' | 'complete' | 'error') {
    this.syncListeners.forEach(callback => callback(status));
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping');
      return { success: 0, failed: 0 };
    }

    const pendingActions = offlineStorageService.getPendingActions();
    if (pendingActions.length === 0) {
      console.log('[Sync] No pending actions to sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');
    console.log(`[Sync] Starting sync of ${pendingActions.length} actions`);

    let successCount = 0;
    let failedCount = 0;

    for (const action of pendingActions) {
      try {
        await this.syncAction(action);
        offlineStorageService.removeAction(action.id);
        successCount++;
        console.log(`[Sync] ✓ Synced action ${action.id}`);
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Sync] ✗ Failed to sync action ${action.id}:`, errorMessage);
        
        // Update retry count
        offlineStorageService.updateActionRetry(action.id, errorMessage);
        
        // Remove action if it has failed too many times
        if (action.retryCount >= 3) {
          console.log(`[Sync] Removing action ${action.id} after 3 failed attempts`);
          offlineStorageService.removeAction(action.id);
        }
      }
    }

    this.isSyncing = false;
    this.notifyListeners(failedCount > 0 ? 'error' : 'complete');
    console.log(`[Sync] Complete: ${successCount} success, ${failedCount} failed`);

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: PendingAction): Promise<void> {
    const { type, resource, data } = action;

    let url = '';
    let method = '';

    // Build API endpoint
    switch (resource) {
      case 'crop-batch':
        url = type === 'create' ? '/api/crop-batches' : `/api/crop-batches/${data._id}`;
        method = type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE';
        break;
      case 'health-scan':
        url = type === 'create' ? '/api/health-scans' : `/api/health-scans/${data._id}`;
        method = type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE';
        break;
      case 'advisory':
        url = type === 'create' ? '/api/advisories' : `/api/advisories/${data._id}`;
        method = type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE';
        break;
      default:
        throw new Error(`Unknown resource type: ${resource}`);
    }

    // Make API request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'delete' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
  }

  /**
   * Check if there are pending actions
   */
  hasPendingActions(): boolean {
    return offlineStorageService.getPendingActions().length > 0;
  }

  /**
   * Get count of pending actions
   */
  getPendingCount(): number {
    return offlineStorageService.getPendingActions().length;
  }
}

export const syncService = new SyncService();

