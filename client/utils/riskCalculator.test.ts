/**
 * Tests for Risk Calculator
 * Requirements: 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { calculateRiskLevel } from './riskCalculator';
import type { WeatherConditions, CropInfo } from '../types/localRiskMap';

describe('calculateRiskLevel', () => {
  describe('High Risk Conditions', () => {
    it('should return High for high rainfall with harvest-ready crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 60,
        rainfall: 85,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('High');
    });

    it('should return High for high rainfall with harvested crops', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 65,
        rainfall: 75,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'warehouse',
        cropStage: 'harvested'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('High');
    });

    it('should return High for extreme temperature with field storage', () => {
      const weather: WeatherConditions = {
        temperature: 40,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'আলু',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('High');
    });

    it('should return High for high humidity with harvested crops in home storage', () => {
      const weather: WeatherConditions = {
        temperature: 32,
        humidity: 90,
        rainfall: 30,
        condition: 'humid'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'home',
        cropStage: 'harvested'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('High');
    });
  });

  describe('Medium Risk Conditions', () => {
    it('should return Medium for moderate rainfall with harvest-ready crops', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 60,
        rainfall: 55,
        condition: 'cloudy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Medium');
    });

    it('should return Medium for high temperature (35-38°C) with field storage', () => {
      const weather: WeatherConditions = {
        temperature: 36,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'field',
        cropStage: 'growing'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Medium');
    });

    it('should return Medium for high humidity (75-85%) with harvested crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 80,
        rainfall: 20,
        condition: 'humid'
      };
      const crop: CropInfo = {
        cropType: 'আলু',
        storageType: 'warehouse',
        cropStage: 'harvested'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Medium');
    });

    it('should return Medium for moderate rainfall with harvested crops', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 65,
        rainfall: 50,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'warehouse',
        cropStage: 'harvested'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Medium');
    });

    it('should return Medium for high humidity with harvest-ready crops', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 85,
        rainfall: 20,
        condition: 'humid'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Medium');
    });
  });

  describe('Low Risk Conditions', () => {
    it('should return Low for planted crops with normal weather', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 60,
        rainfall: 20,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'planted'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Low');
    });

    it('should return Low for growing crops with normal weather', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 55,
        rainfall: 15,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'পাট',
        storageType: 'field',
        cropStage: 'growing'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Low');
    });

    it('should return Low for harvest-ready crops with low rainfall', () => {
      const weather: WeatherConditions = {
        temperature: 28,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'আলু',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Low');
    });

    it('should return Low for harvested crops in warehouse with good conditions', () => {
      const weather: WeatherConditions = {
        temperature: 25,
        humidity: 50,
        rainfall: 5,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'warehouse',
        cropStage: 'harvested'
      };
      
      expect(calculateRiskLevel(weather, crop)).toBe('Low');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return Medium for null weather', () => {
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'growing'
      };
      
      expect(calculateRiskLevel(null as any, crop)).toBe('Medium');
    });

    it('should return Medium for null crop', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 60,
        rainfall: 20,
        condition: 'sunny'
      };
      
      expect(calculateRiskLevel(weather, null as any)).toBe('Medium');
    });

    it('should return Medium for undefined inputs', () => {
      expect(calculateRiskLevel(undefined as any, undefined as any)).toBe('Medium');
    });

    it('should handle extreme weather values', () => {
      const weather: WeatherConditions = {
        temperature: 50,
        humidity: 100,
        rainfall: 100,
        condition: 'rainy'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };
      
      // Should still return a valid risk level
      const result = calculateRiskLevel(weather, crop);
      expect(['Low', 'Medium', 'High']).toContain(result);
    });

    it('should handle minimum weather values', () => {
      const weather: WeatherConditions = {
        temperature: 0,
        humidity: 0,
        rainfall: 0,
        condition: 'sunny'
      };
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'planted'
      };
      
      // Should still return a valid risk level
      const result = calculateRiskLevel(weather, crop);
      expect(['Low', 'Medium', 'High']).toContain(result);
    });
  });

  describe('Risk Calculation Considers All Factors (Requirement 3.4, 3.5)', () => {
    it('should consider temperature changes', () => {
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const lowTemp: WeatherConditions = {
        temperature: 25,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };

      const highTemp: WeatherConditions = {
        temperature: 40,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };

      const lowTempRisk = calculateRiskLevel(lowTemp, crop);
      const highTempRisk = calculateRiskLevel(highTemp, crop);

      // High temperature should result in higher risk
      expect(highTempRisk).toBe('High');
      expect(lowTempRisk).not.toBe('High');
    });

    it('should consider humidity changes', () => {
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'home',
        cropStage: 'harvested'
      };

      const lowHumidity: WeatherConditions = {
        temperature: 30,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };

      const highHumidity: WeatherConditions = {
        temperature: 30,
        humidity: 90,
        rainfall: 10,
        condition: 'humid'
      };

      const lowHumidityRisk = calculateRiskLevel(lowHumidity, crop);
      const highHumidityRisk = calculateRiskLevel(highHumidity, crop);

      // High humidity should result in higher risk
      expect(highHumidityRisk).toBe('High');
      expect(lowHumidityRisk).not.toBe('High');
    });

    it('should consider rainfall changes', () => {
      const crop: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const lowRainfall: WeatherConditions = {
        temperature: 28,
        humidity: 60,
        rainfall: 10,
        condition: 'sunny'
      };

      const highRainfall: WeatherConditions = {
        temperature: 28,
        humidity: 60,
        rainfall: 85,
        condition: 'rainy'
      };

      const lowRainfallRisk = calculateRiskLevel(lowRainfall, crop);
      const highRainfallRisk = calculateRiskLevel(highRainfall, crop);

      // High rainfall should result in higher risk
      expect(highRainfallRisk).toBe('High');
      expect(lowRainfallRisk).toBe('Low');
    });

    it('should consider storage type changes', () => {
      const weather: WeatherConditions = {
        temperature: 40,
        humidity: 50,
        rainfall: 10,
        condition: 'sunny'
      };

      const fieldStorage: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const warehouseStorage: CropInfo = {
        cropType: 'ধান',
        storageType: 'warehouse',
        cropStage: 'harvest-ready'
      };

      const fieldRisk = calculateRiskLevel(weather, fieldStorage);
      const warehouseRisk = calculateRiskLevel(weather, warehouseStorage);

      // Field storage with high temp should be higher risk
      expect(fieldRisk).toBe('High');
      expect(warehouseRisk).not.toBe('High');
    });

    it('should consider crop stage changes', () => {
      const weather: WeatherConditions = {
        temperature: 30,
        humidity: 60,
        rainfall: 80,
        condition: 'rainy'
      };

      const growing: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'growing'
      };

      const harvestReady: CropInfo = {
        cropType: 'ধান',
        storageType: 'field',
        cropStage: 'harvest-ready'
      };

      const growingRisk = calculateRiskLevel(weather, growing);
      const harvestReadyRisk = calculateRiskLevel(weather, harvestReady);

      // Harvest-ready crops with high rainfall should be higher risk
      expect(harvestReadyRisk).toBe('High');
      expect(growingRisk).not.toBe('High');
    });
  });

  describe('Risk Level Validity (Requirement 3.3)', () => {
    it('should always return a valid risk level', () => {
      const validRiskLevels = ['Low', 'Medium', 'High'];
      
      // Test various combinations
      const testCases = [
        {
          weather: { temperature: 25, humidity: 50, rainfall: 10, condition: 'sunny' as const },
          crop: { cropType: 'ধান', storageType: 'field' as const, cropStage: 'planted' as const }
        },
        {
          weather: { temperature: 35, humidity: 70, rainfall: 60, condition: 'rainy' as const },
          crop: { cropType: 'পাট', storageType: 'warehouse' as const, cropStage: 'harvest-ready' as const }
        },
        {
          weather: { temperature: 42, humidity: 90, rainfall: 90, condition: 'humid' as const },
          crop: { cropType: 'আলু', storageType: 'home' as const, cropStage: 'harvested' as const }
        }
      ];

      testCases.forEach(({ weather, crop }) => {
        const result = calculateRiskLevel(weather, crop);
        expect(validRiskLevels).toContain(result);
      });
    });
  });
});
