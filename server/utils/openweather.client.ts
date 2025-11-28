/**
 * OpenWeatherMap API Client
 * 
 * This client handles all interactions with the OpenWeatherMap API.
 * It provides methods for fetching current weather and forecast data,
 * with proper error handling and type safety.
 * 
 * Free Tier Limits: 1,000 calls/day
 */

/**
 * OpenWeatherMap API response types
 */

export interface OpenWeatherCoordinates {
  lon: number;
  lat: number;
}

export interface OpenWeatherMain {
  temp: number;           // Temperature in Celsius
  feels_like: number;     // Feels like temperature in Celsius
  temp_min: number;       // Minimum temperature
  temp_max: number;       // Maximum temperature
  pressure: number;       // Atmospheric pressure in hPa
  humidity: number;       // Humidity percentage
  sea_level?: number;     // Sea level pressure
  grnd_level?: number;    // Ground level pressure
}

export interface OpenWeatherWeather {
  id: number;             // Weather condition id
  main: string;           // Group of weather parameters (Rain, Snow, Clear, etc.)
  description: string;    // Weather condition description
  icon: string;           // Weather icon id
}

export interface OpenWeatherWind {
  speed: number;          // Wind speed in m/s
  deg: number;            // Wind direction in degrees
  gust?: number;          // Wind gust in m/s
}

export interface OpenWeatherClouds {
  all: number;            // Cloudiness percentage
}

export interface OpenWeatherRain {
  '1h'?: number;          // Rain volume for last 1 hour in mm
  '3h'?: number;          // Rain volume for last 3 hours in mm
}

export interface OpenWeatherSnow {
  '1h'?: number;          // Snow volume for last 1 hour in mm
  '3h'?: number;          // Snow volume for last 3 hours in mm
}

export interface OpenWeatherSys {
  type?: number;
  id?: number;
  country: string;        // Country code
  sunrise: number;        // Sunrise time (Unix timestamp)
  sunset: number;         // Sunset time (Unix timestamp)
}

export interface OpenWeatherCurrentResponse {
  coord: OpenWeatherCoordinates;
  weather: OpenWeatherWeather[];
  base: string;
  main: OpenWeatherMain;
  visibility: number;     // Visibility in meters
  wind: OpenWeatherWind;
  clouds: OpenWeatherClouds;
  rain?: OpenWeatherRain;
  snow?: OpenWeatherSnow;
  dt: number;             // Time of data calculation (Unix timestamp)
  sys: OpenWeatherSys;
  timezone: number;       // Shift in seconds from UTC
  id: number;             // City ID
  name: string;           // City name
  cod: number;            // Internal parameter
}

export interface OpenWeatherForecastItem {
  dt: number;             // Time of data forecasted (Unix timestamp)
  main: OpenWeatherMain;
  weather: OpenWeatherWeather[];
  clouds: OpenWeatherClouds;
  wind: OpenWeatherWind;
  visibility: number;
  pop: number;            // Probability of precipitation (0-1)
  rain?: OpenWeatherRain;
  snow?: OpenWeatherSnow;
  sys: {
    pod: string;          // Part of day (n - night, d - day)
  };
  dt_txt: string;         // Time of data forecasted (ISO format)
}

export interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;            // Number of forecast items
  list: OpenWeatherForecastItem[];
  city: {
    id: number;
    name: string;
    coord: OpenWeatherCoordinates;
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface OpenWeatherErrorResponse {
  cod: string | number;
  message: string;
}

/**
 * OpenWeatherMap API Client Configuration
 */
export interface OpenWeatherClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;       // Request timeout in milliseconds
  units?: 'metric' | 'imperial' | 'standard';
}

/**
 * Custom error class for OpenWeatherMap API errors
 */
export class OpenWeatherError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiCode?: string | number,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenWeatherError';
  }
}

/**
 * OpenWeatherMap API Client
 */
export class OpenWeatherClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private units: 'metric' | 'imperial' | 'standard';

  constructor(config: OpenWeatherClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openweathermap.org/data/2.5';
    this.timeout = config.timeout || 5000;
    this.units = config.units || 'metric';
  }

  /**
   * Fetch current weather data for a location
   */
  async fetchCurrent(lat: number, lon: number): Promise<OpenWeatherCurrentResponse> {
    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: OpenWeatherErrorResponse = await response.json().catch(() => ({
          cod: response.status,
          message: response.statusText,
        }));

        throw new OpenWeatherError(
          `OpenWeatherMap API error: ${errorData.message}`,
          response.status,
          errorData.cod,
          errorData
        );
      }

      const data: OpenWeatherCurrentResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof OpenWeatherError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new OpenWeatherError(
            `Request timeout after ${this.timeout}ms`,
            undefined,
            'TIMEOUT'
          );
        }

        throw new OpenWeatherError(
          `Network error: ${error.message}`,
          undefined,
          'NETWORK_ERROR',
          error
        );
      }

      throw new OpenWeatherError(
        'Unknown error occurred',
        undefined,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Fetch 5-day weather forecast (3-hour intervals)
   */
  async fetchForecast(lat: number, lon: number): Promise<OpenWeatherForecastResponse> {
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: OpenWeatherErrorResponse = await response.json().catch(() => ({
          cod: response.status,
          message: response.statusText,
        }));

        throw new OpenWeatherError(
          `OpenWeatherMap API error: ${errorData.message}`,
          response.status,
          errorData.cod,
          errorData
        );
      }

      const data: OpenWeatherForecastResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof OpenWeatherError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new OpenWeatherError(
            `Request timeout after ${this.timeout}ms`,
            undefined,
            'TIMEOUT'
          );
        }

        throw new OpenWeatherError(
          `Network error: ${error.message}`,
          undefined,
          'NETWORK_ERROR',
          error
        );
      }

      throw new OpenWeatherError(
        'Unknown error occurred',
        undefined,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Check if the API key is valid and the service is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Use Dhaka, Bangladesh coordinates for health check
      await this.fetchCurrent(23.8103, 90.4125);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create and export a singleton instance of the OpenWeatherMap client
 */
let clientInstance: OpenWeatherClient | null = null;

export function getOpenWeatherClient(): OpenWeatherClient {
  if (!clientInstance) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      throw new OpenWeatherError(
        'OPENWEATHER_API_KEY environment variable is not set',
        undefined,
        'MISSING_API_KEY'
      );
    }

    clientInstance = new OpenWeatherClient({
      apiKey,
      units: 'metric', // Use metric units (Celsius, m/s)
    });
  }

  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetOpenWeatherClient(): void {
  clientInstance = null;
}
