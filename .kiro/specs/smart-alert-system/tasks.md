# Implementation Plan

- [x] 1. Create core risk calculation module





  - Implement risk threshold constants and storage vulnerability mappings
  - Create risk score calculation function with weather parameter evaluation
  - Create score-to-risk-level conversion function
  - _Requirements: 4.1, 4.2, 4.4, 8.1_

- [ ]* 1.1 Write property test for risk level validity
  - **Property 11: Valid risk level**
  - **Validates: Requirements 4.1**

- [ ]* 1.2 Write property test for risk level monotonicity
  - **Property 12: Risk level monotonicity**
  - **Validates: Requirements 4.2**

- [ ]* 1.3 Write property test for storage vulnerability impact
  - **Property 13: Storage vulnerability impact**
  - **Validates: Requirements 4.4**

- [x] 2. Create Bangla message formatter module





  - Implement message template functions with parameter substitution
  - Create storage advisory formatter with crop, weather, and location details
  - Create growing crop advisory formatter with harvest date handling
  - Implement Bangla text validation helper
  - _Requirements: 1.1, 1.2, 1.4, 2.2, 2.3, 3.2_

- [ ]* 2.1 Write property test for advisory message completeness
  - **Property 1: Advisory message completeness**
  - **Validates: Requirements 1.1, 1.2, 2.2, 2.3**

- [ ]* 2.2 Write property test for Bangla message format
  - **Property 3: Bangla message format**
  - **Validates: Requirements 1.4**

- [ ]* 2.3 Write property test for imminent harvest date reference
  - **Property 9: Imminent harvest date reference**
  - **Validates: Requirements 3.2**

- [x] 3. Create action item generator module





  - Implement weather-specific action generation (rainfall, temperature, wind)
  - Create storage-specific action generation with equipment terms
  - Implement action prioritization by urgency
  - Add action count validation (2-5 items)
  - _Requirements: 1.3, 2.4, 2.5, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 3.1 Write property test for minimum action items
  - **Property 2: Minimum action items**
  - **Validates: Requirements 1.3**

- [ ]* 3.2 Write property test for mold risk ventilation actions
  - **Property 6: Mold risk ventilation actions**
  - **Validates: Requirements 2.4**

- [ ]* 3.3 Write property test for open storage rainfall protection
  - **Property 7: Open storage rainfall protection**
  - **Validates: Requirements 2.5**

- [ ]* 3.4 Write property test for weather-specific action recommendations
  - **Property 10: Weather-specific action recommendations**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [ ]* 3.5 Write property test for action item count bounds
  - **Property 19: Action item count bounds**
  - **Validates: Requirements 7.1**

- [ ]* 3.6 Write property test for Bangla action items
  - **Property 20: Bangla action items**
  - **Validates: Requirements 7.4, 7.2**

- [ ]* 3.7 Write property test for storage equipment-specific actions
  - **Property 21: Storage equipment-specific actions**
  - **Validates: Requirements 7.5**

- [x] 4. Create SMS simulator module





  - Implement console logging function with SMS format
  - Add phone number, message, and timestamp formatting
  - Include "SMS ALERT" prefix in log output
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property test for SMS simulation format completeness
  - **Property 15: SMS simulation format completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 5. Create risk calculator service







  - Implement storage risk calculation using humidity, temperature, and storage type
  - Implement growing crop risk calculation using weather patterns
  - Create overall risk determination from multiple assessments
  - Add risk factor tracking and logging
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 8.5_

- [ ]* 5.1 Write property test for maximum risk level selection
  - **Property 14: Maximum risk level selection**
  - **Validates: Requirements 4.5**

- [ ]* 5.2 Write property test for decision rationale logging
  - **Property 22: Decision rationale logging**
  - **Validates: Requirements 8.5**

- [x] 6. Create SmartAlertService





  - Implement generateAlertsForFarmer method with crop batch retrieval
  - Create advisory generation loop for each crop
  - Integrate risk calculator, message formatter, and action generator
  - Add error handling for missing data
  - _Requirements: 1.5, 2.1, 3.1, 6.2, 6.3, 6.5_

- [ ]* 6.1 Write property test for one advisory per crop
  - **Property 4: One advisory per crop**
  - **Validates: Requirements 1.5**

- [ ]* 6.2 Write property test for storage advisory trigger
  - **Property 5: Storage advisory trigger**
  - **Validates: Requirements 2.1**

- [ ]* 6.3 Write property test for growing crop advisory generation
  - **Property 8: Growing crop advisory generation**
  - **Validates: Requirements 3.1**

- [ ]* 6.4 Write property test for all crops evaluated
  - **Property 16: All crops evaluated**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 6.5 Write property test for advisory count accuracy
  - **Property 18: Advisory count accuracy**
  - **Validates: Requirements 6.5**

- [x] 7. Integrate SmartAlertService with advisory storage





  - Create advisories via AdvisoryService for each generated alert
  - Implement SMS simulation trigger for Critical risk alerts
  - Add farmer phone number retrieval for SMS simulation
  - _Requirements: 5.1, 6.4_

- [ ]* 7.1 Write property test for advisory persistence
  - **Property 17: Advisory persistence**
  - **Validates: Requirements 6.4**

- [x] 8. Integrate with weather advisory generation flow





  - Add SmartAlertService call to WeatherAdvisoryService.generateForFarmer
  - Pass weather data and farmer ID to smart alert generation
  - Ensure smart alerts are created alongside existing weather advisories
  - _Requirements: 6.1_

- [ ]* 8.1 Write integration test for automatic decision engine trigger
  - Test that weather fetch triggers smart alert generation
  - **Validates: Requirements 6.1**

- [x] 9. Add client-side notification support





  - Update useAdvisoryNotifications hook to handle smart alerts
  - Add console logging for Critical alerts on client side
  - Ensure Bangla messages display correctly in notifications
  - _Requirements: 5.1_

- [x] 10. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
