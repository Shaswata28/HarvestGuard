# Design Document

## Overview

The Weather API Integration feature replaces mock weather data with real-time information from OpenWeatherMap API. The system uses a three-layer architecture (API routes, service layer, repository layer) with intelligent caching to minimize external API calls and stay within free tier limits. Weather data is automatically fetched based on farmer locations and cached in MongoDB for 1 hour, with automatic cache extension when approaching API limits.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Dashboard,    │
│   Weather Page) │
└────────┬────────┘
         │ HTTP GET /api/weather/*
         ▼
┌─────────────────────────────────────┐
│  Express Backend                    │
│  ┌──────────────────────────────┐  │
│  │  Weather Routes              │  │
│  │  - GET /current              │  │
│  │  - GET /forecast             │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  Weather Service             │  │
│  │  - Cache check               │  │
│  │  - API call logic            │  │
│  │  - Location mapping          │  │
│  │  - Advisory generation       │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  Weather Repository          │  │
│  │  - MongoDB operations        │  │
│  │  - Cache management          │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
┌─────────┐    ┌──────────────┐
│ MongoDB │    │ OpenWeather  │
│ (Cache) │    │     API      │
└─────────┘    └──────────────┘
```

### Data Flow

1. **Frontend Request**: User views dashboard/weather page
2. **Route Handler**: Receives request with optional farmerId
3. **Service Layer**: 
   - Retrieves farmer location from database
   - Checks cache for recent weather data
   - If cache miss or expired, calls OpenWeatherMap API
   - Stores fresh data in cache
   - Generates farming advisories based on conditions
4. **Response**: Returns weather data to frontend

### Caching Strategy

- **Cache Key**: Location coordinates rounded to 2 decimal places (≈1km precision)
- **TTL**: 1 hour (3600 seconds) default, extends to 2 hours when approaching API limits
- **Shared Cache**: Multiple farmers in same area share cached data
- **Fallback**: Returns stale cache if API fails

## Components and Interfaces

### 1. Weather Service (`server/services/weather.service.ts`)

```typescript
interface WeatherService {
  // Get current weather for a location
  getCurrentWeather(lat: number, lon: number): Promise<WeatherData>;
  
  // Get weather forecast
  getForecast(lat: number, lon: number): Promise<ForecastData>;
  
  // Get weather by farmer ID (uses farmer's location)
  getWeatherForFarmer(farmerId: string): Promise<WeatherData>;
  
  // Generate farming advisories based on weather
  generateAdvisories(weather: WeatherData): Advisory[];
  
  // Map division/district to coordinates
  getCoordinatesForLocation(division: string, district: string, upazila?: string): Coordinates;
}
```

### 2. Weather Repository (`server/db/repositories/weather.repository.ts`)

```typescript
interface WeatherRepository {
  // Find cached weather by location
  findByLocation(lat: number, lon: number, maxAge: number): Promise<WeatherSnapshot | null>;
  
  // Save weather snapshot
  saveSnapshot(data: WeatherSnapshotInput): Promise<WeatherSnapshot>;
  
  // Clean up old snapshots
  deleteExpired(): Promise<number>;
  
  // Get API usage stats
  getUsageStats(since: Date): Promise<UsageStats>;
}
```

### 3. Weather Routes (`server/routes/weather.ts`)

```typescript
// GET /api/weather/current?farmerId=xxx
// Returns current weather for farmer's location
router.get('/current', getCurrentWeatherHandler);

// GET /api/weather/forecast?farmerId=xxx
// Returns 7-day forecast
router.get('/forecast', getForecastHandler);

// GET /api/weather/location?lat=23.8&lon=90.4
// Returns weather for specific coordinates
router.get('/location', getWeatherByLocationHandler);
```

### 4. OpenWeatherMap Client (`server/utils/openweather.client.ts`)

```typescript
interface OpenWeatherClient {
  // Fetch current weather
  fetchCurrent(lat: number, lon: number): Promise<OpenWeatherResponse>;
  
  // Fetch forecast
  fetchForecast(lat: number, lon: number): Promise<OpenWeatherForecastResponse>;
  
  // Check API health
  checkHealth(): Promise<boolean>;
}
```

## Data Models

### WeatherSnapshot (MongoDB Schema)

```typescript
{
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  temperature: Number,        // Celsius
  feelsLike: Number,         // Celsius
  humidity: Number,          // Percentage
  pressure: Number,          // hPa
  windSpeed: Number,         // m/s
  windDirection: Number,     // degrees
  rainfall: Number,          // mm (last hour)
  weatherCondition: String,  // "Clear", "Clouds", "Rain", etc.
  weatherDescription: String, // "light rain", "clear sky", etc.
  weatherIcon: String,       // OpenWeather icon code
  visibility: Number,        // meters
  cloudiness: Number,        // percentage
  sunrise: Date,
  sunset: Date,
  fetchedAt: Date,
  expiresAt: Date,
  source: String,            // "openweathermap"
  apiCallCount: Number       // Track API usage
}
```

### ForecastData

```typescript
{
  location: Coordinates,
  daily: [{
    date: Date,
    tempMin: Number,
    tempMax: Number,
    humidity: Number,
    rainfall: Number,
    weatherCondition: String,
    weatherDescription: String,
    weatherIcon: String,
    precipitationProbability: Number
  }],
  hourly: [{
    time: Date,
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    weatherCondition: String,
    windSpeed: Number
  }]
}
```

### Location Mapping Data

```typescript
// Static mapping of Bangladesh divisions/districts to coordinates
const LOCATION_COORDINATES = {
  "Dhaka": {
    "Dhaka": { lat: 23.8103, lon: 90.4125 },
    "Gazipur": { lat: 23.9999, lon: 90.4203 },
    // ... more districts
  },
  "Chittagong": {
    "Chittagong": { lat: 22.3569, lon: 91.7832 },
    // ... more districts
  }
  // ... more divisions
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cache consistency
*For any* location coordinates and time T, if weather data is cached at time T, then all requests for that location between T and T+1hour should return the same cached data without calling the external API
**Validates: Requirements 2.2, 2.3**

### Property 2: API call minimization
*For any* set of concurrent requests for the same location, only one external API call should be made, and all requests should receive the same response
**Validates: Requirements 2.1, 9.3**

### Property 3: Fallback to cache on API failure
*For any* API request that fails, if cached data exists (even if expired), the system should return the cached data rather than failing
**Validates: Requirements 2.5**

### Property 4: Location coordinate rounding
*For any* two coordinate pairs that round to the same 2 decimal places, they should share the same cache entry
**Validates: Requirements 2.1, 9.3**

### Property 5: Farmer location resolution
*For any* farmer with valid division and district, the system should resolve to valid coordinates within Bangladesh (lat: 20-27, lon: 88-93)
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Cache expiration
*For any* cached weather data older than the TTL, a new request should trigger a fresh API call
**Validates: Requirements 2.4**

### Property 7: Advisory generation consistency
*For any* weather data with temperature > 35°C, the system should generate a heat advisory
**Validates: Requirements 5.2**

### Property 8: Advisory generation for rainfall
*For any* weather data with rainfall > 50mm or high precipitation probability, the system should generate a rainfall advisory
**Validates: Requirements 5.1**

### Property 9: API key validation
*For any* system startup, if the OpenWeatherMap API key is missing or invalid, the system should log an error and not make external API calls
**Validates: Requirements 4.1, 4.2**

### Property 10: Response format consistency
*For any* weather API response, the data structure should match the WeatherData interface defined in shared types
**Validates: Requirements 7.4**

### Property 11: Free tier limit protection
*For any* 24-hour period, the total number of external API calls should not exceed 1,000
**Validates: Requirements 9.1, 9.2**

### Property 12: Cache TTL extension
*For any* situation where daily API usage exceeds 800 calls, subsequent cache TTL should automatically extend to 2 hours
**Validates: Requirements 9.4**

## Error Handling

### Error Scenarios

1. **Missing API Key**
   - Log error on startup
   - Return mock data or cached data
   - Display warning in logs

2. **API Rate Limit Exceeded**
   - Return most recent cached data
   - Extend cache TTL to 2 hours
   - Log warning with usage stats

3. **Network Failure**
   - Retry once after 2 seconds
   - Fall back to cached data (even if expired)
   - Log error with details

4. **Invalid Coordinates**
   - Validate coordinates are within Bangladesh bounds
   - Fall back to default location (Dhaka)
   - Log warning

5. **Farmer Location Not Found**
   - Use default location (Dhaka)
   - Log info message
   - Continue with default coordinates

6. **MongoDB Connection Error**
   - Skip caching, call API directly
   - Log error
   - Return fresh data without caching

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: "WEATHER_API_ERROR",
    message: "Failed to fetch weather data",
    details: "Network timeout after 5000ms"
  },
  fallbackData: { /* cached weather if available */ }
}
```

## Testing Strategy

### Unit Tests

1. **Weather Service Tests**
   - Test cache hit/miss logic
   - Test coordinate rounding
   - Test location mapping
   - Test advisory generation rules
   - Test API call deduplication

2. **Weather Repository Tests**
   - Test CRUD operations
   - Test cache expiration queries
   - Test geospatial queries
   - Test usage stats calculation

3. **OpenWeather Client Tests**
   - Test API request formatting
   - Test response parsing
   - Test error handling
   - Mock external API calls

4. **Route Handler Tests**
   - Test request validation
   - Test response formatting
   - Test error responses
   - Test authentication

### Integration Tests

1. Test end-to-end flow from route to database
2. Test cache behavior with real MongoDB
3. Test concurrent requests for same location
4. Test API failure scenarios with fallback

### Property-Based Tests

Property-based tests will use `fast-check` library to generate random inputs and verify correctness properties hold across all valid inputs.

1. **Property 1 Test**: Generate random coordinates and timestamps, verify cache consistency
2. **Property 2 Test**: Generate concurrent requests, verify single API call
3. **Property 4 Test**: Generate coordinate pairs, verify rounding and cache sharing
4. **Property 5 Test**: Generate random division/district combinations, verify coordinate bounds
5. **Property 7 Test**: Generate weather data with various temperatures, verify advisory generation
6. **Property 8 Test**: Generate weather data with various rainfall amounts, verify advisory generation
7. **Property 11 Test**: Simulate 24-hour usage, verify API call limit enforcement

## Implementation Notes

### OpenWeatherMap API Endpoints

**Current Weather:**
```
GET https://api.openweathermap.org/data/2.5/weather
?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
```

**5-Day Forecast:**
```
GET https://api.openweathermap.org/data/2.5/forecast
?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
```

### Environment Variables

```env
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_CACHE_TTL=3600  # 1 hour in seconds
WEATHER_CACHE_EXTENDED_TTL=7200  # 2 hours
WEATHER_API_DAILY_LIMIT=1000
WEATHER_API_WARNING_THRESHOLD=800
```

### Bangladesh Location Data

The system will include a static mapping of major divisions, districts, and upazilas to coordinates. This data will be stored in `server/data/bangladesh-locations.ts`.

### Performance Considerations

1. **Geospatial Indexing**: Create 2dsphere index on location field for fast proximity queries
2. **TTL Index**: MongoDB TTL index on expiresAt field for automatic cleanup
3. **Connection Pooling**: Reuse HTTP connections for OpenWeatherMap API calls
4. **Request Deduplication**: Use in-memory map to prevent duplicate concurrent API calls

### Migration from Mock Data

1. Keep mock data as fallback when API key is not configured
2. Add feature flag to toggle between mock and real data
3. Gradually migrate frontend components to use new API endpoints
4. Update WeatherCard and AdvisoryCard components to handle new data structure

## Security Considerations

1. **API Key Protection**: Store in environment variables, never commit to repository
2. **Rate Limiting**: Implement request rate limiting on weather endpoints
3. **Input Validation**: Validate all coordinates and farmer IDs
4. **Error Message Sanitization**: Don't expose internal errors or API keys in responses

## Monitoring and Logging

### Metrics to Track

1. Cache hit rate (target: >90%)
2. API calls per day (limit: 1000)
3. Average response time
4. Error rate by type
5. Most requested locations

### Log Levels

- **INFO**: Cache hits, successful API calls
- **WARN**: Cache misses, approaching API limits, using fallback data
- **ERROR**: API failures, invalid configurations, database errors

## Future Enhancements

1. **Weather Alerts**: Push notifications for severe weather
2. **Historical Data**: Store and analyze weather patterns
3. **Predictive Analytics**: ML models for crop recommendations
4. **Multiple Weather Sources**: Fallback to alternative APIs
5. **Offline Support**: Progressive Web App with service worker caching
