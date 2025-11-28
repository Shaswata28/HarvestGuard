/**
 * Weather Service Tests
 * 
 * Basic tests to verify weather service functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase } from '../db/connection';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { WeatherSnapshotsRepository } from '../db/repositories/weatherSnapshots.repository';
import { getCurrentWeather, getWeatherForFarmer, generateAdvisories, getApiUsageStats } from './weather.service';
import { hashPassword } from '../utils/password';
import type { WeatherData } from '@shared/api';

describe('WeatherService', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('generateAdvisories', () => {
    it('should generate heat advisory for high temperature', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 38,
        feelsLike: 40,
        humidity: 60,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      expect(advisories.length).toBeGreaterThan(0);
      expect(advisories[0].type).toBe('heat');
      expect(advisories[0].severity).toBe('medium');
      expect(advisories[0].actions.length).toBeGreaterThan(0);
    });

    it('should generate rainfall advisory for heavy rain', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 28,
        feelsLike: 30,
        humidity: 85,
        pressure: 1010,
        windSpeed: 8,
        windDirection: 90,
        rainfall: 60,
        weatherCondition: 'Rain',
        weatherDescription: 'heavy rain',
        weatherIcon: '10d',
        visibility: 5000,
        cloudiness: 90,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      const rainfallAdvisory = advisories.find(a => a.type === 'rainfall');
      expect(rainfallAdvisory).toBeDefined();
      expect(rainfallAdvisory?.severity).toBe('medium');
    });

    it('should generate humidity advisory for high humidity', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 30,
        feelsLike: 35,
        humidity: 85,
        pressure: 1012,
        windSpeed: 3,
        windDirection: 45,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'overcast clouds',
        weatherIcon: '04d',
        visibility: 8000,
        cloudiness: 100,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      const humidityAdvisory = advisories.find(a => a.type === 'humidity');
      expect(humidityAdvisory).toBeDefined();
      expect(humidityAdvisory?.severity).toBe('medium');
    });

    it('should generate wind advisory for strong winds', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 32,
        feelsLike: 34,
        humidity: 70,
        pressure: 1008,
        windSpeed: 12,
        windDirection: 270,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 10,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      const windAdvisory = advisories.find(a => a.type === 'wind');
      expect(windAdvisory).toBeDefined();
      expect(windAdvisory?.severity).toBe('medium');
    });

    it('should prioritize high severity advisories first', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 42, // High severity
        feelsLike: 45,
        humidity: 85, // Medium severity
        pressure: 1010,
        windSpeed: 5,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      expect(advisories.length).toBeGreaterThan(1);
      expect(advisories[0].severity).toBe('high');
      expect(advisories[0].type).toBe('heat');
    });

    it('should return empty array for normal weather conditions', () => {
      const weatherData: WeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 28,
        feelsLike: 30,
        humidity: 70,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 20,
        sunrise: new Date().toISOString(),
        sunset: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        source: 'openweathermap'
      };

      const advisories = generateAdvisories(weatherData);
      
      expect(advisories).toEqual([]);
    });
  });

  describe('getWeatherForFarmer', () => {
    it('should throw NotFoundError for non-existent farmer', async () => {
      const nonExistentId = new ObjectId().toString();
      
      await expect(getWeatherForFarmer(nonExistentId)).rejects.toThrow('Farmer not found');
    });
  });

  describe('getApiUsageStats', () => {
    it('should return API usage statistics', () => {
      const stats = getApiUsageStats();
      
      expect(stats).toHaveProperty('dailyCallCount');
      expect(stats).toHaveProperty('dailyLimit');
      expect(stats).toHaveProperty('percentUsed');
      expect(stats).toHaveProperty('remainingCalls');
      expect(stats).toHaveProperty('warningThreshold');
      expect(stats).toHaveProperty('lastResetDate');
      
      expect(typeof stats.dailyCallCount).toBe('number');
      expect(typeof stats.dailyLimit).toBe('number');
      expect(typeof stats.percentUsed).toBe('number');
      expect(typeof stats.remainingCalls).toBe('number');
      expect(typeof stats.warningThreshold).toBe('number');
      expect(typeof stats.lastResetDate).toBe('string');
      
      expect(stats.dailyLimit).toBe(1000);
      expect(stats.warningThreshold).toBe(800);
      expect(stats.remainingCalls).toBeGreaterThanOrEqual(0);
      expect(stats.percentUsed).toBeGreaterThanOrEqual(0);
      expect(stats.percentUsed).toBeLessThanOrEqual(100);
    });

    it('should calculate percentUsed correctly', () => {
      const stats = getApiUsageStats();
      
      const expectedPercent = Math.round((stats.dailyCallCount / stats.dailyLimit) * 100);
      expect(stats.percentUsed).toBe(expectedPercent);
    });

    it('should calculate remainingCalls correctly', () => {
      const stats = getApiUsageStats();
      
      const expectedRemaining = Math.max(0, stats.dailyLimit - stats.dailyCallCount);
      expect(stats.remainingCalls).toBe(expectedRemaining);
    });
  });
});
