import { describe, it, expect } from 'vitest';
import {
  isValidBangladeshCoordinates,
  getCoordinatesForLocation,
  roundCoordinates,
  validateAndSanitizeCoordinates,
  getAvailableDivisions,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  generateLocationCacheKey
} from './location';
import { DEFAULT_LOCATION } from '../data/bangladesh-locations';

describe('Location utilities', () => {
  describe('isValidBangladeshCoordinates', () => {
    it('should validate coordinates within Bangladesh bounds', () => {
      expect(isValidBangladeshCoordinates(23.8103, 90.4125)).toBe(true); // Dhaka
      expect(isValidBangladeshCoordinates(22.3569, 91.7832)).toBe(true); // Chittagong
      expect(isValidBangladeshCoordinates(24.8949, 91.8687)).toBe(true); // Sylhet
    });

    it('should reject coordinates outside Bangladesh bounds', () => {
      expect(isValidBangladeshCoordinates(10.0, 90.0)).toBe(false); // Too far south
      expect(isValidBangladeshCoordinates(30.0, 90.0)).toBe(false); // Too far north
      expect(isValidBangladeshCoordinates(23.0, 80.0)).toBe(false); // Too far west
      expect(isValidBangladeshCoordinates(23.0, 100.0)).toBe(false); // Too far east
    });

    it('should validate boundary coordinates', () => {
      expect(isValidBangladeshCoordinates(20.0, 88.0)).toBe(true); // Min bounds
      expect(isValidBangladeshCoordinates(27.0, 93.0)).toBe(true); // Max bounds
    });
  });

  describe('getCoordinatesForLocation', () => {
    it('should return district coordinates for valid division and district', () => {
      const coords = getCoordinatesForLocation('Dhaka', 'Dhaka');
      expect(coords).toEqual({ lat: 23.8103, lon: 90.4125 });
    });

    it('should return upazila coordinates when upazila is provided', () => {
      const coords = getCoordinatesForLocation('Dhaka', 'Dhaka', 'Savar');
      expect(coords).toEqual({ lat: 23.8583, lon: 90.2667 });
    });

    it('should fall back to district coordinates when upazila not found', () => {
      const coords = getCoordinatesForLocation('Dhaka', 'Dhaka', 'NonExistentUpazila');
      expect(coords).toEqual({ lat: 23.8103, lon: 90.4125 }); // District coordinates
    });

    it('should return default location when division not found', () => {
      const coords = getCoordinatesForLocation('InvalidDivision', 'SomeDistrict');
      expect(coords).toEqual(DEFAULT_LOCATION);
    });

    it('should return default location when district not found', () => {
      const coords = getCoordinatesForLocation('Dhaka', 'InvalidDistrict');
      expect(coords).toEqual(DEFAULT_LOCATION);
    });

    it('should handle multiple divisions correctly', () => {
      const dhakaCoords = getCoordinatesForLocation('Dhaka', 'Gazipur');
      const chittagongCoords = getCoordinatesForLocation('Chittagong', 'Chittagong');
      const rajshahiCoords = getCoordinatesForLocation('Rajshahi', 'Rajshahi');

      expect(dhakaCoords).toEqual({ lat: 23.9999, lon: 90.4203 });
      expect(chittagongCoords).toEqual({ lat: 22.3569, lon: 91.7832 });
      expect(rajshahiCoords).toEqual({ lat: 24.3745, lon: 88.6042 });
    });
  });

  describe('roundCoordinates', () => {
    it('should round coordinates to 2 decimal places by default', () => {
      const rounded = roundCoordinates(23.81034567, 90.41256789);
      expect(rounded).toEqual({ lat: 23.81, lon: 90.41 });
    });

    it('should round coordinates to specified decimal places', () => {
      const rounded1 = roundCoordinates(23.81034567, 90.41256789, 1);
      expect(rounded1).toEqual({ lat: 23.8, lon: 90.4 });

      const rounded3 = roundCoordinates(23.81034567, 90.41256789, 3);
      expect(rounded3).toEqual({ lat: 23.810, lon: 90.413 });
    });

    it('should handle coordinates that do not need rounding', () => {
      const rounded = roundCoordinates(23.81, 90.41);
      expect(rounded).toEqual({ lat: 23.81, lon: 90.41 });
    });
  });

  describe('validateAndSanitizeCoordinates', () => {
    it('should return valid coordinates within Bangladesh bounds', () => {
      const coords = validateAndSanitizeCoordinates(23.8103, 90.4125);
      expect(coords).toEqual({ lat: 23.8103, lon: 90.4125 });
    });

    it('should return default location for coordinates outside Bangladesh', () => {
      const coords = validateAndSanitizeCoordinates(10.0, 90.0);
      expect(coords).toEqual(DEFAULT_LOCATION);
    });

    it('should return default location for invalid coordinate types', () => {
      const coords1 = validateAndSanitizeCoordinates(NaN, 90.0);
      expect(coords1).toEqual(DEFAULT_LOCATION);

      const coords2 = validateAndSanitizeCoordinates(23.0, NaN);
      expect(coords2).toEqual(DEFAULT_LOCATION);
    });
  });

  describe('getAvailableDivisions', () => {
    it('should return all division names', () => {
      const divisions = getAvailableDivisions();
      expect(divisions).toContain('Dhaka');
      expect(divisions).toContain('Chittagong');
      expect(divisions).toContain('Rajshahi');
      expect(divisions).toContain('Khulna');
      expect(divisions).toContain('Barisal');
      expect(divisions).toContain('Sylhet');
      expect(divisions).toContain('Rangpur');
      expect(divisions).toContain('Mymensingh');
      expect(divisions.length).toBe(8);
    });
  });

  describe('getDistrictsForDivision', () => {
    it('should return districts for a valid division', () => {
      const districts = getDistrictsForDivision('Dhaka');
      expect(districts).toContain('Dhaka');
      expect(districts).toContain('Gazipur');
      expect(districts).toContain('Tangail');
      expect(districts.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid division', () => {
      const districts = getDistrictsForDivision('InvalidDivision');
      expect(districts).toEqual([]);
    });
  });

  describe('getUpazilasForDistrict', () => {
    it('should return upazilas for a valid district with upazila data', () => {
      const upazilas = getUpazilasForDistrict('Dhaka', 'Dhaka');
      expect(upazilas).toContain('Savar');
      expect(upazilas).toContain('Dhamrai');
      expect(upazilas.length).toBeGreaterThan(0);
    });

    it('should return empty array for district without upazila data', () => {
      const upazilas = getUpazilasForDistrict('Dhaka', 'Kishoreganj');
      expect(upazilas).toEqual([]);
    });

    it('should return empty array for invalid division', () => {
      const upazilas = getUpazilasForDistrict('InvalidDivision', 'SomeDistrict');
      expect(upazilas).toEqual([]);
    });

    it('should return empty array for invalid district', () => {
      const upazilas = getUpazilasForDistrict('Dhaka', 'InvalidDistrict');
      expect(upazilas).toEqual([]);
    });
  });

  describe('generateLocationCacheKey', () => {
    it('should generate consistent cache keys for same coordinates', () => {
      const key1 = generateLocationCacheKey(23.8103, 90.4125);
      const key2 = generateLocationCacheKey(23.8103, 90.4125);
      expect(key1).toBe(key2);
    });

    it('should generate same cache key for coordinates that round to same value', () => {
      const key1 = generateLocationCacheKey(23.81034, 90.41256);
      const key2 = generateLocationCacheKey(23.81045, 90.41248);
      expect(key1).toBe(key2);
      expect(key1).toBe('23.81,90.41');
    });

    it('should generate different cache keys for different coordinates', () => {
      const key1 = generateLocationCacheKey(23.81, 90.41);
      const key2 = generateLocationCacheKey(23.82, 90.42);
      expect(key1).not.toBe(key2);
    });
  });
});
