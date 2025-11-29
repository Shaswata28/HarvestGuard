import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeCropHistory,
  getFrequentCropTypes,
  hasUsedCropType,
  sortCropTypesByHistory,
  fetchCropHistory,
  type CropHistory,
} from './cropHistory';
import type { CropBatchResponse } from '@shared/api';

describe('cropHistory', () => {
  describe('analyzeCropHistory', () => {
    it('should return empty history for empty batches array', () => {
      const result = analyzeCropHistory([]);
      
      expect(result).toEqual({
        uniqueCropTypes: [],
        cropUsageStats: [],
        totalBatches: 0,
      });
    });

    it('should return empty history for null/undefined batches', () => {
      const result = analyzeCropHistory(null as any);
      
      expect(result).toEqual({
        uniqueCropTypes: [],
        cropUsageStats: [],
        totalBatches: 0,
      });
    });

    it('should track unique crop types from batches', () => {
      const batches: CropBatchResponse[] = [
        {
          _id: '1',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'growing',
          enteredDate: '2025-01-01T00:00:00Z',
        },
        {
          _id: '2',
          farmerId: 'farmer1',
          cropType: 'wheat',
          stage: 'harvested',
          enteredDate: '2025-01-02T00:00:00Z',
        },
        {
          _id: '3',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'harvested',
          enteredDate: '2025-01-03T00:00:00Z',
        },
      ];

      const result = analyzeCropHistory(batches);

      expect(result.uniqueCropTypes).toContain('rice');
      expect(result.uniqueCropTypes).toContain('wheat');
      expect(result.uniqueCropTypes.length).toBe(2);
      expect(result.totalBatches).toBe(3);
    });

    it('should count crop usage correctly', () => {
      const batches: CropBatchResponse[] = [
        {
          _id: '1',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'growing',
          enteredDate: '2025-01-01T00:00:00Z',
        },
        {
          _id: '2',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'harvested',
          enteredDate: '2025-01-02T00:00:00Z',
        },
        {
          _id: '3',
          farmerId: 'farmer1',
          cropType: 'wheat',
          stage: 'growing',
          enteredDate: '2025-01-03T00:00:00Z',
        },
      ];

      const result = analyzeCropHistory(batches);

      const riceStats = result.cropUsageStats.find(s => s.cropType === 'rice');
      const wheatStats = result.cropUsageStats.find(s => s.cropType === 'wheat');

      expect(riceStats?.count).toBe(2);
      expect(wheatStats?.count).toBe(1);
    });

    it('should sort crops by usage frequency (descending)', () => {
      const batches: CropBatchResponse[] = [
        {
          _id: '1',
          farmerId: 'farmer1',
          cropType: 'wheat',
          stage: 'growing',
          enteredDate: '2025-01-01T00:00:00Z',
        },
        {
          _id: '2',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'harvested',
          enteredDate: '2025-01-02T00:00:00Z',
        },
        {
          _id: '3',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'growing',
          enteredDate: '2025-01-03T00:00:00Z',
        },
        {
          _id: '4',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'harvested',
          enteredDate: '2025-01-04T00:00:00Z',
        },
      ];

      const result = analyzeCropHistory(batches);

      // Rice should be first (3 uses), wheat second (1 use)
      expect(result.uniqueCropTypes[0]).toBe('rice');
      expect(result.uniqueCropTypes[1]).toBe('wheat');
    });

    it('should track most recent usage date for each crop', () => {
      const batches: CropBatchResponse[] = [
        {
          _id: '1',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'growing',
          enteredDate: '2025-01-01T00:00:00Z',
        },
        {
          _id: '2',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'harvested',
          enteredDate: '2025-01-05T00:00:00Z',
        },
        {
          _id: '3',
          farmerId: 'farmer1',
          cropType: 'rice',
          stage: 'growing',
          enteredDate: '2025-01-03T00:00:00Z',
        },
      ];

      const result = analyzeCropHistory(batches);

      const riceStats = result.cropUsageStats.find(s => s.cropType === 'rice');
      expect(riceStats?.lastUsed).toBe('2025-01-05T00:00:00Z');
    });
  });

  describe('getFrequentCropTypes', () => {
    it('should return crops used more than once', () => {
      const history: CropHistory = {
        uniqueCropTypes: ['rice', 'wheat', 'jute'],
        cropUsageStats: [
          { cropType: 'rice', count: 3, lastUsed: '2025-01-01T00:00:00Z' },
          { cropType: 'wheat', count: 1, lastUsed: '2025-01-02T00:00:00Z' },
          { cropType: 'jute', count: 2, lastUsed: '2025-01-03T00:00:00Z' },
        ],
        totalBatches: 6,
      };

      const result = getFrequentCropTypes(history);

      expect(result).toContain('rice');
      expect(result).toContain('jute');
      expect(result).not.toContain('wheat');
      expect(result.length).toBe(2);
    });

    it('should return empty array when no crops used more than once', () => {
      const history: CropHistory = {
        uniqueCropTypes: ['rice', 'wheat'],
        cropUsageStats: [
          { cropType: 'rice', count: 1, lastUsed: '2025-01-01T00:00:00Z' },
          { cropType: 'wheat', count: 1, lastUsed: '2025-01-02T00:00:00Z' },
        ],
        totalBatches: 2,
      };

      const result = getFrequentCropTypes(history);

      expect(result).toEqual([]);
    });
  });

  describe('hasUsedCropType', () => {
    const history: CropHistory = {
      uniqueCropTypes: ['rice', 'wheat'],
      cropUsageStats: [
        { cropType: 'rice', count: 2, lastUsed: '2025-01-01T00:00:00Z' },
        { cropType: 'wheat', count: 1, lastUsed: '2025-01-02T00:00:00Z' },
      ],
      totalBatches: 3,
    };

    it('should return true for used crop types', () => {
      expect(hasUsedCropType(history, 'rice')).toBe(true);
      expect(hasUsedCropType(history, 'wheat')).toBe(true);
    });

    it('should return false for unused crop types', () => {
      expect(hasUsedCropType(history, 'jute')).toBe(false);
      expect(hasUsedCropType(history, 'potato')).toBe(false);
    });
  });

  describe('sortCropTypesByHistory', () => {
    const history: CropHistory = {
      uniqueCropTypes: ['rice', 'wheat', 'jute'],
      cropUsageStats: [
        { cropType: 'rice', count: 3, lastUsed: '2025-01-03T00:00:00Z' },
        { cropType: 'wheat', count: 2, lastUsed: '2025-01-02T00:00:00Z' },
        { cropType: 'jute', count: 1, lastUsed: '2025-01-01T00:00:00Z' },
      ],
      totalBatches: 6,
    };

    it('should prioritize previously used crops', () => {
      const allCrops = ['potato', 'rice', 'tomato', 'wheat', 'corn', 'jute'];
      const result = sortCropTypesByHistory(allCrops, history);

      // Previously used crops should come first
      expect(result.indexOf('rice')).toBeLessThan(result.indexOf('potato'));
      expect(result.indexOf('wheat')).toBeLessThan(result.indexOf('tomato'));
      expect(result.indexOf('jute')).toBeLessThan(result.indexOf('corn'));
    });

    it('should maintain frequency order for used crops', () => {
      const allCrops = ['potato', 'rice', 'wheat', 'jute', 'corn'];
      const result = sortCropTypesByHistory(allCrops, history);

      // Rice (3 uses) should come before wheat (2 uses) and jute (1 use)
      expect(result.indexOf('rice')).toBeLessThan(result.indexOf('wheat'));
      expect(result.indexOf('wheat')).toBeLessThan(result.indexOf('jute'));
    });

    it('should handle empty history', () => {
      const emptyHistory: CropHistory = {
        uniqueCropTypes: [],
        cropUsageStats: [],
        totalBatches: 0,
      };

      const allCrops = ['rice', 'wheat', 'jute'];
      const result = sortCropTypesByHistory(allCrops, emptyHistory);

      // Should return crops in original order when no history
      expect(result).toEqual(allCrops);
    });

    it('should handle crops not in history', () => {
      const allCrops = ['rice', 'potato', 'wheat'];
      const result = sortCropTypesByHistory(allCrops, history);

      // Used crops first, then unused
      expect(result.indexOf('rice')).toBe(0);
      expect(result.indexOf('wheat')).toBe(1);
      expect(result.indexOf('potato')).toBe(2);
    });
  });
});
