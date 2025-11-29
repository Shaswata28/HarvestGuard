import { describe, it, expect } from 'vitest';
import {
  calculateRiskScore,
  scoreToRiskLevel,
  calculateStorageRisk,
  calculateGrowingRisk,
  determineOverallRisk,
  RISK_THRESHOLDS,
  STORAGE_VULNERABILITY,
  type RiskLevel,
  type WeatherData,
  type RiskAssessment
} from './riskCalculator';
import type { CropBatch } from '../db/schemas';
import { ObjectId } from 'mongodb';

describe('Risk Calculator', () => {
  describe('RISK_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(RISK_THRESHOLDS.humidity.low).toBe(60);
      expect(RISK_THRESHOLDS.humidity.medium).toBe(70);
      expect(RISK_THRESHOLDS.humidity.high).toBe(80);
      expect(RISK_THRESHOLDS.humidity.critical).toBe(90);
      
      expect(RISK_THRESHOLDS.temperature.low).toBe(30);
      expect(RISK_THRESHOLDS.temperature.medium).toBe(35);
      expect(RISK_THRESHOLDS.temperature.high).toBe(38);
      expect(RISK_THRESHOLDS.temperature.critical).toBe(42);
      
      expect(RISK_THRESHOLDS.rainfall.low).toBe(20);
      expect(RISK_THRESHOLDS.rainfall.medium).toBe(50);
      expect(RISK_THRESHOLDS.rainfall.high).toBe(100);
      expect(RISK_THRESHOLDS.rainfall.critical).toBe(150);
      
      expect(RISK_THRESHOLDS.windSpeed.low).toBe(5);
      expect(RISK_THRESHOLDS.windSpeed.medium).toBe(10);
      expect(RISK_THRESHOLDS.windSpeed.high).toBe(15);
      expect(RISK_THRESHOLDS.windSpeed.critical).toBe(20);
    });
  });

  describe('STORAGE_VULNERABILITY', () => {
    it('should have correct vulnerability multipliers', () => {
      expect(STORAGE_VULNERABILITY.open_space).toBe(1.5);
      expect(STORAGE_VULNERABILITY.jute_bag).toBe(1.2);
      expect(STORAGE_VULNERABILITY.tin_shed).toBe(1.1);
      expect(STORAGE_VULNERABILITY.silo).toBe(1.0);
    });
  });

  describe('scoreToRiskLevel', () => {
    it('should return Low for scores below 40', () => {
      expect(scoreToRiskLevel(0)).toBe('Low');
      expect(scoreToRiskLevel(20)).toBe('Low');
      expect(scoreToRiskLevel(39)).toBe('Low');
    });

    it('should return Medium for scores 40-59', () => {
      expect(scoreToRiskLevel(40)).toBe('Medium');
      expect(scoreToRiskLevel(50)).toBe('Medium');
      expect(scoreToRiskLevel(59)).toBe('Medium');
    });

    it('should return High for scores 60-79', () => {
      expect(scoreToRiskLevel(60)).toBe('High');
      expect(scoreToRiskLevel(70)).toBe('High');
      expect(scoreToRiskLevel(79)).toBe('High');
    });

    it('should return Critical for scores 80+', () => {
      expect(scoreToRiskLevel(80)).toBe('Critical');
      expect(scoreToRiskLevel(90)).toBe('Critical');
      expect(scoreToRiskLevel(100)).toBe('Critical');
    });
  });

  describe('calculateRiskScore', () => {
    const createCropBatch = (overrides: Partial<CropBatch> = {}): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'rice',
      stage: 'growing',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
      temperature: 25,
      humidity: 50,
      rainfall: 0,
      windSpeed: 3,
      ...overrides
    });

    it('should return 0 for ideal weather conditions', () => {
      const crop = createCropBatch();
      const weather = createWeather();
      const score = calculateRiskScore(weather, crop);
      expect(score).toBe(0);
    });

    it('should calculate humidity contribution correctly', () => {
      const crop = createCropBatch();
      
      // Low humidity (60-70)
      let weather = createWeather({ humidity: 65 });
      expect(calculateRiskScore(weather, crop)).toBe(8);
      
      // Medium humidity (70-80)
      weather = createWeather({ humidity: 75 });
      expect(calculateRiskScore(weather, crop)).toBe(15);
      
      // High humidity (80-90)
      weather = createWeather({ humidity: 85 });
      expect(calculateRiskScore(weather, crop)).toBe(25);
      
      // Critical humidity (90+)
      weather = createWeather({ humidity: 95 });
      expect(calculateRiskScore(weather, crop)).toBe(35);
    });

    it('should calculate temperature contribution correctly', () => {
      const crop = createCropBatch();
      
      // Low temperature (30-35)
      let weather = createWeather({ temperature: 32 });
      expect(calculateRiskScore(weather, crop)).toBe(7);
      
      // Medium temperature (35-38)
      weather = createWeather({ temperature: 36 });
      expect(calculateRiskScore(weather, crop)).toBe(12);
      
      // High temperature (38-42)
      weather = createWeather({ temperature: 40 });
      expect(calculateRiskScore(weather, crop)).toBe(20);
      
      // Critical temperature (42+)
      weather = createWeather({ temperature: 45 });
      expect(calculateRiskScore(weather, crop)).toBe(30);
    });

    it('should calculate rainfall contribution correctly', () => {
      const crop = createCropBatch();
      
      // Low rainfall (20-50)
      let weather = createWeather({ rainfall: 30 });
      expect(calculateRiskScore(weather, crop)).toBe(5);
      
      // Medium rainfall (50-100)
      weather = createWeather({ rainfall: 75 });
      expect(calculateRiskScore(weather, crop)).toBe(10);
      
      // High rainfall (100-150)
      weather = createWeather({ rainfall: 120 });
      expect(calculateRiskScore(weather, crop)).toBe(18);
      
      // Critical rainfall (150+)
      weather = createWeather({ rainfall: 200 });
      expect(calculateRiskScore(weather, crop)).toBe(25);
    });

    it('should calculate wind contribution correctly', () => {
      const crop = createCropBatch();
      
      // Medium wind (10-15)
      let weather = createWeather({ windSpeed: 12 });
      expect(calculateRiskScore(weather, crop)).toBe(4);
      
      // High wind (15-20)
      weather = createWeather({ windSpeed: 17 });
      expect(calculateRiskScore(weather, crop)).toBe(7);
      
      // Critical wind (20+)
      weather = createWeather({ windSpeed: 25 });
      expect(calculateRiskScore(weather, crop)).toBe(10);
    });

    it('should combine multiple weather factors', () => {
      const crop = createCropBatch();
      const weather = createWeather({
        humidity: 85,    // 25 points
        temperature: 40, // 20 points
        rainfall: 120,   // 18 points
        windSpeed: 17    // 7 points
      });
      
      const score = calculateRiskScore(weather, crop);
      expect(score).toBe(70); // 25 + 20 + 18 + 7
    });

    it('should apply storage vulnerability multiplier for harvested crops', () => {
      const weather = createWeather({
        humidity: 85,    // 25 points
        temperature: 40  // 20 points
      });
      
      // Growing crop - no multiplier
      const growingCrop = createCropBatch({ stage: 'growing' });
      expect(calculateRiskScore(weather, growingCrop)).toBe(45);
      
      // Harvested in silo - 1.0x multiplier
      const siloCrop = createCropBatch({ 
        stage: 'harvested', 
        storageLocation: 'silo' 
      });
      expect(calculateRiskScore(weather, siloCrop)).toBe(45);
      
      // Harvested in tin shed - 1.1x multiplier
      const tinShedCrop = createCropBatch({ 
        stage: 'harvested', 
        storageLocation: 'tin_shed' 
      });
      expect(calculateRiskScore(weather, tinShedCrop)).toBe(50);
      
      // Harvested in jute bag - 1.2x multiplier
      const juteBagCrop = createCropBatch({ 
        stage: 'harvested', 
        storageLocation: 'jute_bag' 
      });
      expect(calculateRiskScore(weather, juteBagCrop)).toBe(54);
      
      // Harvested in open space - 1.5x multiplier
      const openSpaceCrop = createCropBatch({ 
        stage: 'harvested', 
        storageLocation: 'open_space' 
      });
      expect(calculateRiskScore(weather, openSpaceCrop)).toBe(68);
    });

    it('should cap score at 100', () => {
      const crop = createCropBatch({
        stage: 'harvested',
        storageLocation: 'open_space'
      });
      const weather = createWeather({
        humidity: 95,    // 40 points
        temperature: 45, // 30 points
        rainfall: 200,   // 20 points
        windSpeed: 25    // 10 points
      });
      
      // Base score: 100, with 1.5x multiplier = 150, should cap at 100
      const score = calculateRiskScore(weather, crop);
      expect(score).toBe(100);
    });

    it('should round scores to nearest integer', () => {
      const crop = createCropBatch({
        stage: 'harvested',
        storageLocation: 'tin_shed' // 1.1x multiplier
      });
      const weather = createWeather({
        humidity: 65 // 8 points
      });
      
      // 8 * 1.1 = 8.8 ≈ 9
      const score = calculateRiskScore(weather, crop);
      expect(score).toBe(9);
    });
  });

  describe('calculateStorageRisk', () => {
    const createCropBatch = (overrides: Partial<CropBatch> = {}): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'rice',
      stage: 'harvested',
      storageLocation: 'silo',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
      temperature: 25,
      humidity: 50,
      rainfall: 0,
      windSpeed: 3,
      ...overrides
    });

    it('should calculate storage risk with high humidity', () => {
      const crop = createCropBatch({ storageLocation: 'open_space' });
      const weather = createWeather({ humidity: 85, temperature: 32 });
      
      const assessment = calculateStorageRisk(crop, weather);
      
      expect(assessment.level).toBeDefined();
      expect(assessment.factors.length).toBeGreaterThan(0);
      expect(assessment.score).toBeGreaterThan(0);
      expect(assessment.primaryThreat).toBeDefined();
      
      // Should have humidity factor
      const humidityFactor = assessment.factors.find(f => f.type === 'humidity');
      expect(humidityFactor).toBeDefined();
      expect(humidityFactor?.severity).toBe(75);
    });

    it('should include storage vulnerability factor for non-silo storage', () => {
      const crop = createCropBatch({ storageLocation: 'open_space' });
      const weather = createWeather({ humidity: 85 });
      
      const assessment = calculateStorageRisk(crop, weather);
      
      const storageFactor = assessment.factors.find(f => f.type === 'storage');
      expect(storageFactor).toBeDefined();
      expect(storageFactor?.severity).toBe(50); // (1.5 - 1.0) * 100
    });

    it('should not include storage vulnerability factor for silo storage', () => {
      const crop = createCropBatch({ storageLocation: 'silo' });
      const weather = createWeather({ humidity: 85 });
      
      const assessment = calculateStorageRisk(crop, weather);
      
      const storageFactor = assessment.factors.find(f => f.type === 'storage');
      expect(storageFactor).toBeUndefined();
    });

    it('should calculate Critical risk for extreme conditions in open storage', () => {
      const crop = createCropBatch({ storageLocation: 'open_space' });
      const weather = createWeather({ 
        humidity: 95, 
        temperature: 45 
      });
      
      const assessment = calculateStorageRisk(crop, weather);
      
      expect(assessment.level).toBe('Critical');
      expect(assessment.factors.length).toBeGreaterThan(0);
    });

    it('should determine primary threat from highest severity factor', () => {
      const crop = createCropBatch();
      const weather = createWeather({ 
        humidity: 95,  // 100 severity
        temperature: 32 // 25 severity
      });
      
      const assessment = calculateStorageRisk(crop, weather);
      
      expect(assessment.primaryThreat).toContain('humidity');
    });

    it('should return Low risk for ideal conditions', () => {
      const crop = createCropBatch();
      const weather = createWeather();
      
      const assessment = calculateStorageRisk(crop, weather);
      
      expect(assessment.level).toBe('Low');
      expect(assessment.factors.length).toBe(0);
      expect(assessment.primaryThreat).toBe('No significant risk');
    });
  });

  describe('calculateGrowingRisk', () => {
    const createCropBatch = (overrides: Partial<CropBatch> = {}): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'rice',
      stage: 'growing',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
      temperature: 25,
      humidity: 50,
      rainfall: 0,
      windSpeed: 3,
      ...overrides
    });

    it('should calculate growing risk with heavy rainfall', () => {
      const crop = createCropBatch();
      const weather = createWeather({ rainfall: 120 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      expect(assessment.level).toBeDefined();
      expect(assessment.factors.length).toBeGreaterThan(0);
      
      const rainfallFactor = assessment.factors.find(f => f.type === 'rainfall');
      expect(rainfallFactor).toBeDefined();
      expect(rainfallFactor?.severity).toBe(75);
    });

    it('should calculate growing risk with high temperature', () => {
      const crop = createCropBatch();
      const weather = createWeather({ temperature: 40 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      const tempFactor = assessment.factors.find(f => f.type === 'temperature');
      expect(tempFactor).toBeDefined();
      expect(tempFactor?.severity).toBe(75);
    });

    it('should calculate growing risk with strong winds', () => {
      const crop = createCropBatch();
      const weather = createWeather({ windSpeed: 17 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      const windFactor = assessment.factors.find(f => f.type === 'wind');
      expect(windFactor).toBeDefined();
      expect(windFactor?.severity).toBe(75);
    });

    it('should include harvest timing factor when harvest is within 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const crop = createCropBatch({ expectedHarvestDate: futureDate });
      const weather = createWeather({ rainfall: 30 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      const harvestFactor = assessment.factors.find(f => f.type === 'harvest_timing');
      expect(harvestFactor).toBeDefined();
      expect(harvestFactor?.severity).toBe(50);
    });

    it('should not include harvest timing factor when harvest is more than 7 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const crop = createCropBatch({ expectedHarvestDate: futureDate });
      const weather = createWeather({ rainfall: 30 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      const harvestFactor = assessment.factors.find(f => f.type === 'harvest_timing');
      expect(harvestFactor).toBeUndefined();
    });

    it('should not include harvest timing factor when harvest date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      
      const crop = createCropBatch({ expectedHarvestDate: pastDate });
      const weather = createWeather({ rainfall: 30 });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      const harvestFactor = assessment.factors.find(f => f.type === 'harvest_timing');
      expect(harvestFactor).toBeUndefined();
    });

    it('should calculate High risk for extreme weather', () => {
      const crop = createCropBatch();
      const weather = createWeather({ 
        rainfall: 200,
        temperature: 45,
        windSpeed: 25
      });
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      expect(assessment.level).toBe('High');
      expect(assessment.score).toBeGreaterThanOrEqual(60);
      expect(assessment.factors.length).toBeGreaterThan(0);
    });

    it('should return Low risk for ideal conditions', () => {
      const crop = createCropBatch();
      const weather = createWeather();
      
      const assessment = calculateGrowingRisk(crop, weather);
      
      expect(assessment.level).toBe('Low');
      expect(assessment.factors.length).toBe(0);
      expect(assessment.primaryThreat).toBe('No significant risk');
    });
  });

  describe('determineOverallRisk', () => {
    const createAssessment = (level: RiskLevel, score: number): RiskAssessment => ({
      level,
      factors: [],
      score,
      primaryThreat: `${level} risk`
    });

    it('should return Low for empty assessments array', () => {
      const result = determineOverallRisk([]);
      expect(result).toBe('Low');
    });

    it('should return the highest risk level from multiple assessments', () => {
      const assessments = [
        createAssessment('Low', 20),
        createAssessment('High', 70),
        createAssessment('Medium', 50)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('High');
    });

    it('should return Critical when any assessment is Critical', () => {
      const assessments = [
        createAssessment('Low', 20),
        createAssessment('Medium', 50),
        createAssessment('Critical', 90)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Critical');
    });

    it('should handle single assessment', () => {
      const assessments = [createAssessment('Medium', 50)];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Medium');
    });

    it('should return Low when all assessments are Low', () => {
      const assessments = [
        createAssessment('Low', 10),
        createAssessment('Low', 20),
        createAssessment('Low', 30)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Low');
    });

    it('should prioritize Critical over High', () => {
      const assessments = [
        createAssessment('High', 70),
        createAssessment('Critical', 85)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Critical');
    });

    it('should prioritize High over Medium', () => {
      const assessments = [
        createAssessment('Medium', 50),
        createAssessment('High', 65)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('High');
    });

    it('should prioritize Medium over Low', () => {
      const assessments = [
        createAssessment('Low', 30),
        createAssessment('Medium', 45)
      ];
      
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Medium');
    });
  });

  describe('calculateStorageRisk', () => {
    const createCropBatch = (overrides: Partial<CropBatch> = {}): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'rice',
      stage: 'harvested',
      storageLocation: 'silo',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
      temperature: 25,
      humidity: 50,
      rainfall: 0,
      windSpeed: 3,
      ...overrides
    });

    it('should calculate storage risk with high humidity', () => {
      const crop = createCropBatch({ storageLocation: 'open_space' });
      const weather = createWeather({ humidity: 85, temperature: 32 });
      const assessment = calculateStorageRisk(crop, weather);
      expect(assessment.level).toBeDefined();
      expect(assessment.factors.length).toBeGreaterThan(0);
    });

    it('should calculate Critical risk for extreme conditions', () => {
      const crop = createCropBatch({ storageLocation: 'open_space' });
      const weather = createWeather({ humidity: 95, temperature: 45 });
      const assessment = calculateStorageRisk(crop, weather);
      expect(assessment.level).toBe('Critical');
    });
  });

  describe('calculateGrowingRisk', () => {
    const createCropBatch = (overrides: Partial<CropBatch> = {}): CropBatch => ({
      _id: new ObjectId(),
      farmerId: new ObjectId(),
      cropType: 'rice',
      stage: 'growing',
      enteredDate: new Date(),
      ...overrides
    });

    const createWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
      temperature: 25,
      humidity: 50,
      rainfall: 0,
      windSpeed: 3,
      ...overrides
    });

    it('should calculate growing risk with heavy rainfall', () => {
      const crop = createCropBatch();
      const weather = createWeather({ rainfall: 120 });
      const assessment = calculateGrowingRisk(crop, weather);
      expect(assessment.level).toBeDefined();
      expect(assessment.factors.length).toBeGreaterThan(0);
    });

    it('should calculate High risk for extreme weather', () => {
      const crop = createCropBatch();
      const weather = createWeather({ rainfall: 200, temperature: 45, windSpeed: 25 });
      const assessment = calculateGrowingRisk(crop, weather);
      expect(assessment.level).toBe('High');
      expect(assessment.score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('determineOverallRisk', () => {
    const createAssessment = (level: RiskLevel, score: number): RiskAssessment => ({
      level,
      factors: [],
      score,
      primaryThreat: `${level} risk`
    });

    it('should return Low for empty assessments array', () => {
      const result = determineOverallRisk([]);
      expect(result).toBe('Low');
    });

    it('should return the highest risk level from multiple assessments', () => {
      const assessments = [
        createAssessment('Low', 20),
        createAssessment('High', 70),
        createAssessment('Medium', 50)
      ];
      const result = determineOverallRisk(assessments);
      expect(result).toBe('High');
    });

    it('should return Critical when any assessment is Critical', () => {
      const assessments = [
        createAssessment('Low', 20),
        createAssessment('Medium', 50),
        createAssessment('Critical', 90)
      ];
      const result = determineOverallRisk(assessments);
      expect(result).toBe('Critical');
    });
  });
});
