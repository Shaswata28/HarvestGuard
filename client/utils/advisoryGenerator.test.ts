/**
 * Tests for Bangla Advisory Generator
 * Requirements: 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect } from 'vitest';
import { generateBanglaAdvisory, toBanglaNumerals } from './advisoryGenerator';
import type { WeatherConditions, CropInfo, RiskLevel } from '../types/localRiskMap';

describe('toBanglaNumerals', () => {
  it('should convert single digit numbers to Bangla', () => {
    expect(toBanglaNumerals(0)).toBe('০');
    expect(toBanglaNumerals(5)).toBe('৫');
    expect(toBanglaNumerals(9)).toBe('৯');
  });

  it('should convert multi-digit numbers to Bangla', () => {
    expect(toBanglaNumerals(85)).toBe('৮৫');
    expect(toBanglaNumerals(100)).toBe('১০০');
    expect(toBanglaNumerals(36)).toBe('৩৬');
  });

  it('should round decimal numbers', () => {
    expect(toBanglaNumerals(85.7)).toBe('৮৬');
    expect(toBanglaNumerals(36.2)).toBe('৩৬');
  });
});

describe('generateBanglaAdvisory', () => {
  describe('Rain advisories (Requirement 6.1)', () => {
    it('should generate urgent harvest advisory for high rain with harvest-ready crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 70,
        rainfall: 85,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      expect(advisory).toContain('বৃষ্টি');
      expect(advisory).toContain('৮৫%');
      expect(advisory).toContain('→');
      expect(advisory).toContain('ধান');
      expect(advisory).toContain('কাটুন');
    });

    it('should generate cover advisory for harvested crops with rain', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 70,
        rainfall: 75,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'field',
        cropStage: 'harvested'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      expect(advisory).toContain('বৃষ্টি');
      expect(advisory).toContain('→');
      expect(advisory).toContain('পাট');
      expect(advisory).toContain('ঢেকে রাখুন');
    });

    it('should generate drainage advisory for growing crops with rain', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 70,
        rainfall: 50,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'growing'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'Medium');
      
      expect(advisory).toContain('বৃষ্টি');
      expect(advisory).toContain('→');
      expect(advisory).toContain('জল জমতে দেবেন না');
    });
  });

  describe('Heat advisories (Requirement 6.2)', () => {
    it('should generate timing advisory for extreme heat with field storage', () => {
      const weather: WeatherConditions = {
        temperature: 39,
        humidity: 60,
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      expect(advisory).toContain('তাপমাত্রা');
      expect(advisory).toContain('৩৯°C');
      expect(advisory).toContain('→');
      expect(advisory).toContain('সকাল');
      expect(advisory).toContain('সন্ধ্যা');
    });

    it('should generate irrigation advisory for high heat with growing crops', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 60,
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'আলু',
        storageType: 'field',
        cropStage: 'growing'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'Medium');
      
      expect(advisory).toContain('তাপমাত্রা');
      expect(advisory).toContain('৩৬°C');
      expect(advisory).toContain('→');
      expect(advisory).toContain('সেচ');
    });
  });

  describe('Humidity advisories (Requirement 6.3)', () => {
    it('should generate drying advisory for high humidity with harvested crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 88,
        rainfall: 10,
        condition: 'humid'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'home',
        cropStage: 'harvested'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      expect(advisory).toContain('আর্দ্রতা');
      expect(advisory).toContain('৮৮%');
      expect(advisory).toContain('→');
      expect(advisory).toContain('শুকান');
      expect(advisory).toContain('ছত্রাক');
    });

    it('should generate pest monitoring advisory for high humidity with growing crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 85,
        rainfall: 10,
        condition: 'humid'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'field',
        cropStage: 'growing'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'Medium');
      
      expect(advisory).toContain('আর্দ্রতা');
      expect(advisory).toContain('৮৫%');
      expect(advisory).toContain('→');
      expect(advisory).toContain('পোকামাকড়');
    });
  });

  describe('Bangla numerals (Requirement 6.4)', () => {
    it('should use Bangla numerals for all numeric values', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 82,
        rainfall: 75,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      // Should contain Bangla numerals, not Western numerals
      expect(advisory).toMatch(/[০-৯]/);
      // Should not contain Western numerals in the main text
      expect(advisory.replace(/°C|%/g, '')).not.toMatch(/[0-9]/);
    });
  });

  describe('Arrow connector (Requirement 6.5)', () => {
    it('should use arrow symbol to connect conditions with actions', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 70,
        rainfall: 80,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      expect(advisory).toContain('→');
      // Format should be: [condition] → [action]
      const parts = advisory.split('→');
      expect(parts).toHaveLength(2);
      expect(parts[0].trim()).toBeTruthy(); // Condition part
      expect(parts[1].trim()).toBeTruthy(); // Action part
    });
  });

  describe('Threat prioritization (Requirement 6.6)', () => {
    it('should prioritize rain over heat when both are high', () => {
      const weather: WeatherConditions = {
        temperature: 38, // High heat
        humidity: 70,
        rainfall: 75, // High rain
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      // Should address rain, not heat
      expect(advisory).toContain('বৃষ্টি');
      expect(advisory).not.toContain('তাপমাত্রা');
    });

    it('should prioritize heat over humidity when both are high', () => {
      const weather: WeatherConditions = {
        temperature: 38, // High heat
        humidity: 85, // High humidity
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'growing'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'Medium');
      
      // Should address heat, not humidity
      expect(advisory).toContain('তাপমাত্রা');
      expect(advisory).not.toContain('আর্দ্রতা');
    });
  });

  describe('Simple Bangla text (Requirements 5.2, 5.4)', () => {
    it('should generate text in Bangla script', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 75,
        rainfall: 60,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      // Should contain Bangla characters
      expect(advisory).toMatch(/[\u0980-\u09FF]/);
    });

    it('should provide actionable recommendations', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 75,
        rainfall: 70,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'High');
      
      // Should contain action verbs (including variations)
      const actionVerbs = ['কাটুন', 'দিন', 'করুন', 'রাখুন', 'পরীক্ষা', 'নিন'];
      const hasAction = actionVerbs.some(verb => advisory.includes(verb));
      expect(hasAction).toBe(true);
    });
  });

  describe('Low risk scenarios', () => {
    it('should generate general advice for low risk with normal weather', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 65,
        rainfall: 15,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'growing'
      };

      const advisory = generateBanglaAdvisory(weather, crop, 'Low');
      
      expect(advisory).toContain('→');
      expect(advisory).toContain('ধান');
    });
  });
});
