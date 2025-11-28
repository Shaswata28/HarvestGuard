# Implementation Plan

- [x] 1. Set up OpenWeatherMap API client and configuration





  - Create OpenWeatherMap client utility with API call methods
  - Add environment variables for API key and configuration
  - Implement request/response type definitions
  - Add error handling for API failures
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 1.1 Write unit tests for OpenWeatherMap client
  - Test API request formatting
  - Test response parsing
  - Test error handling with mocked API responses
  - _Requirements: 4.3_

- [x] 2. Create Bangladesh location mapping data





  - Create static data file with division/district/upazila coordinates
  - Implement location lookup function
  - Add coordinate validation for Bangladesh bounds
  - Implement fallback to default location (Dhaka)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 2.1 Write property test for location coordinate bounds
  - **Property 5: Farmer location resolution**
  - **Validates: Requirements 6.1, 6.2, 6.3**
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Update weather repository for caching





  - Update weatherSnapshots repository with cache methods
  - Implement findByLocation with geospatial query
  - Implement saveSnapshot method
  - Add deleteExpired cleanup method
  - Add getUsageStats method for API monitoring
  - _Requirements: 2.1, 2.2, 8.1, 8.2_

- [ ]* 3.1 Write unit tests for weather repository
  - Test cache CRUD operations
  - Test geospatial queries
  - Test expiration logic
  - Test usage stats calculation
  - _Requirements: 2.1, 2.2_

- [ ]* 3.2 Write property test for cache expiration
  - **Property 6: Cache expiration**
  - **Validates: Requirements 2.4**
  - _Requirements: 2.4_

- [x] 4. Implement weather service layer





  - Create weather service with cache-first logic
  - Implement getCurrentWeather method with cache check
  - Implement getForecast method
  - Implement getWeatherForFarmer method
  - Add coordinate rounding for cache key generation
  - Implement request deduplication for concurrent calls
  - _Requirements: 1.1, 2.2, 2.3, 2.4, 9.3_

- [ ]* 4.1 Write property test for cache consistency
  - **Property 1: Cache consistency**
  - **Validates: Requirements 2.2, 2.3**
  - _Requirements: 2.2, 2.3_

- [ ]* 4.2 Write property test for API call minimization
  - **Property 2: API call minimization**
  - **Validates: Requirements 2.1, 9.3**
  - _Requirements: 2.1, 9.3_

- [ ]* 4.3 Write property test for coordinate rounding
  - **Property 4: Location coordinate rounding**
  - **Validates: Requirements 2.1, 9.3**
  - _Requirements: 2.1, 9.3_

- [ ]* 4.4 Write property test for fallback behavior
  - **Property 3: Fallback to cache on API failure**
  - **Validates: Requirements 2.5**
  - _Requirements: 2.5_

- [x] 5. Implement farming advisory generation




  - Create advisory generation logic based on weather conditions
  - Implement heat advisory (temperature > 35°C)
  - Implement rainfall advisory (rainfall > 50mm)
  - Implement humidity advisory (humidity > 80%)
  - Implement wind advisory (wind speed > 10 m/s)
  - Prioritize advisories by urgency
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for heat advisory generation
  - **Property 7: Advisory generation consistency**
  - **Validates: Requirements 5.2**
  - _Requirements: 5.2_

- [ ]* 5.2 Write property test for rainfall advisory generation
  - **Property 8: Advisory generation for rainfall**
  - **Validates: Requirements 5.1**
  - _Requirements: 5.1_

- [x] 6. Create weather API routes





  - Create weather router with GET /current endpoint
  - Create GET /forecast endpoint
  - Create GET /location endpoint for coordinate-based queries
  - Add request validation middleware
  - Add authentication check for farmer-specific requests
  - Implement response formatting
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 6.1 Write unit tests for weather routes
  - Test request validation
  - Test response formatting
  - Test error responses
  - Test authentication
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 6.2 Write property test for response format consistency
  - **Property 10: Response format consistency**
  - **Validates: Requirements 7.4**
  - _Requirements: 7.4_

- [x] 7. Implement API usage monitoring and limits





  - Add API call counter in weather service
  - Implement daily usage tracking
  - Add warning logs at 80% usage (800 calls)
  - Implement automatic cache TTL extension when approaching limits
  - Add usage stats endpoint for monitoring
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.4_

- [ ]* 7.1 Write property test for API key validation
  - **Property 9: API key validation**
  - **Validates: Requirements 4.1, 4.2**
  - _Requirements: 4.1, 4.2_

- [ ]* 7.2 Write property test for free tier limit protection
  - **Property 11: Free tier limit protection**
  - **Validates: Requirements 9.1, 9.2**
  - _Requirements: 9.1, 9.2_

- [ ]* 7.3 Write property test for cache TTL extension
  - **Property 12: Cache TTL extension**
  - **Validates: Requirements 9.4**
  - _Requirements: 9.4_

- [x] 8. Register weather routes in server




  - Import weather router in server/index.ts
  - Register routes at /api/weather
  - Add error handling middleware
  - _Requirements: 7.1, 7.2_

- [x] 9. Update shared types for weather data

  - Add WeatherData interface in shared/api.ts
  - Add ForecastData interface
  - Add Advisory interface
  - Add WeatherResponse interface
  - _Requirements: 7.4_

- [ ]* 9.1 Write unit tests for shared types
  - Test type validation with Zod schemas
  - Test serialization/deserialization
  - _Requirements: 7.4_

- [x] 10. Update frontend to use real weather API

  - Update Dashboard.tsx to fetch from /api/weather/current
  - Update Weather.tsx to fetch from /api/weather/forecast
  - Update WeatherCard component to handle new data structure
  - Update AdvisoryCard component to display generated advisories
  - Add loading states and error handling
  - Add fallback to mock data if API fails
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ]* 10.1 Write integration tests for frontend weather integration
  - Test data fetching and display
  - Test error handling
  - Test loading states
  - _Requirements: 1.1, 1.2_

- [x] 11. Add database indexes for performance

  - Create 2dsphere index on weatherSnapshots.location
  - Create TTL index on weatherSnapshots.expiresAt
  - Create compound index on location and fetchedAt
  - Update initialize.ts with new indexes
  - _Requirements: 2.1, 2.2_

- [x] 12. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add environment configuration documentation

  - Document required environment variables in README
  - Add .env.example with weather API configuration
  - Document how to obtain OpenWeatherMap API key
  - Add troubleshooting guide for common issues
  - _Requirements: 4.1, 4.2_

- [x] 14. Final checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
