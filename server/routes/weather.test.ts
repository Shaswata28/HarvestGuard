import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
  handleGetCurrentWeather,
  handleGetForecast,
  handleGetWeatherByLocation,
  handleGetUsageStats
} from './weather';
import * as weatherService from '../services/weather.service';

// Mock the weather service
vi.mock('../services/weather.service', () => ({
  getCurrentWeather: vi.fn(),
  getForecast: vi.fn(),
  getWeatherForFarmer: vi.fn(),
  generateAdvisories: vi.fn(),
  getApiUsageStats: vi.fn()
}));

describe('Weather Routes', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockRequest = {
      query: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('handleGetCurrentWeather', () => {
    it('should return weather data for default location when no farmerId provided', async () => {
      const mockWeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 30,
        feelsLike: 32,
        humidity: 70,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: '2024-01-01T00:00:00.000Z',
        sunset: '2024-01-01T12:00:00.000Z',
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'openweathermap',
        cacheStatus: 'miss' as const
      };

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeatherData);
      vi.mocked(weatherService.generateAdvisories).mockReturnValue([]);

      await handleGetCurrentWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(23.8103, 90.4125);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData,
        advisories: undefined
      });
    });

    it('should return weather data for farmer location when farmerId provided', async () => {
      mockRequest.query = { farmerId: '507f1f77bcf86cd799439011' };

      const mockWeatherData = {
        location: { lat: 24.0, lon: 90.0 },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1012,
        windSpeed: 4,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 10000,
        cloudiness: 20,
        sunrise: '2024-01-01T00:00:00.000Z',
        sunset: '2024-01-01T12:00:00.000Z',
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'cache',
        cacheStatus: 'hit' as const
      };

      vi.mocked(weatherService.getWeatherForFarmer).mockResolvedValue(mockWeatherData);
      vi.mocked(weatherService.generateAdvisories).mockReturnValue([]);

      await handleGetCurrentWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getWeatherForFarmer).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData,
        advisories: undefined
      });
    });

    it('should include advisories when weather conditions warrant them', async () => {
      const mockWeatherData = {
        location: { lat: 23.8103, lon: 90.4125 },
        temperature: 38,
        feelsLike: 42,
        humidity: 85,
        pressure: 1010,
        windSpeed: 12,
        windDirection: 180,
        rainfall: 60,
        weatherCondition: 'Rain',
        weatherDescription: 'heavy rain',
        weatherIcon: '10d',
        visibility: 5000,
        cloudiness: 90,
        sunrise: '2024-01-01T00:00:00.000Z',
        sunset: '2024-01-01T12:00:00.000Z',
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'openweathermap',
        cacheStatus: 'miss' as const
      };

      const mockAdvisories = [
        {
          type: 'heat' as const,
          severity: 'medium' as const,
          title: 'High Temperature Alert',
          message: 'Temperature is 38.0°C',
          actions: ['Increase irrigation'],
          conditions: { temperature: 38 }
        }
      ];

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeatherData);
      vi.mocked(weatherService.generateAdvisories).mockReturnValue(mockAdvisories);

      await handleGetCurrentWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData,
        advisories: mockAdvisories
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Service error');
      vi.mocked(weatherService.getCurrentWeather).mockRejectedValue(error);

      await handleGetCurrentWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('handleGetForecast', () => {
    it('should return forecast data for default location when no farmerId provided', async () => {
      const mockForecastData = {
        location: { lat: 23.8103, lon: 90.4125 },
        daily: [
          {
            date: '2024-01-01T00:00:00.000Z',
            tempMin: 20,
            tempMax: 30,
            humidity: 70,
            rainfall: 0,
            weatherCondition: 'Clear',
            weatherDescription: 'clear sky',
            weatherIcon: '01d',
            precipitationProbability: 0
          }
        ],
        hourly: [
          {
            time: '2024-01-01T06:00:00.000Z',
            temperature: 25,
            humidity: 70,
            rainfall: 0,
            weatherCondition: 'Clear',
            windSpeed: 5
          }
        ],
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'openweathermap'
      };

      vi.mocked(weatherService.getForecast).mockResolvedValue(mockForecastData);

      await handleGetForecast(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getForecast).toHaveBeenCalledWith(23.8103, 90.4125);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockForecastData
      });
    });

    it('should return forecast data for farmer location when farmerId provided', async () => {
      mockRequest.query = { farmerId: '507f1f77bcf86cd799439011' };

      const mockWeatherData = {
        location: { lat: 24.0, lon: 90.0 },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1012,
        windSpeed: 4,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 10000,
        cloudiness: 20,
        sunrise: '2024-01-01T00:00:00.000Z',
        sunset: '2024-01-01T12:00:00.000Z',
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'cache',
        cacheStatus: 'hit' as const
      };

      const mockForecastData = {
        location: { lat: 24.0, lon: 90.0 },
        daily: [],
        hourly: [],
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'openweathermap'
      };

      vi.mocked(weatherService.getWeatherForFarmer).mockResolvedValue(mockWeatherData);
      vi.mocked(weatherService.getForecast).mockResolvedValue(mockForecastData);

      await handleGetForecast(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getWeatherForFarmer).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(weatherService.getForecast).toHaveBeenCalledWith(24.0, 90.0);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('handleGetWeatherByLocation', () => {
    it('should return weather data for specified coordinates', async () => {
      mockRequest.query = { lat: '23.5', lon: '90.5' };

      const mockWeatherData = {
        location: { lat: 23.5, lon: 90.5 },
        temperature: 29,
        feelsLike: 31,
        humidity: 72,
        pressure: 1013,
        windSpeed: 6,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: '2024-01-01T00:00:00.000Z',
        sunset: '2024-01-01T12:00:00.000Z',
        fetchedAt: '2024-01-01T06:00:00.000Z',
        source: 'openweathermap',
        cacheStatus: 'miss' as const
      };

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeatherData);
      vi.mocked(weatherService.generateAdvisories).mockReturnValue([]);

      await handleGetWeatherByLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(23.5, 90.5);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData,
        advisories: undefined
      });
    });
  });

  describe('handleGetUsageStats', () => {
    it('should return API usage statistics', async () => {
      const mockStats = {
        dailyCallCount: 250,
        dailyLimit: 1000,
        percentUsed: 25,
        remainingCalls: 750,
        warningThreshold: 800,
        lastResetDate: '2024-01-01'
      };

      vi.mocked(weatherService.getApiUsageStats).mockReturnValue(mockStats);

      await handleGetUsageStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(weatherService.getApiUsageStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        message: 'API usage is within normal limits'
      });
    });

    it('should return warning message when usage is above 80%', async () => {
      const mockStats = {
        dailyCallCount: 850,
        dailyLimit: 1000,
        percentUsed: 85,
        remainingCalls: 150,
        warningThreshold: 800,
        lastResetDate: '2024-01-01'
      };

      vi.mocked(weatherService.getApiUsageStats).mockReturnValue(mockStats);

      await handleGetUsageStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        message: 'Warning: API usage is approaching daily limit'
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Service error');
      vi.mocked(weatherService.getApiUsageStats).mockImplementation(() => {
        throw error;
      });

      await handleGetUsageStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
