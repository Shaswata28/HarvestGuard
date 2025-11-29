import { describe, it, expect } from 'vitest';
import { cropTypes } from '@/data/mockData';

/**
 * Test suite for crop search/filter functionality
 * Requirements: 5.1, 5.2, 5.3
 */
describe('Crop Search/Filter Functionality', () => {
  /**
   * Test that search filter correctly filters crops by Bengali name
   * Requirement 5.2: WHEN a farmer enters search text THEN the System SHALL filter crop types matching the Bengali or English name
   */
  it('should filter crops by Bengali name', () => {
    const searchQuery = 'ধান';
    const filteredCrops = cropTypes.filter(crop => {
      const query = searchQuery.toLowerCase();
      return (
        crop.label_bn.toLowerCase().includes(query) ||
        crop.label_en.toLowerCase().includes(query)
      );
    });

    expect(filteredCrops.length).toBeGreaterThan(0);
    expect(filteredCrops.every(crop => crop.label_bn.toLowerCase().includes('ধান'))).toBe(true);
  });

  /**
   * Test that search filter correctly filters crops by English name
   * Requirement 5.2: WHEN a farmer enters search text THEN the System SHALL filter crop types matching the Bengali or English name
   */
  it('should filter crops by English name', () => {
    const searchQuery = 'rice';
    const filteredCrops = cropTypes.filter(crop => {
      const query = searchQuery.toLowerCase();
      return (
        crop.label_bn.toLowerCase().includes(query) ||
        crop.label_en.toLowerCase().includes(query)
      );
    });

    expect(filteredCrops.length).toBeGreaterThan(0);
    expect(filteredCrops.some(crop => crop.label_en.toLowerCase().includes('rice'))).toBe(true);
  });

  /**
   * Test that search is case-insensitive
   * Requirement 5.2: Filter should be case-insensitive
   */
  it('should filter crops case-insensitively', () => {
    const searchQueryLower = 'wheat';
    const searchQueryUpper = 'WHEAT';
    const searchQueryMixed = 'WhEaT';

    const filterCrops = (query: string) => cropTypes.filter(crop => {
      const q = query.toLowerCase();
      return (
        crop.label_bn.toLowerCase().includes(q) ||
        crop.label_en.toLowerCase().includes(q)
      );
    });

    const resultsLower = filterCrops(searchQueryLower);
    const resultsUpper = filterCrops(searchQueryUpper);
    const resultsMixed = filterCrops(searchQueryMixed);

    expect(resultsLower.length).toBe(resultsUpper.length);
    expect(resultsLower.length).toBe(resultsMixed.length);
    expect(resultsLower).toEqual(resultsUpper);
    expect(resultsLower).toEqual(resultsMixed);
  });

  /**
   * Test that clearing search returns all crops
   * Requirement 5.3: WHEN a farmer clears the search THEN the System SHALL display all available crop types again
   */
  it('should return all crops when search is cleared', () => {
    const filterCrops = (query: string) => {
      return cropTypes.filter(crop => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          crop.label_bn.toLowerCase().includes(q) ||
          crop.label_en.toLowerCase().includes(q)
        );
      });
    };

    // First filter with search query
    const filteredCrops = filterCrops('potato');
    expect(filteredCrops.length).toBeLessThan(cropTypes.length);

    // Clear search (empty string)
    const allCrops = filterCrops('');
    expect(allCrops.length).toBe(cropTypes.length);
    expect(allCrops).toEqual(cropTypes);
  });

  /**
   * Test that empty search returns all crops
   * Requirement 5.3: Empty search should show all crops
   */
  it('should return all crops when search query is empty', () => {
    const filterCrops = (query: string) => {
      return cropTypes.filter(crop => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          crop.label_bn.toLowerCase().includes(q) ||
          crop.label_en.toLowerCase().includes(q)
        );
      });
    };

    const filteredCrops = filterCrops('');
    expect(filteredCrops.length).toBe(cropTypes.length);
    expect(filteredCrops).toEqual(cropTypes);
  });

  /**
   * Test that partial matches work
   * Requirement 5.2: Search should support partial matching
   */
  it('should filter crops with partial matches', () => {
    const searchQuery = 'to'; // Should match "potato" and "tomato"
    const filteredCrops = cropTypes.filter(crop => {
      const query = searchQuery.toLowerCase();
      return (
        crop.label_bn?.toLowerCase().includes(query) ||
        crop.label_en?.toLowerCase().includes(query)
      );
    });

    expect(filteredCrops.length).toBeGreaterThan(0);
    expect(filteredCrops.some(crop => crop.id === 'potato' || crop.id === 'tomato')).toBe(true);
  });

  /**
   * Test that no results are returned for non-matching search
   */
  it('should return empty array for non-matching search', () => {
    const searchQuery = 'xyz123nonexistent';
    const filteredCrops = cropTypes.filter(crop => {
      const query = searchQuery.toLowerCase();
      return (
        crop.label_bn?.toLowerCase().includes(query) ||
        crop.label_en?.toLowerCase().includes(query)
      );
    });

    expect(filteredCrops.length).toBe(0);
  });
});
