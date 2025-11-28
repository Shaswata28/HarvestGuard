import type {
  FarmerDashboardResponse,
  CropBatchResponse,
  HealthScanResponse,
} from '@shared/api';

/**
 * Cached data structure with timestamp and expiration
 */
interface CachedData<T> {
  data: T;
  timestamp: string;
  expiresAt: string;
}

/**
 * Pending action for offline sync queue
 */
export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'crop-batch' | 'health-scan' | 'advisory';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

/**
 * Cache expiration times (in milliseconds)
 */
const CACHE_EXPIRATION = {
  DASHBOARD: 5 * 60 * 1000,      // 5 minutes
  CROP_BATCHES: 10 * 60 * 1000,  // 10 minutes
  HEALTH_SCANS: 10 * 60 * 1000,  // 10 minutes
  WEATHER: 30 * 60 * 1000,       // 30 minutes
};

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  DASHBOARD: (farmerId: string) => `harvestguard_dashboard_${farmerId}`,
  CROPS: (farmerId: string) => `harvestguard_crops_${farmerId}`,
  SCANS: (farmerId: string) => `harvestguard_scans_${farmerId}`,
  WEATHER: (farmerId: string) => `harvestguard_weather_${farmerId}`,
  SYNC_QUEUE: 'harvestguard_sync_queue',
};

/**
 * Enhanced Offline Storage Service
 * Provides caching, sync queue, and cache expiration management
 */
export const offlineStorageService = {
  // Dashboard Data
  cacheDashboardData(farmerId: string, data: FarmerDashboardResponse): void {
    const cached: CachedData<FarmerDashboardResponse> = {
      data,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_EXPIRATION.DASHBOARD).toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.DASHBOARD(farmerId), JSON.stringify(cached));
  },

  getCachedDashboardData(farmerId: string): FarmerDashboardResponse | null {
    const stored = localStorage.getItem(STORAGE_KEYS.DASHBOARD(farmerId));
    if (!stored) return null;

    const cached: CachedData<FarmerDashboardResponse> = JSON.parse(stored);
    if (this.isCacheExpired(STORAGE_KEYS.DASHBOARD(farmerId), CACHE_EXPIRATION.DASHBOARD)) {
      return null;
    }
    return cached.data;
  },

  // Crop Batches
  cacheCropBatches(farmerId: string, batches: CropBatchResponse[]): void {
    const cached: CachedData<CropBatchResponse[]> = {
      data: batches,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_EXPIRATION.CROP_BATCHES).toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CROPS(farmerId), JSON.stringify(cached));
  },

  getCachedCropBatches(farmerId: string): CropBatchResponse[] | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CROPS(farmerId));
    if (!stored) return null;

    const cached: CachedData<CropBatchResponse[]> = JSON.parse(stored);
    if (this.isCacheExpired(STORAGE_KEYS.CROPS(farmerId), CACHE_EXPIRATION.CROP_BATCHES)) {
      return null;
    }
    return cached.data;
  },

  // Health Scans
  cacheHealthScans(farmerId: string, scans: HealthScanResponse[]): void {
    const cached: CachedData<HealthScanResponse[]> = {
      data: scans,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_EXPIRATION.HEALTH_SCANS).toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SCANS(farmerId), JSON.stringify(cached));
  },

  getCachedHealthScans(farmerId: string): HealthScanResponse[] | null {
    const stored = localStorage.getItem(STORAGE_KEYS.SCANS(farmerId));
    if (!stored) return null;

    const cached: CachedData<HealthScanResponse[]> = JSON.parse(stored);
    if (this.isCacheExpired(STORAGE_KEYS.SCANS(farmerId), CACHE_EXPIRATION.HEALTH_SCANS)) {
      return null;
    }
    return cached.data;
  },

  // Sync Queue Management
  queueAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): void {
    const queue = this.getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(newAction);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  getPendingActions(): PendingAction[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return stored ? JSON.parse(stored) : [];
  },

  updateActionRetry(actionId: string, error: string): void {
    const queue = this.getPendingActions();
    const updated = queue.map(action =>
      action.id === actionId
        ? { ...action, retryCount: action.retryCount + 1, lastError: error }
        : action
    );
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
  },

  removeAction(actionId: string): void {
    const queue = this.getPendingActions();
    const filtered = queue.filter(action => action.id !== actionId);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  },

  clearPendingActions(): void {
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  },

  // Cache Invalidation
  invalidateCache(farmerId: string): void {
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD(farmerId));
    localStorage.removeItem(STORAGE_KEYS.CROPS(farmerId));
    localStorage.removeItem(STORAGE_KEYS.SCANS(farmerId));
    localStorage.removeItem(STORAGE_KEYS.WEATHER(farmerId));
  },

  clearAllCache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('harvestguard_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  // Cache Expiration Check
  isCacheExpired(key: string, maxAgeMs: number): boolean {
    const stored = localStorage.getItem(key);
    if (!stored) return true;

    try {
      const cached: CachedData<any> = JSON.parse(stored);
      const expiresAt = new Date(cached.expiresAt).getTime();
      return Date.now() > expiresAt;
    } catch {
      return true;
    }
  },
};
