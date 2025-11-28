import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheService, CacheEntry } from './cache';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

global.localStorage = localStorageMock as Storage;

describe('CacheService', () => {
  let cacheService: CacheService;
  const testFarmerId = 'farmer123';
  const testKey = 'profile';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    cacheService = new CacheService();
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve data correctly', () => {
      const testData = { name: 'Test Farmer', crops: 5 };
      
      cacheService.set(testKey, testData, testFarmerId);
      const result = cacheService.get<typeof testData>(testKey, testFarmerId);

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(testData);
      expect(result?.farmerId).toBe(testFarmerId);
      expect(result?.timestamp).toBe(Date.now());
    });

    it('should return null for non-existent cache', () => {
      const result = cacheService.get('nonexistent', testFarmerId);
      expect(result).toBeNull();
    });

    it('should scope cache by farmerId', () => {
      const farmer1Data = { name: 'Farmer 1' };
      const farmer2Data = { name: 'Farmer 2' };

      cacheService.set(testKey, farmer1Data, 'farmer1');
      cacheService.set(testKey, farmer2Data, 'farmer2');

      const result1 = cacheService.get<typeof farmer1Data>(testKey, 'farmer1');
      const result2 = cacheService.get<typeof farmer2Data>(testKey, 'farmer2');

      expect(result1?.data).toEqual(farmer1Data);
      expect(result2?.data).toEqual(farmer2Data);
    });

    it('should return null if farmerId does not match cached entry', () => {
      const testData = { name: 'Test' };
      
      cacheService.set(testKey, testData, 'farmer1');
      
      // Manually corrupt the cache to have wrong farmerId
      const cacheKey = 'harvestguard_profile_farmer1';
      const corrupted = { data: testData, timestamp: Date.now(), farmerId: 'farmer2' };
      localStorage.setItem(cacheKey, JSON.stringify(corrupted));
      
      const result = cacheService.get(testKey, 'farmer1');
      expect(result).toBeNull();
    });
  });

  describe('isStale', () => {
    it('should return false for fresh cache', () => {
      const entry: CacheEntry<any> = {
        data: {},
        timestamp: Date.now(),
        farmerId: testFarmerId,
      };

      const ttl = 5 * 60 * 1000; // 5 minutes
      expect(cacheService.isStale(entry, ttl)).toBe(false);
    });

    it('should return true for stale cache', () => {
      const entry: CacheEntry<any> = {
        data: {},
        timestamp: Date.now(),
        farmerId: testFarmerId,
      };

      const ttl = 5 * 60 * 1000; // 5 minutes
      
      // Advance time by 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      expect(cacheService.isStale(entry, ttl)).toBe(true);
    });

    it('should return false when exactly at TTL boundary', () => {
      const entry: CacheEntry<any> = {
        data: {},
        timestamp: Date.now(),
        farmerId: testFarmerId,
      };

      const ttl = 5 * 60 * 1000; // 5 minutes
      
      // Advance time by exactly 5 minutes
      vi.advanceTimersByTime(ttl);
      
      expect(cacheService.isStale(entry, ttl)).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should return correct age in milliseconds', () => {
      const entry: CacheEntry<any> = {
        data: {},
        timestamp: Date.now(),
        farmerId: testFarmerId,
      };

      // Advance time by 2 minutes
      const elapsed = 2 * 60 * 1000;
      vi.advanceTimersByTime(elapsed);

      expect(cacheService.getAge(entry)).toBe(elapsed);
    });
  });

  describe('clear', () => {
    it('should clear specific cache entry for farmerId', () => {
      const testData = { name: 'Test' };
      
      cacheService.set(testKey, testData, testFarmerId);
      expect(cacheService.get(testKey, testFarmerId)).not.toBeNull();
      
      cacheService.clear(testKey, testFarmerId);
      expect(cacheService.get(testKey, testFarmerId)).toBeNull();
    });

    it('should not affect other farmers cache when clearing', () => {
      cacheService.set(testKey, { name: 'Farmer 1' }, 'farmer1');
      cacheService.set(testKey, { name: 'Farmer 2' }, 'farmer2');

      cacheService.clear(testKey, 'farmer1');

      expect(cacheService.get(testKey, 'farmer1')).toBeNull();
      expect(cacheService.get(testKey, 'farmer2')).not.toBeNull();
    });

    it('should clear all entries with key when farmerId not provided', () => {
      cacheService.set(testKey, { name: 'Farmer 1' }, 'farmer1');
      cacheService.set(testKey, { name: 'Farmer 2' }, 'farmer2');

      cacheService.clear(testKey);

      expect(cacheService.get(testKey, 'farmer1')).toBeNull();
      expect(cacheService.get(testKey, 'farmer2')).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all cache entries', () => {
      cacheService.set('profile', { name: 'Test 1' }, 'farmer1');
      cacheService.set('dashboard', { crops: 5 }, 'farmer1');
      cacheService.set('profile', { name: 'Test 2' }, 'farmer2');

      cacheService.clearAll();

      expect(cacheService.get('profile', 'farmer1')).toBeNull();
      expect(cacheService.get('dashboard', 'farmer1')).toBeNull();
      expect(cacheService.get('profile', 'farmer2')).toBeNull();
    });

    it('should not clear non-harvestguard localStorage items', () => {
      localStorage.setItem('other_app_data', 'should remain');
      cacheService.set(testKey, { name: 'Test' }, testFarmerId);

      cacheService.clearAll();

      expect(localStorage.getItem('other_app_data')).toBe('should remain');
      expect(cacheService.get(testKey, testFarmerId)).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        cacheService.set(testKey, { large: 'data' }, testFarmerId);
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted cache data gracefully', () => {
      localStorage.setItem('harvestguard_profile_farmer123', 'invalid json');

      const result = cacheService.get(testKey, testFarmerId);
      expect(result).toBeNull();
    });
  });
});
