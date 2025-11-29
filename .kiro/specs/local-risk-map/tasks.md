# Implementation Plan: Local Risk Map

- [x] 1. Set up project dependencies and type definitions





  - Install Leaflet.js and react-leaflet packages
  - Install fast-check for property-based testing
  - Create TypeScript interfaces for Location, FarmerData, NeighborData, WeatherConditions, CropInfo, and RiskMarkerConfig
  - _Requirements: 1.1, 2.1, 2.3, 3.1_

- [x] 2. Implement district coordinate lookup utility





  - Create `getDistrictCenter` function that returns coordinates for Bangladesh districts
  - Include fallback logic for division-level coordinates
  - Add default Bangladesh center coordinates as final fallback
  - _Requirements: 1.2_

- [ ]* 2.1 Write property test for district coordinate lookup
  - **Property 1: Map centers on district coordinates**
  - **Validates: Requirements 1.2**

- [x] 2.2 Create API service to fetch farmer data


  - Create service function to fetch farmer's location, weather, crop info, risk level, and advisory from database
  - Add error handling for failed API requests
  - _Requirements: 2.3, 2.4, 2.5_

- [ ]* 2.3 Write property test for farmer data fetching
  - **Property 2: Farmer data loaded from database**
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 3. Implement coordinate generation utilities





  - Create `generateRandomCoordinateInDistrict` function to generate random coordinates within radius
  - Ensure coordinates stay within district boundaries
  - Add validation for Bangladesh geographic boundaries
  - _Requirements: 2.3, 3.2_

- [ ]* 3.1 Write property test for coordinate generation
  - **Property 4: All neighbor coordinates within district**
  - **Validates: Requirements 3.2**

- [x] 4. Implement risk calculation logic





  - Create `calculateRiskLevel` function that evaluates weather and crop factors
  - Implement risk scoring algorithm for High, Medium, and Low risk conditions
  - Handle edge cases with fallback to Medium risk
  - _Requirements: 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for risk calculation
  - **Property 5: Risk level validity**
  - **Property 6: Risk calculation considers all factors**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 5. Implement Bangla advisory generator





  - Create `generateBanglaAdvisory` function that produces advisory text
  - Implement weather-specific recommendations (rain → harvest/cover, heat → irrigate, humidity → monitor pests)
  - Add Bangla numeral conversion utility
  - Use arrow symbol (→) to connect conditions with actions
  - Implement threat prioritization logic
  - _Requirements: 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 5.1 Write property test for Bangla advisory generator
  - **Property 11: Advisory content in Bangla**
  - **Property 13: Advisory contains actionable recommendations**
  - **Property 15: Weather-appropriate advisory recommendations**
  - **Property 16: Bangla numerals in advisories**
  - **Property 17: Advisory format with arrow connector**
  - **Property 18: Threat prioritization in advisories**
  - **Validates: Requirements 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 6. Implement mock data generator





  - Create `generateMockNeighborData` function that generates 10-15 neighbor data points
  - Generate realistic mock weather conditions (temperature 15-45°C, humidity 0-100%, rainfall 0-100%)
  - Generate mock crop information with common Bangladesh crops
  - Assign unique IDs to each neighbor
  - Ensure no personal identifiers or farm names in data
  - _Requirements: 3.1, 3.2, 3.6, 5.7, 8.2, 8.3_

- [ ]* 6.1 Write property test for mock data generator
  - **Property 3: Neighbor count within range**
  - **Property 7: Neighbor data anonymity**
  - **Property 14: Mock weather values within realistic ranges**
  - **Validates: Requirements 3.1, 3.6, 5.7, 8.2, 8.3**

- [x] 7. Create LocalRiskMap React component structure






  - Set up component with props for farmerId and language
  - Initialize state for map center, zoom, farmer data (from DB), and neighbor data (mock)
  - Add loading and error state management
  - Implement useEffect to fetch farmer data from database on mount
  - Implement component lifecycle hooks for data generation and cleanup
  - _Requirements: 1.1, 2.3, 2.4, 2.5, 8.1, 8.4_

- [ ]* 7.1 Write property test for component data management
  - **Property 20: Client-side data generation**
  - **Property 21: Data cleanup on unmount**
  - **Validates: Requirements 8.1, 8.4**

- [x] 8. Integrate Leaflet map with OpenStreetMap tiles






  - Add MapContainer component with TileLayer for OpenStreetMap
  - Configure initial center and zoom level (zoom: 11)
  - Set max zoom (18) and min zoom (8)
  - Enable touch interaction handlers
  - Add error handling for tile loading failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 8.1 Write unit tests for map configuration
  - Test map initializes with correct zoom level
  - Test touch gesture support is enabled
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 9. Implement farmer location marker


  - Create blue circle marker for farmer's location using database coordinates
  - Style with distinct appearance (radius 10px, border)
  - Display farmer's actual risk level from database
  - Add pop-up showing farmer's actual advisory from database
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 9.1 Write unit test for farmer marker styling
  - Test farmer marker has blue color
  - Test farmer marker is visually distinct from neighbor markers
  - _Requirements: 2.1, 2.2_


- [x] 10. Implement neighbor location markers

  - Create color-coded circle markers for each neighbor
  - Map risk levels to colors: Low → green, Medium → orange, High → red
  - Render marker for each neighbor data point
  - _Requirements: 3.7, 4.1, 4.2, 4.3_

- [ ]* 10.1 Write property test for neighbor markers
  - **Property 8: All neighbors have markers**
  - **Property 9: Risk level color mapping**
  - **Validates: Requirements 3.7, 4.1, 4.2, 4.3**


- [x] 11. Implement interactive pop-ups for neighbor markers

  - Add Popup component to each neighbor marker
  - Display risk level in Bangla ("ঝুঁকি: নিম্ন/মাঝারি/উচ্চ")
  - Display generated Bangla advisory message
  - Configure pop-up styling (max-width: 250px, auto-pan)
  - _Requirements: 5.1, 5.3, 5.5_

- [ ]* 11.1 Write property test for pop-up functionality
  - **Property 10: Pop-up displays on marker interaction**
  - **Property 12: Risk level displayed in Bangla**
  - **Validates: Requirements 5.1, 5.3**

- [x] 12. Implement responsive layout and mobile optimization


  - Add responsive styling with Tailwind CSS
  - Ensure map adapts to different viewport sizes
  - Optimize marker sizes for mobile screens
  - Add loading spinner with Bangla text ("মানচিত্র লোড হচ্ছে...")
  - _Requirements: 7.1, 7.4_

- [ ]* 12.1 Write property test for responsive behavior
  - **Property 19: Responsive layout adaptation**
  - **Validates: Requirements 7.1**

- [x] 13. Add error handling and fallback UI


  - Implement error boundary for map loading failures
  - Add fallback message in Bangla for tile loading errors
  - Add retry button for failed map loads
  - Handle invalid district coordinates with fallbacks
  - _Requirements: 1.1, 1.2_

- [ ]* 13.1 Write unit tests for error handling
  - Test fallback message displays on map load failure
  - Test district coordinate fallback logic
  - _Requirements: 1.1, 1.2_


- [x] 14. Add navigation button/tab for Local Risk Map

  - Add button or tab in main navigation with Bangla label ("ঝুঁকির মানচিত্র" or "এলাকার ঝুঁকি")
  - Implement navigation routing to map view
  - Add active state styling when map is displayed
  - Ensure button is accessible and touch-friendly on mobile
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 14.1 Write unit tests for navigation
  - Test navigation button displays Bangla label
  - Test clicking button navigates to map view
  - Test active state is shown when on map view
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 15. Integrate LocalRiskMap component into application


  - Add LocalRiskMap to appropriate page/route
  - Pass farmer's ID from user context/authentication
  - Connect navigation button to map route
  - _Requirements: 1.1, 2.3, 8.3_

- [x] 16. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
