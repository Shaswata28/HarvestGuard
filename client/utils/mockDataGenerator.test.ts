/**
 * Tests for Mock Data Generator
 * Requirements: 3.1, 3.2, 3.6, 5.7, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import { generateMockNeighborData } from './mockDataGenerator';
import type { Location } from '../types/localRiskMap';

describe('generateMockNeighborData', () => {
  const testLocation: Location = {
    lat: 23.8103,
    lng: 90.4125,
    district: 'Dhaka',
    division: 'Dhaka',
  };

  it('should generate between 10-15 neighbors when count is not specified', () => {
    const neighbors = generateMockNeighborData(testLocation);
    expect(neighbors.length).toBeGreaterThanOrEqual(10);
    expect(neighbors.length).toBeLessThanOrEqual(15);
  });

  it('should generate exact count when specified', () => {
    const count = 12;
    const neighbors = generateMockNeighborData(testLocation, count);
    expect(neighbors.length).toBe(count);
  });

  it('should generate unique IDs for each neighbor', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    const ids = neighbors.map(n => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(neighbors.length);
  });

  it('should generate weather conditions within realistic ranges', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      expect(neighbor.mockWeather.temperature).toBeGreaterThanOrEqual(15);
      expect(neighbor.mockWeather.temperature).toBeLessThanOrEqual(45);
      expect(neighbor.mockWeather.humidity).toBeGreaterThanOrEqual(0);
      expect(neighbor.mockWeather.humidity).toBeLessThanOrEqual(100);
      expect(neighbor.mockWeather.rainfall).toBeGreaterThanOrEqual(0);
      expect(neighbor.mockWeather.rainfall).toBeLessThanOrEqual(100);
      expect(['sunny', 'rainy', 'cloudy', 'humid']).toContain(neighbor.mockWeather.condition);
    });
  });

  it('should generate valid crop information', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      expect(neighbor.mockCrop.cropType).toBeTruthy();
      expect(['field', 'warehouse', 'home']).toContain(neighbor.mockCrop.storageType);
      expect(['planted', 'growing', 'harvest-ready', 'harvested']).toContain(neighbor.mockCrop.cropStage);
    });
  });

  it('should calculate valid risk levels', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      expect(['Low', 'Medium', 'High']).toContain(neighbor.riskLevel);
    });
  });

  it('should not include personal identifiers or farm names', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      // Check that the neighbor object doesn't have personal identifier fields
      expect(neighbor).not.toHaveProperty('farmerName');
      expect(neighbor).not.toHaveProperty('farmName');
      expect(neighbor).not.toHaveProperty('ownerName');
      expect(neighbor).not.toHaveProperty('phoneNumber');
      expect(neighbor).not.toHaveProperty('address');
      
      // Verify only expected properties exist
      const expectedKeys = ['id', 'location', 'riskLevel', 'mockWeather', 'mockCrop'];
      const actualKeys = Object.keys(neighbor);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  it('should use farmer district and division for all neighbors', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      expect(neighbor.location.district).toBe(testLocation.district);
      expect(neighbor.location.division).toBe(testLocation.division);
    });
  });

  it('should generate coordinates near farmer location', () => {
    const neighbors = generateMockNeighborData(testLocation, 15);
    
    neighbors.forEach(neighbor => {
      // Coordinates should be within reasonable distance (roughly 15km radius)
      // At Bangladesh latitude, 15km ≈ 0.15 degrees
      const latDiff = Math.abs(neighbor.location.lat - testLocation.lat);
      const lngDiff = Math.abs(neighbor.location.lng - testLocation.lng);
      
      expect(latDiff).toBeLessThan(0.2); // Allow some margin
      expect(lngDiff).toBeLessThan(0.2);
    });
  });
});
