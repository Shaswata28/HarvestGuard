/**
 * Cache Service for Profile Data
 * 
 * Provides localStorage-based caching with TTL and staleness detection.
 * All cache entries are scoped by farmerId to prevent data leakage between users.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  farmerId: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

/**
 * CacheService manages localStorage caching with farmerId scoping
 */
export class CacheService {
  private readonly prefix = 'harvestguard_';

  /**
   * Store data in cache with farmerId scope
   * @param key - Cache key (will be prefixed)
   * @param data - Data to cache
   * @param farmerId - Farmer ID for scoping
   */
  set<T>(key: string, data: T, farmerId: string): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      farmerId,
    };

    try {
      const cacheKey = this.getCacheKey(key, farmerId);
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to set cache:', error);
      // Silently fail - caching is not critical
    }
  }

  /**
   * Retrieve data from cache for specific farmerId
   * @param key - Cache key
   * @param farmerId - Farmer ID for scoping
   * @returns Cache entry or null if not found/invalid
   */
  get<T>(key: string, farmerId: string): CacheEntry<T> | null {
    try {
      const cacheKey = this.getCacheKey(key, farmerId);
      const item = localStorage.getItem(cacheKey);

      if (!item) {
        return null;
      }

      const entry = JSON.parse(item) as CacheEntry<T>;

      // Verify the cached data belongs to the correct farmer
      if (entry.farmerId !== farmerId) {
        console.warn('Cache farmerId mismatch, clearing invalid cache');
        this.clear(key, farmerId);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Check if a cache entry is stale based on TTL
   * @param entry - Cache entry to check
   * @param ttl - Time to live in milliseconds
   * @returns true if cache is stale
   */
  isStale(entry: CacheEntry<any>, ttl: number): boolean {
    const age = Date.now() - entry.timestamp;
    return age > ttl;
  }

  /**
   * Get the age of a cache entry in milliseconds
   * @param entry - Cache entry
   * @returns Age in milliseconds
   */
  getAge(entry: CacheEntry<any>): number {
    return Date.now() - entry.timestamp;
  }

  /**
   * Clear a specific cache entry
   * @param key - Cache key
   * @param farmerId - Farmer ID for scoping (optional, clears all if not provided)
   */
  clear(key: string, farmerId?: string): void {
    try {
      if (farmerId) {
        const cacheKey = this.getCacheKey(key, farmerId);
        localStorage.removeItem(cacheKey);
      } else {
        // Clear all entries with this key prefix
        const prefix = `${this.prefix}${key}_`;
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(prefix)) {
            keysToRemove.push(storageKey);
          }
        }
        
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Clear all cache entries (useful for logout)
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Generate a scoped cache key
   * @param key - Base key
   * @param farmerId - Farmer ID
   * @returns Scoped cache key
   */
  private getCacheKey(key: string, farmerId: string): string {
    return `${this.prefix}${key}_${farmerId}`;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
