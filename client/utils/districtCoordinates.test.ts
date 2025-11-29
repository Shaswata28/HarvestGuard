/**
 * Tests for District Coordinate Lookup Utility
 * Requirements: 1.2, 2.3, 3.2
 */

import { describe, it, expect } from 'vitest';
import { getDistrictCenter, generateRandomCoordinateInDistrict, isWithinBangladeshBounds } from './districtCoordinates';

describe('getDistrictCenter', () => {
  it('should return correct coordinates for a valid district', () => {
    const [lat, lon] = getDistrictCenter('Dhaka', 'Dhaka');
    expect(lat).toBe(23.8103);
    expect(lon).toBe(90.4125);
  });

  it('should return correct coordinates for Chittagong district', () => {
    const [lat, lon] = getDistrictCenter('Chittagong', 'Chittagong');
    expect(lat).toBe(22.3569);
    expect(lon).toBe(91.7832);
  });

  it('should fallback to division center when district not found', () => {
    const [lat, lon] = getDistrictCenter('NonExistentDistrict', 'Dhaka');
    // Should return Dhaka division center
    expect(lat).toBe(23.8103);
    expect(lon).toBe(90.4125);
  });

  it('should fallback to default Bangladesh center when division not found', () => {
    const [lat, lon] = getDistrictCenter('NonExistentDistrict', 'NonExistentDivision');
    // Should return default location (Dhaka)
    expect(lat).toBe(23.8103);
    expect(lon).toBe(90.4125);
  });

  it('should handle various districts across different divisions', () => {
    // Test Rajshahi division
    const [lat1, lon1] = getDistrictCenter('Bogra', 'Rajshahi');
    expect(lat1).toBe(24.8465);
    expect(lon1).toBe(89.3770);

    // Test Khulna division
    const [lat2, lon2] = getDistrictCenter('Khulna', 'Khulna');
    expect(lat2).toBe(22.8456);
    expect(lon2).toBe(89.5403);

    // Test Sylhet division
    const [lat3, lon3] = getDistrictCenter('Sylhet', 'Sylhet');
    expect(lat3).toBe(24.8949);
    expect(lon3).toBe(91.8687);
  });

  it('should return coordinates as a tuple of two numbers', () => {
    const result = getDistrictCenter('Dhaka', 'Dhaka');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('number');
    expect(typeof result[1]).toBe('number');
  });
});

describe('isWithinBangladeshBounds', () => {
  it('should return true for coordinates within Bangladesh', () => {
    // Dhaka coordinates
    expect(isWithinBangladeshBounds(23.8103, 90.4125)).toBe(true);
    
    // Chittagong coordinates
    expect(isWithinBangladeshBounds(22.3569, 91.7832)).toBe(true);
    
    // Sylhet coordinates
    expect(isWithinBangladeshBounds(24.8949, 91.8687)).toBe(true);
  });

  it('should return false for coordinates outside Bangladesh', () => {
    // Too far north
    expect(isWithinBangladeshBounds(28.0, 90.0)).toBe(false);
    
    // Too far south
    expect(isWithinBangladeshBounds(19.0, 90.0)).toBe(false);
    
    // Too far east
    expect(isWithinBangladeshBounds(23.0, 94.0)).toBe(false);
    
    // Too far west
    expect(isWithinBangladeshBounds(23.0, 87.0)).toBe(false);
  });

  it('should handle boundary coordinates correctly', () => {
    // Minimum bounds
    expect(isWithinBangladeshBounds(20.0, 88.0)).toBe(true);
    
    // Maximum bounds
    expect(isWithinBangladeshBounds(27.0, 93.0)).toBe(true);
    
    // Just outside minimum
    expect(isWithinBangladeshBounds(19.9, 87.9)).toBe(false);
    
    // Just outside maximum
    expect(isWithinBangladeshBounds(27.1, 93.1)).toBe(false);
  });
});

describe('generateRandomCoordinateInDistrict', () => {
  it('should generate coordinates within Bangladesh bounds', () => {
    const centerLat = 23.8103; // Dhaka
    const centerLng = 90.4125;
    
    for (let i = 0; i < 20; i++) {
      const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng);
      expect(isWithinBangladeshBounds(lat, lng)).toBe(true);
    }
  });

  it('should generate coordinates within specified radius', () => {
    const centerLat = 23.8103; // Dhaka
    const centerLng = 90.4125;
    const radiusKm = 15;
    
    // Approximate conversion factors
    const KM_PER_DEGREE_LAT = 111;
    const KM_PER_DEGREE_LNG = 96;
    
    for (let i = 0; i < 20; i++) {
      const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng, radiusKm);
      
      // Calculate distance in km (approximate)
      const latDiff = Math.abs(lat - centerLat) * KM_PER_DEGREE_LAT;
      const lngDiff = Math.abs(lng - centerLng) * KM_PER_DEGREE_LNG;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // Allow small margin for rounding
      expect(distance).toBeLessThanOrEqual(radiusKm + 1);
    }
  });

  it('should generate different coordinates on multiple calls', () => {
    const centerLat = 23.8103;
    const centerLng = 90.4125;
    
    const coords1 = generateRandomCoordinateInDistrict(centerLat, centerLng);
    const coords2 = generateRandomCoordinateInDistrict(centerLat, centerLng);
    const coords3 = generateRandomCoordinateInDistrict(centerLat, centerLng);
    
    // At least one should be different (extremely unlikely all three are identical)
    const allSame = 
      coords1[0] === coords2[0] && coords1[1] === coords2[1] &&
      coords2[0] === coords3[0] && coords2[1] === coords3[1];
    
    expect(allSame).toBe(false);
  });

  it('should use default radius of 15km when not specified', () => {
    const centerLat = 23.8103;
    const centerLng = 90.4125;
    
    const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng);
    
    // Should generate valid coordinates
    expect(typeof lat).toBe('number');
    expect(typeof lng).toBe('number');
    expect(isWithinBangladeshBounds(lat, lng)).toBe(true);
  });

  it('should handle custom radius values', () => {
    const centerLat = 23.8103;
    const centerLng = 90.4125;
    const customRadius = 5;
    
    const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng, customRadius);
    
    // Calculate approximate distance
    const latDiff = Math.abs(lat - centerLat) * 111;
    const lngDiff = Math.abs(lng - centerLng) * 96;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    expect(distance).toBeLessThanOrEqual(customRadius + 1);
  });

  it('should return center coordinates as fallback if all attempts fail', () => {
    // Use coordinates outside Bangladesh to force fallback
    const centerLat = 50.0; // Far outside Bangladesh
    const centerLng = 100.0;
    
    const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng);
    
    // Should return center coordinates as fallback
    expect(lat).toBe(centerLat);
    expect(lng).toBe(centerLng);
  });

  it('should work with different district centers', () => {
    // Test with Chittagong
    const [lat1, lng1] = generateRandomCoordinateInDistrict(22.3569, 91.7832);
    expect(isWithinBangladeshBounds(lat1, lng1)).toBe(true);
    
    // Test with Sylhet
    const [lat2, lng2] = generateRandomCoordinateInDistrict(24.8949, 91.8687);
    expect(isWithinBangladeshBounds(lat2, lng2)).toBe(true);
    
    // Test with Khulna
    const [lat3, lng3] = generateRandomCoordinateInDistrict(22.8456, 89.5403);
    expect(isWithinBangladeshBounds(lat3, lng3)).toBe(true);
  });

  it('should return coordinates as a tuple of two numbers', () => {
    const result = generateRandomCoordinateInDistrict(23.8103, 90.4125);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('number');
    expect(typeof result[1]).toBe('number');
  });
});
