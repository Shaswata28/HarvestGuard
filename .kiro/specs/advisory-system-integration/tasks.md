# Implementation Plan

- [x] 1. Clean up existing advisory code





  - Remove `markAsRead` functionality from repository, service, and routes
  - Remove `findUnread` and related methods
  - Update API route to remove PUT /advisories/:id/read endpoint
  - Update shared API types to remove MarkAdvisoryReadRequest
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Add duplicate prevention to repository


  - Add `findRecentByFarmerAndType` method to advisories repository
  - Add database index on (farmerId, source, createdAt) for efficient duplicate checking
  - _Requirements: 3.6_

- [x] 3. Create weather advisory generation service


  - Create `server/services/weatherAdvisory.service.ts`
  - Implement `generateForFarmer(farmerId)` method
  - Implement duplicate prevention logic using 24-hour window
  - Implement crop enrichment logic to add crop-specific guidance
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.3, 4.5_

- [x] 4. Add manual trigger endpoint


  - Add POST /api/advisories/generate endpoint to routes
  - Support optional farmerId parameter (if omitted, generate for all farmers)
  - Support optional location filtering (division, district)
  - Return summary of generated advisories
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Integrate with dashboard


  - Update dashboard service to include advisory count
  - Update dashboard API response to include undelivered advisory count
  - Update client Dashboard component to display advisories
  - Add advisory card/list component to show recent advisories
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 6. Test end-to-end flow


  - Manually test creating advisories via API
  - Manually test generating weather advisories for a farmer
  - Manually test generating advisories for all farmers
  - Verify no duplicates are created within 24 hours
  - Verify advisories appear on dashboard
  - _Requirements: All_

## Crop-Aware Bangla Advisory Enhancement

- [x] 7. Create Bangla advisory generator utility





  - Create `server/utils/banglaAdvisoryGenerator.ts`
  - Define interfaces: WeatherCondition, CropContext, BanglaAdvisory
  - Implement `generateBanglaAdvisory(weather, crop)` function
  - Implement message format: `[Weather + Value] → [Action]`
  - _Requirements: 6.1, 6.4, 6.5, 6.9_

- [ ]* 7.1 Write property test for Bangla advisory generator
  - **Property 14: Advisory message format structure**
  - **Validates: Requirements 6.5**

- [x] 8. Implement advisory generation logic for different scenarios





  - Implement rain + harvest soon scenario (rain > 70%, daysUntilHarvest <= 7)
  - Implement heat + growing stage scenario (temp > 35°C, stage = 'growing')
  - Implement rain + growing stage scenario
  - Implement heat + harvest soon scenario
  - _Requirements: 6.2, 6.3, 6.7_

- [ ]* 8.1 Write property test for harvest urgency with rain
  - **Property 12: Harvest urgency with rain**
  - **Validates: Requirements 6.2**

- [ ]* 8.2 Write property test for irrigation advisory for heat
  - **Property 13: Irrigation advisory for heat**
  - **Validates: Requirements 6.3**

- [x] 9. Implement days until harvest calculation





  - Add `calculateDaysUntilHarvest(expectedHarvestDate)` helper function
  - Handle edge cases (null date, past date, future date)
  - Return number of days or null if no harvest date
  - _Requirements: 6.6_

- [ ]* 9.1 Write property test for days until harvest calculation
  - **Property 15: Days until harvest calculation**
  - **Validates: Requirements 6.6**

- [x] 10. Implement weather risk prioritization





  - Add `determineMostUrgentRisk(weather)` function
  - Prioritize based on severity and crop impact
  - Return single most urgent risk when multiple exist
  - _Requirements: 6.8_

- [ ]* 10.1 Write property test for single advisory for multiple risks
  - **Property 17: Single advisory for multiple risks**
  - **Validates: Requirements 6.8**

- [x] 11. Update weather advisory service to use crop data





  - Update `generateForFarmer` to fetch active crop batches
  - Update to use `banglaAdvisoryGenerator` instead of generic messages
  - Implement harvest advisory prioritization logic
  - Pass crop context to advisory generator
  - _Requirements: 6.1, 6.7, 6.9_

- [ ]* 11.1 Write property test for weather and crop data combination
  - **Property 11: Weather and crop data combination**
  - **Validates: Requirements 6.1**

- [ ]* 11.2 Write property test for harvest advisory prioritization
  - **Property 16: Harvest advisory prioritization**
  - **Validates: Requirements 6.7**

- [ ]* 11.3 Write property test for crop type in advisory
  - **Property 18: Crop type in advisory**
  - **Validates: Requirements 6.9**

- [x] 12. Update AdvisoryCard component to fetch from backend







  - Remove client-side advisory generation logic
  - Fetch advisories from backend API
  - Display advisory message and actions from backend
  - Maintain visual styling based on severity
  - Support both old and new advisory formats during transition
  - _Requirements: 6.4, 6.5_

- [x] 13. Checkpoint - Ensure all tests pass








  - Ensure all tests pass, ask the user if questions arise.
