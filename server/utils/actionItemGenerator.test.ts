/**
 * Tests for Action Item Generator Module
 */

import { describe, it, expect } from 'vitest';
import { generateActionItems, containsBanglaText } from './actionItemGenerator';
import type { CropBatch } from '../db/schemas';
import type { WeatherData, RiskLevel } from './riskCalculator';

describe('actionItemGenerator', () => {
  describe('containsBanglaText', () => {
    it('should return true for text with Bangla characters', () => {
      expect(containsBanglaText('ফসল')).toBe(true);
      expect(containsBanglaText('আবহাওয়া')).toBe(true);
      expect(containsBanglaText('Mixed text with বাংলা')).toBe(true);
    });

    it('should return false for text without Bangla characters', () => {
      expect(containsBanglaText('Hello')).toBe(false);
      expect(containsBanglaText('123')).toBe(false);
      expect(containsBanglaText('')).toBe(false);
    });
  });

  describe('generateActionItems', () => {
    describe('action count validation', () => {
      it('should generate at least 2 action items', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'silo',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 25,
          humidity: 50,
          rainfall: 0,
          windSpeed: 3
        };

        const actions = generateActionItems(crop, weather, 'Low');
        expect(actions.length).toBeGreaterThanOrEqual(2);
      });

      it('should generate at most 5 action items', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 42,
          humidity: 95,
          rainfall: 150,
          windSpeed: 20
        };

        const actions = generateActionItems(crop, weather, 'Critical');
        expect(actions.length).toBeLessThanOrEqual(5);
      });
    });

    describe('Bangla text validation', () => {
      it('should generate all actions in Bangla', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'silo',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 35,
          humidity: 85,
          rainfall: 50,
          windSpeed: 12
        };

        const actions = generateActionItems(crop, weather, 'High');
        actions.forEach(action => {
          expect(containsBanglaText(action)).toBe(true);
        });
      });
    });

    describe('storage-specific actions', () => {
      it('should generate ventilation actions for high humidity and temperature', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'silo',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 35,
          humidity: 85,
          rainfall: 0,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'High');
        const hasVentilationAction = actions.some(action => 
          action.includes('ফ্যান') || action.includes('বায়ুচলাচল')
        );
        expect(hasVentilationAction).toBe(true);
      });

      it('should generate protective actions for rainfall in open storage', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 30,
          humidity: 70,
          rainfall: 50,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'Medium');
        const hasProtectiveAction = actions.some(action => 
          action.includes('ঢেকে') || action.includes('সুরক্ষা') || action.includes('সরান')
        );
        expect(hasProtectiveAction).toBe(true);
      });

      it('should include equipment-specific terms for storage risks', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'tin_shed',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 36,
          humidity: 88,
          rainfall: 0,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'High');
        const hasEquipmentTerm = actions.some(action => 
          action.includes('ফ্যান') || action.includes('শুকিয়ে')
        );
        expect(hasEquipmentTerm).toBe(true);
      });
    });

    describe('growing crop actions', () => {
      it('should generate drainage actions for heavy rainfall', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'growing',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 30,
          humidity: 75,
          rainfall: 100,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'High');
        const hasDrainageAction = actions.some(action => 
          action.includes('নিষ্কাশন') || action.includes('পানি')
        );
        expect(hasDrainageAction).toBe(true);
      });

      it('should generate irrigation actions for high temperature', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'growing',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 40,
          humidity: 60,
          rainfall: 0,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'High');
        const hasIrrigationAction = actions.some(action => 
          action.includes('সেচ') || action.includes('ছায়া')
        );
        expect(hasIrrigationAction).toBe(true);
      });

      it('should generate staking actions for strong winds', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'growing',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 30,
          humidity: 65,
          rainfall: 10,
          windSpeed: 15
        };

        const actions = generateActionItems(crop, weather, 'Medium');
        const hasStakingAction = actions.some(action => 
          action.includes('খুঁটি') || action.includes('বেঁধে')
        );
        expect(hasStakingAction).toBe(true);
      });
    });

    describe('action prioritization', () => {
      it('should prioritize critical actions first', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 42,
          humidity: 95,
          rainfall: 150,
          windSpeed: 20
        };

        const actions = generateActionItems(crop, weather, 'Critical');
        // First action should be the critical/urgent one
        expect(actions[0]).toContain('জরুরি');
      });

      it('should prioritize rainfall protection for open storage', () => {
        const crop: CropBatch = {
          farmerId: '507f1f77bcf86cd799439011' as any,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          plantingDate: new Date('2024-01-01'),
          expectedHarvestDate: new Date('2024-06-01'),
          actualHarvestDate: new Date('2024-06-01'),
          quantity: 100,
          unit: 'kg'
        };

        const weather: WeatherData = {
          temperature: 30,
          humidity: 70,
          rainfall: 100,
          windSpeed: 5
        };

        const actions = generateActionItems(crop, weather, 'High');
        // One of the top actions should be about covering/protecting
        const topActions = actions.slice(0, 2);
        const hasProtection = topActions.some(action => 
          action.includes('ঢেকে') || action.includes('সরান')
        );
        expect(hasProtection).toBe(true);
      });
    });
  });
});
