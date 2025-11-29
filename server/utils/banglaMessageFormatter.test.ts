/**
 * Tests for Bangla Message Formatter Module
 */

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  containsBanglaText,
  formatStorageAdvisory,
  formatGrowingAdvisory,
  type AdvisoryMessage
} from './banglaMessageFormatter';
import type { CropBatch } from '../db/schemas';
import type { WeatherData, RiskLevel } from './riskCalculator';

describe('banglaMessageFormatter', () => {
  describe('containsBanglaText', () => {
    it('should return true for text with Bangla characters', () => {
      expect(containsBanglaText('আপনার ফসল')).toBe(true);
      expect(containsBanglaText('Hello আপনার')).toBe(true);
      expect(containsBanglaText('১২৩')).toBe(true);
    });

    it('should return false for text without Bangla characters', () => {
      expect(containsBanglaText('Hello World')).toBe(false);
      expect(containsBanglaText('123')).toBe(false);
      expect(containsBanglaText('')).toBe(false);
    });
  });

  describe('formatStorageAdvisory', () => {
    const createStorageCrop = (overrides?: Partial<CropBatch>): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'ধান',
      stage: 'harvested' as const,
      storageLocation: 'silo' as const,
      storageDivision: 'ঢাকা',
      storageDistrict: 'ঢাকা',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides?: Partial<WeatherData>): WeatherData => ({
      temperature: 32,
      humidity: 75,
      rainfall: 10,
      windSpeed: 5,
      ...overrides
    });

    it('should include crop type in message', () => {
      const crop = createStorageCrop({ cropType: 'ধান' });
      const weather = createWeather();
      const result = formatStorageAdvisory(crop, weather, 'Medium');

      expect(result.message).toContain('ধান');
    });

    it('should include weather conditions in message', () => {
      const crop = createStorageCrop();
      const weather = createWeather({ temperature: 35, humidity: 85, rainfall: 25 });
      const result = formatStorageAdvisory(crop, weather, 'High');

      expect(result.message).toContain('35');
      expect(result.message).toContain('85');
      expect(result.message).toContain('25');
    });

    it('should include storage location type in message', () => {
      const crop = createStorageCrop({ storageLocation: 'open_space' });
      const weather = createWeather();
      const result = formatStorageAdvisory(crop, weather, 'Medium');

      expect(result.message).toContain('খোলা জায়গা');
    });

    it('should include division and district in message', () => {
      const crop = createStorageCrop({ 
        storageDivision: 'ঢাকা',
        storageDistrict: 'গাজীপুর'
      });
      const weather = createWeather();
      const result = formatStorageAdvisory(crop, weather, 'Medium');

      expect(result.message).toContain('গাজীপুর');
      expect(result.message).toContain('ঢাকা');
    });

    it('should format message in Bangla', () => {
      const crop = createStorageCrop();
      const weather = createWeather();
      const result = formatStorageAdvisory(crop, weather, 'Medium');

      expect(containsBanglaText(result.message)).toBe(true);
    });

    it('should generate ventilation actions for high humidity and temperature', () => {
      const crop = createStorageCrop();
      const weather = createWeather({ humidity: 85, temperature: 32 });
      const result = formatStorageAdvisory(crop, weather, 'High');

      const actionsText = result.actions.join(' ');
      expect(actionsText).toMatch(/ফ্যান|বায়ুচলাচল/);
    });

    it('should generate protective actions for rainfall in open storage', () => {
      const crop = createStorageCrop({ storageLocation: 'open_space' });
      const weather = createWeather({ rainfall: 30 });
      const result = formatStorageAdvisory(crop, weather, 'High');

      const actionsText = result.actions.join(' ');
      expect(actionsText).toMatch(/ঢেকে|সুরক্ষা/);
    });

    it('should include at least 2 action items', () => {
      const crop = createStorageCrop();
      const weather = createWeather();
      const result = formatStorageAdvisory(crop, weather, 'Low');

      expect(result.actions.length).toBeGreaterThanOrEqual(2);
    });

    it('should include at most 5 action items', () => {
      const crop = createStorageCrop({ storageLocation: 'open_space' });
      const weather = createWeather({ 
        humidity: 95, 
        temperature: 40, 
        rainfall: 100,
        windSpeed: 15
      });
      const result = formatStorageAdvisory(crop, weather, 'Critical');

      expect(result.actions.length).toBeLessThanOrEqual(5);
    });

    it('should have all actions in Bangla', () => {
      const crop = createStorageCrop();
      const weather = createWeather({ humidity: 85 });
      const result = formatStorageAdvisory(crop, weather, 'High');

      result.actions.forEach(action => {
        expect(containsBanglaText(action)).toBe(true);
      });
    });
  });

  describe('formatGrowingAdvisory', () => {
    const createGrowingCrop = (overrides?: Partial<CropBatch>): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'ধান',
      stage: 'growing' as const,
      estimatedWeightKg: 100,
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides?: Partial<WeatherData>): WeatherData => ({
      temperature: 32,
      humidity: 75,
      rainfall: 10,
      windSpeed: 5,
      ...overrides
    });

    it('should include crop type in message', () => {
      const crop = createGrowingCrop({ cropType: 'গম' });
      const weather = createWeather();
      const result = formatGrowingAdvisory(crop, weather, 'Medium');

      expect(result.message).toContain('গম');
    });

    it('should include weather conditions in message', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ 
        temperature: 38, 
        humidity: 80, 
        rainfall: 60,
        windSpeed: 12
      });
      const result = formatGrowingAdvisory(crop, weather, 'High');

      expect(result.message).toContain('38');
      expect(result.message).toContain('80');
      expect(result.message).toContain('60');
      expect(result.message).toContain('12');
    });

    it('should reference harvest date if within 7 days', () => {
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() + 5); // 5 days from now
      
      const crop = createGrowingCrop({ expectedHarvestDate: harvestDate });
      const weather = createWeather();
      const result = formatGrowingAdvisory(crop, weather, 'Medium');

      expect(result.message).toMatch(/\d+ দিনের মধ্যে কাটার সময়/);
    });

    it('should not reference harvest date if more than 7 days away', () => {
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() + 10); // 10 days from now
      
      const crop = createGrowingCrop({ expectedHarvestDate: harvestDate });
      const weather = createWeather();
      const result = formatGrowingAdvisory(crop, weather, 'Medium');

      expect(result.message).not.toMatch(/দিনের মধ্যে কাটার সময়/);
    });

    it('should format message in Bangla', () => {
      const crop = createGrowingCrop();
      const weather = createWeather();
      const result = formatGrowingAdvisory(crop, weather, 'Medium');

      expect(containsBanglaText(result.message)).toBe(true);
    });

    it('should generate drainage actions for heavy rainfall', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ rainfall: 60 });
      const result = formatGrowingAdvisory(crop, weather, 'High');

      const actionsText = result.actions.join(' ');
      expect(actionsText).toMatch(/নিষ্কাশন|বিলম্বিত/);
    });

    it('should generate irrigation actions for high temperature', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ temperature: 38 });
      const result = formatGrowingAdvisory(crop, weather, 'High');

      const actionsText = result.actions.join(' ');
      expect(actionsText).toMatch(/সেচ|ছায়া/);
    });

    it('should generate staking actions for strong winds', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ windSpeed: 12 });
      const result = formatGrowingAdvisory(crop, weather, 'High');

      const actionsText = result.actions.join(' ');
      expect(actionsText).toMatch(/খুঁটি|বেঁধে/);
    });

    it('should include at least 2 action items', () => {
      const crop = createGrowingCrop();
      const weather = createWeather();
      const result = formatGrowingAdvisory(crop, weather, 'Low');

      expect(result.actions.length).toBeGreaterThanOrEqual(2);
    });

    it('should include at most 5 action items', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ 
        humidity: 85, 
        temperature: 40, 
        rainfall: 80,
        windSpeed: 15
      });
      const result = formatGrowingAdvisory(crop, weather, 'Critical');

      expect(result.actions.length).toBeLessThanOrEqual(5);
    });

    it('should have all actions in Bangla', () => {
      const crop = createGrowingCrop();
      const weather = createWeather({ temperature: 38 });
      const result = formatGrowingAdvisory(crop, weather, 'High');

      result.actions.forEach(action => {
        expect(containsBanglaText(action)).toBe(true);
      });
    });
  });
});
