/**
 * Weather Service
 * 
 * Provides weather data with intelligent caching to minimize API calls.
 * Implements cache-first strategy with fallback to OpenWeatherMap API.
 * 
 * Features:
 * - Cache-first data retrieval
 * - Coordinate rounding for cache key generation
 * - Request deduplication for concurrent calls
 * - Automatic fallback to cached data on API failure
 * - Farming advisory generation based on weather conditions
 */

import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/connection';
import { WeatherSnapshotsRepository } from '../db/repositories/weatherSnapshots.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { getOpenWeatherClient, OpenWeatherError } from '../utils/openweather.client';
import { 
  getCoordinatesForLocation, 
  roundCoordinates, 
  validateAndSanitizeCoordinates
} from '../utils/location';
import { DEFAULT_LOCATION } from '../data/bangladesh-locations';
import { WeatherData, ForecastData, Advisory, Coordinates } from '@shared/api';
import { WeatherSnapshot } from '../db/schemas';
import { NotFoundError } from '../utils/errors';

/**
 * In-memory map to track pending API requests for deduplication
 * Key: "lat,lon" string
 * Value: Promise of weather data
 */
const pendingRequests = new Map<string, Promise<WeatherData>>();

/**
 * In-memory counter for API calls (resets on server restart)
 * In production, this should be persisted to database or Redis
 */
let dailyApiCallCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * Cache TTL configuration (in seconds)
 */
const CACHE_TTL = parseInt(process.env.WEATHER_CACHE_TTL || '3600', 10); // 1 hour default
const CACHE_EXTENDED_TTL = parseInt(process.env.WEATHER_CACHE_EXTENDED_TTL || '7200', 10); // 2 hours
const API_DAILY_LIMIT = parseInt(process.env.WEATHER_API_DAILY_LIMIT || '1000', 10);
const API_WARNING_THRESHOLD = parseInt(process.env.WEATHER_API_WARNING_THRESHOLD || '800', 10);

/**
 * Resets the daily API call counter if it's a new day
 */
function resetDailyCounterIfNeeded(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    console.log(`Resetting daily API call counter. Previous count: ${dailyApiCallCount}`);
    dailyApiCallCount = 0;
    lastResetDate = today;
  }
}

/**
 * Increments the API call counter and logs warnings if approaching limits
 */
function incrementApiCallCounter(): void {
  resetDailyCounterIfNeeded();
  dailyApiCallCount++;
  
  const percentUsed = Math.round((dailyApiCallCount / API_DAILY_LIMIT) * 100);
  
  console.log(
    `API call #${dailyApiCallCount} (${percentUsed}% of daily limit) - ` +
    `${new Date().toISOString()}`
  );
  
  // Log warning at 80% threshold
  if (dailyApiCallCount === API_WARNING_THRESHOLD) {
    console.warn(
      `⚠️  WARNING: API usage has reached ${API_WARNING_THRESHOLD} calls (80% of daily limit). ` +
      `Remaining calls: ${API_DAILY_LIMIT - dailyApiCallCount}. ` +
      `Cache TTL will be extended to reduce API usage.`
    );
  }
  
  // Log critical warning at 90%
  if (dailyApiCallCount === Math.floor(API_DAILY_LIMIT * 0.9)) {
    console.error(
      `🚨 CRITICAL: API usage has reached ${dailyApiCallCount} calls (90% of daily limit). ` +
      `Only ${API_DAILY_LIMIT - dailyApiCallCount} calls remaining today!`
    );
  }
  
  // Log when limit is reached
  if (dailyApiCallCount >= API_DAILY_LIMIT) {
    console.error(
      `❌ LIMIT REACHED: Daily API limit of ${API_DAILY_LIMIT} calls has been reached. ` +
      `All subsequent requests will use cached data only.`
    );
  }
}

/**
 * Gets the current API usage statistics
 */
export function getApiUsageStats(): {
  dailyCallCount: number;
  dailyLimit: number;
  percentUsed: number;
  remainingCalls: number;
  warningThreshold: number;
  lastResetDate: string;
} {
  resetDailyCounterIfNeeded();
  
  return {
    dailyCallCount: dailyApiCallCount,
    dailyLimit: API_DAILY_LIMIT,
    percentUsed: Math.round((dailyApiCallCount / API_DAILY_LIMIT) * 100),
    remainingCalls: Math.max(0, API_DAILY_LIMIT - dailyApiCallCount),
    warningThreshold: API_WARNING_THRESHOLD,
    lastResetDate
  };
}

/**
 * Converts OpenWeatherMap API response to WeatherData format
 */
function convertToWeatherData(
  apiResponse: any,
  coordinates: Coordinates,
  cacheStatus: 'hit' | 'miss' | 'expired' = 'miss'
): WeatherData {
  return {
    location: coordinates,
    temperature: apiResponse.main.temp,
    feelsLike: apiResponse.main.feels_like,
    humidity: apiResponse.main.humidity,
    pressure: apiResponse.main.pressure,
    windSpeed: apiResponse.wind.speed,
    windDirection: apiResponse.wind.deg,
    rainfall: apiResponse.rain?.['1h'] || 0,
    weatherCondition: apiResponse.weather[0].main,
    weatherDescription: apiResponse.weather[0].description,
    weatherIcon: apiResponse.weather[0].icon,
    visibility: apiResponse.visibility,
    cloudiness: apiResponse.clouds.all,
    sunrise: new Date(apiResponse.sys.sunrise * 1000).toISOString(),
    sunset: new Date(apiResponse.sys.sunset * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    source: 'openweathermap',
    cacheStatus
  };
}

/**
 * Converts WeatherSnapshot from database to WeatherData format
 */
function convertSnapshotToWeatherData(
  snapshot: WeatherSnapshot,
  cacheStatus: 'hit' | 'expired' = 'hit'
): WeatherData {
  return {
    location: {
      lat: snapshot.location.coordinates[1],
      lon: snapshot.location.coordinates[0]
    },
    temperature: snapshot.temperature,
    feelsLike: snapshot.feelsLike,
    humidity: snapshot.humidity,
    pressure: snapshot.pressure,
    windSpeed: snapshot.windSpeed,
    windDirection: snapshot.windDirection,
    rainfall: snapshot.rainfall,
    weatherCondition: snapshot.weatherCondition,
    weatherDescription: snapshot.weatherDescription,
    weatherIcon: snapshot.weatherIcon,
    visibility: snapshot.visibility,
    cloudiness: snapshot.cloudiness,
    sunrise: snapshot.sunrise.toISOString(),
    sunset: snapshot.sunset.toISOString(),
    fetchedAt: snapshot.fetchedAt.toISOString(),
    source: 'cache',
    cacheStatus
  };
}

/**
 * Creates a WeatherSnapshot object for database storage
 */
function createWeatherSnapshot(
  weatherData: WeatherData,
  ttl: number = CACHE_TTL
): Omit<WeatherSnapshot, '_id'> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);

  return {
    location: {
      type: 'Point',
      coordinates: [weatherData.location.lon, weatherData.location.lat]
    },
    temperature: weatherData.temperature,
    feelsLike: weatherData.feelsLike,
    humidity: weatherData.humidity,
    pressure: weatherData.pressure,
    windSpeed: weatherData.windSpeed,
    windDirection: weatherData.windDirection,
    rainfall: weatherData.rainfall,
    weatherCondition: weatherData.weatherCondition,
    weatherDescription: weatherData.weatherDescription,
    weatherIcon: weatherData.weatherIcon,
    visibility: weatherData.visibility,
    cloudiness: weatherData.cloudiness,
    sunrise: new Date(weatherData.sunrise),
    sunset: new Date(weatherData.sunset),
    fetchedAt: now,
    expiresAt,
    source: 'openweathermap',
    apiCallCount: 1
  };
}

/**
 * Determines the appropriate cache TTL based on current API usage
 */
function determineCacheTTL(): number {
  resetDailyCounterIfNeeded();
  
  // If approaching API limit, extend cache TTL
  if (dailyApiCallCount >= API_WARNING_THRESHOLD) {
    return CACHE_EXTENDED_TTL;
  }
  
  return CACHE_TTL;
}

/**
 * Gets current weather data for a location with cache-first strategy
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  // Validate and sanitize coordinates
  const validCoords = validateAndSanitizeCoordinates(lat, lon);
  
  // Round coordinates for cache key
  const roundedCoords = roundCoordinates(validCoords.lat, validCoords.lon);
  const cacheKey = `${roundedCoords.lat},${roundedCoords.lon}`;
  
  // Check if there's already a pending request for this location
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log(`Deduplicating request for location ${cacheKey}`);
    return pendingRequest;
  }
  
  // Create a new request promise
  const requestPromise = (async () => {
    try {
      const db = getDatabase();
      const repository = new WeatherSnapshotsRepository(db);
      
      // Check cache first
      const cachedSnapshot = await repository.findByLocation(
        roundedCoords.lat,
        roundedCoords.lon,
        CACHE_TTL
      );
      
      if (cachedSnapshot) {
        console.log(`Cache hit for location ${cacheKey}`);
        return convertSnapshotToWeatherData(cachedSnapshot, 'hit');
      }
      
      console.log(`Cache miss for location ${cacheKey}, fetching from API`);
      
      // Check if we've reached the daily API limit
      resetDailyCounterIfNeeded();
      if (dailyApiCallCount >= API_DAILY_LIMIT) {
        console.error(
          `Daily API limit reached (${dailyApiCallCount}/${API_DAILY_LIMIT}). ` +
          `Attempting to use stale cache data.`
        );
        
        // Try to return stale cache data
        const staleSnapshot = await repository.findByLocation(
          roundedCoords.lat,
          roundedCoords.lon,
          86400 // Look back 24 hours
        );
        
        if (staleSnapshot) {
          console.warn(`Returning stale cache data for location ${cacheKey} due to API limit`);
          return convertSnapshotToWeatherData(staleSnapshot, 'expired');
        }
        
        throw new Error(
          'Daily API limit reached and no cached data available. Please try again tomorrow.'
        );
      }
      
      // Fetch from OpenWeatherMap API
      try {
        const client = getOpenWeatherClient();
        const apiResponse = await client.fetchCurrent(roundedCoords.lat, roundedCoords.lon);
        
        // Increment API call counter
        incrementApiCallCounter();
        
        const weatherData = convertToWeatherData(apiResponse, roundedCoords, 'miss');
        
        // Determine appropriate TTL based on usage
        const ttl = determineCacheTTL();
        
        // Save to cache (don't await - fire and forget)
        const snapshot = createWeatherSnapshot(weatherData, ttl);
        repository.saveSnapshot(snapshot).catch(error => {
          console.error('Error saving weather snapshot to cache:', error);
        });
        
        return weatherData;
      } catch (apiError) {
        // API call failed - try to return stale cache data
        console.error('OpenWeatherMap API error:', apiError);
        
        // Look for any cached data, even if expired
        const staleSnapshot = await repository.findByLocation(
          roundedCoords.lat,
          roundedCoords.lon,
          86400 // Look back 24 hours
        );
        
        if (staleSnapshot) {
          console.warn(`Returning stale cache data for location ${cacheKey} due to API failure`);
          return convertSnapshotToWeatherData(staleSnapshot, 'expired');
        }
        
        // No cache available, re-throw the error
        throw apiError;
      }
    } finally {
      // Remove from pending requests map
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store in pending requests map
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Gets weather forecast for a location
 */
export async function getForecast(lat: number, lon: number): Promise<ForecastData> {
  // Validate and sanitize coordinates
  const validCoords = validateAndSanitizeCoordinates(lat, lon);
  const roundedCoords = roundCoordinates(validCoords.lat, validCoords.lon);
  
  // Check if we've reached the daily API limit
  resetDailyCounterIfNeeded();
  if (dailyApiCallCount >= API_DAILY_LIMIT) {
    throw new Error(
      'Daily API limit reached. Forecast data is not available. Please try again tomorrow.'
    );
  }
  
  try {
    const client = getOpenWeatherClient();
    const apiResponse = await client.fetchForecast(roundedCoords.lat, roundedCoords.lon);
    
    // Increment API call counter
    incrementApiCallCounter();
    
    // Process daily forecast (group by day)
    const dailyMap = new Map<string, any[]>();
    
    apiResponse.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]; // Get date part (YYYY-MM-DD)
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(item);
    });
    
    const daily = Array.from(dailyMap.entries()).slice(0, 7).map(([date, items]) => {
      const temps = items.map(i => i.main.temp);
      const rainfall = items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0);
      const avgPop = items.reduce((sum, i) => sum + i.pop, 0) / items.length;
      
      // Use midday weather for condition
      const middayItem = items[Math.floor(items.length / 2)];
      
      return {
        date: new Date(date).toISOString(),
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        humidity: middayItem.main.humidity,
        rainfall,
        weatherCondition: middayItem.weather[0].main,
        weatherDescription: middayItem.weather[0].description,
        weatherIcon: middayItem.weather[0].icon,
        precipitationProbability: avgPop
      };
    });
    
    // Process hourly forecast (next 48 hours)
    const hourly = apiResponse.list.slice(0, 16).map(item => ({
      time: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      humidity: item.main.humidity,
      rainfall: item.rain?.['3h'] || 0,
      weatherCondition: item.weather[0].main,
      windSpeed: item.wind.speed
    }));
    
    return {
      location: roundedCoords,
      daily,
      hourly,
      fetchedAt: new Date().toISOString(),
      source: 'openweathermap'
    };
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}

/**
 * Gets weather data for a specific farmer based on their location
 */
export async function getWeatherForFarmer(farmerId: string): Promise<WeatherData> {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    
    // Fetch farmer data
    const farmer = await farmersRepository.findById(new ObjectId(farmerId));
    
    if (!farmer) {
      throw new NotFoundError('Farmer not found', { farmerId });
    }
    
    // Get coordinates for farmer's location
    const coordinates = getCoordinatesForLocation(
      farmer.division,
      farmer.district,
      farmer.upazila
    );
    
    console.log(
      `Fetching weather for farmer ${farmerId} at ${farmer.division}/${farmer.district}/${farmer.upazila} ` +
      `(${coordinates.lat}, ${coordinates.lon})`
    );
    
    // Get weather data using the coordinates
    return await getCurrentWeather(coordinates.lat, coordinates.lon);
  } catch (error) {
    console.error('Error getting weather for farmer:', error);
    throw error;
  }
}

/**
 * Generates farming advisories based on weather conditions
 */
export function generateAdvisories(weather: WeatherData): Advisory[] {
  const advisories: Advisory[] = [];
  
  // Heat advisory (temperature > 35°C)
  if (weather.temperature > 35) {
    advisories.push({
      type: 'heat',
      severity: weather.temperature > 40 ? 'high' : 'medium',
      title: 'High Temperature Alert',
      message: `Temperature is ${weather.temperature.toFixed(1)}°C. Take precautions to protect crops from heat stress.`,
      actions: [
        'Increase irrigation frequency',
        'Apply mulch to retain soil moisture',
        'Consider shade nets for sensitive crops',
        'Monitor crops for signs of heat stress'
      ],
      conditions: {
        temperature: weather.temperature
      }
    });
  }
  
  // Rainfall advisory (rainfall > 50mm or high humidity suggesting rain)
  if (weather.rainfall > 50) {
    advisories.push({
      type: 'rainfall',
      severity: weather.rainfall > 100 ? 'high' : 'medium',
      title: 'Heavy Rainfall Alert',
      message: `Heavy rainfall detected (${weather.rainfall.toFixed(1)}mm). Ensure proper drainage to prevent waterlogging.`,
      actions: [
        'Check and clear drainage channels',
        'Delay harvesting if possible',
        'Protect stored crops from moisture',
        'Monitor for fungal diseases'
      ],
      conditions: {
        rainfall: weather.rainfall
      }
    });
  }
  
  // Humidity advisory (humidity > 80%)
  if (weather.humidity > 80) {
    advisories.push({
      type: 'humidity',
      severity: weather.humidity > 90 ? 'high' : 'medium',
      title: 'High Humidity Alert',
      message: `Humidity is ${weather.humidity}%. High risk of fungal diseases and pest activity.`,
      actions: [
        'Improve air circulation around crops',
        'Apply preventive fungicides if needed',
        'Monitor for signs of disease',
        'Reduce irrigation to avoid excess moisture'
      ],
      conditions: {
        humidity: weather.humidity
      }
    });
  }
  
  // Wind advisory (wind speed > 10 m/s)
  if (weather.windSpeed > 10) {
    advisories.push({
      type: 'wind',
      severity: weather.windSpeed > 15 ? 'high' : 'medium',
      title: 'Strong Wind Alert',
      message: `Wind speed is ${weather.windSpeed.toFixed(1)} m/s. Protect crops from wind damage.`,
      actions: [
        'Stake tall crops for support',
        'Secure loose materials and equipment',
        'Delay spraying operations',
        'Check for physical damage after wind subsides'
      ],
      conditions: {
        windSpeed: weather.windSpeed
      }
    });
  }
  
  // Sort advisories by severity (high first)
  advisories.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return advisories;
}
