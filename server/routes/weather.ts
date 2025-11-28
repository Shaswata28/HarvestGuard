import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { validateQuery } from '../middleware/validation';
import {
  getCurrentWeather,
  getForecast,
  getWeatherForFarmer,
  generateAdvisories,
  getApiUsageStats
} from '../services/weather.service';
import {
  WeatherResponse,
  ForecastResponse,
  WeatherErrorResponse
} from '@shared/api';

/**
 * Validation schemas
 */
const currentWeatherQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional()
});

const forecastQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional()
});

const locationQuerySchema = z.object({
  lat: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, {
    message: 'Latitude must be a valid number between -90 and 90'
  }),
  lon: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, {
    message: 'Longitude must be a valid number between -180 and 180'
  })
});

/**
 * GET /api/weather/current
 * Get current weather data
 * 
 * Query params:
 * - farmerId (optional): Get weather for farmer's location
 * 
 * If no farmerId is provided, returns weather for default location (Dhaka)
 */
export const handleGetCurrentWeather: RequestHandler = async (req, res, next) => {
  try {
    const { farmerId } = req.query as { farmerId?: string };
    
    let weatherData;
    
    if (farmerId) {
      // Get weather for farmer's location
      weatherData = await getWeatherForFarmer(farmerId);
    } else {
      // Use default location (Dhaka)
      weatherData = await getCurrentWeather(23.8103, 90.4125);
    }
    
    // Generate advisories based on weather conditions
    const advisories = generateAdvisories(weatherData);
    
    const response: WeatherResponse = {
      success: true,
      data: weatherData,
      advisories: advisories.length > 0 ? advisories : undefined
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/weather/forecast
 * Get weather forecast data
 * 
 * Query params:
 * - farmerId (optional): Get forecast for farmer's location
 * 
 * If no farmerId is provided, returns forecast for default location (Dhaka)
 */
export const handleGetForecast: RequestHandler = async (req, res, next) => {
  try {
    const { farmerId } = req.query as { farmerId?: string };
    
    let lat: number;
    let lon: number;
    
    if (farmerId) {
      // Get farmer's location first
      const weatherData = await getWeatherForFarmer(farmerId);
      lat = weatherData.location.lat;
      lon = weatherData.location.lon;
    } else {
      // Use default location (Dhaka)
      lat = 23.8103;
      lon = 90.4125;
    }
    
    const forecastData = await getForecast(lat, lon);
    
    const response: ForecastResponse = {
      success: true,
      data: forecastData
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/weather/location
 * Get weather data for specific coordinates
 * 
 * Query params:
 * - lat (required): Latitude
 * - lon (required): Longitude
 */
export const handleGetWeatherByLocation: RequestHandler = async (req, res, next) => {
  try {
    const { lat, lon } = req.query as { lat: string; lon: string };
    
    const weatherData = await getCurrentWeather(parseFloat(lat), parseFloat(lon));
    
    // Generate advisories based on weather conditions
    const advisories = generateAdvisories(weatherData);
    
    const response: WeatherResponse = {
      success: true,
      data: weatherData,
      advisories: advisories.length > 0 ? advisories : undefined
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/weather/usage
 * Get API usage statistics for monitoring
 * 
 * Returns:
 * - dailyCallCount: Number of API calls made today
 * - dailyLimit: Maximum allowed API calls per day
 * - percentUsed: Percentage of daily limit used
 * - remainingCalls: Number of calls remaining today
 * - warningThreshold: Threshold at which warnings are logged
 * - lastResetDate: Date when the counter was last reset
 */
export const handleGetUsageStats: RequestHandler = async (req, res, next) => {
  try {
    const stats = getApiUsageStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: stats.percentUsed >= 80 
        ? 'Warning: API usage is approaching daily limit'
        : 'API usage is within normal limits'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the weather router
 */
export function createWeatherRouter(): Router {
  const router = Router();

  router.get('/current', validateQuery(currentWeatherQuerySchema), handleGetCurrentWeather);
  router.get('/forecast', validateQuery(forecastQuerySchema), handleGetForecast);
  router.get('/location', validateQuery(locationQuerySchema), handleGetWeatherByLocation);
  router.get('/usage', handleGetUsageStats);

  return router;
}
