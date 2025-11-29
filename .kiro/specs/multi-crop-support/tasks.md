# Implementation Plan: Multi-Crop Support

- [x] 1. Create crop type configuration





  - Add `CropType` interface to `client/data/mockData.ts`
  - Define initial crop types array with 8+ common Bangladeshi crops (rice, wheat, jute, potato, tomato, lentil, mustard, corn)
  - Include id, label_bn, label_en, icon, and category for each crop
  - Export `cropTypes` array for use across the application
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [ ]* 1.1 Write property test for crop configuration completeness
  - **Property 1: Crop configuration completeness**
  - **Validates: Requirements 1.1, 3.3**

- [x] 2. Create crop display helper function





  - Add `getCropDisplay` function to `client/data/mockData.ts` or new `client/utils/cropHelpers.ts`
  - Function should accept crop type ID and language preference
  - Return object with name and icon
  - Handle legacy crop type values (e.g., "ধান") for backward compatibility
  - Handle unknown crop types with fallback display
  - _Requirements: 1.4, 1.5, 1.6_

- [ ]* 2.1 Write property test for language-specific name display
  - **Property 4: Language-specific name display**
  - **Validates: Requirements 1.4**

- [ ]* 2.2 Write unit tests for getCropDisplay helper
  - Test with valid crop IDs in both languages
  - Test with legacy crop names ("ধান")
  - Test with invalid/unknown crop IDs
  - Test fallback behavior
  - _Requirements: 1.4_

- [x] 3. Update AddCrop component with crop selection UI





  - Add `cropType` state variable to `AddCrop.tsx`
  - Import `cropTypes` configuration
  - Replace hardcoded rice section with crop selection grid
  - Implement 2-column grid layout with crop buttons
  - Display crop icon and localized name for each option
  - Add visual feedback for selected crop (border, background color)
  - Update form submission to use selected `cropType` instead of hardcoded "ধান"
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2_

- [ ]* 3.1 Write property test for crop type storage consistency
  - **Property 2: Crop type storage consistency**
  - **Validates: Requirements 1.2**

- [ ]* 3.2 Write property test for icon presence
  - **Property 5: Icon presence for all crops**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 4. Add crop type validation to AddCrop form

  - Add validation check before form submission
  - Show error toast if no crop type selected
  - Use localized error messages (Bengali and English)
  - Prevent form submission when crop type is empty
  - _Requirements: 1.3, 6.1, 6.3_

- [ ]* 4.1 Write property test for empty crop type rejection
  - **Property 3: Empty crop type rejection**
  - **Validates: Requirements 1.3, 6.1**

- [x] 5. Update localization strings


  - Add crop selection related strings to `client/locales/strings.ts`
  - Add "select_crop" and "select_crop_en" translations
  - Add "search_crop" and "search_crop_en" translations (for future use)
  - Add validation error messages for crop type
  - Ensure all new UI text has both Bengali and English versions
  - _Requirements: 1.1, 1.5, 1.6_

- [x] 6. Update dashboard and inventory displays


  - Update `client/pages/Dashboard.tsx` to use `getCropDisplay` helper
  - Update any inventory list components to show crop icons and localized names
  - Replace hardcoded crop type displays with dynamic lookups
  - Test display with mixed crop types (legacy and new)
  - _Requirements: 1.4, 2.3_

- [x] 7. Add backend validation for crop type


  - Verify `CropBatchSchema` in `server/db/schemas/index.ts` validates non-empty crop type
  - Ensure validation error messages are clear
  - Test API endpoint rejects empty crop type
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 7.1 Write property test for non-empty string acceptance
  - **Property 6: Non-empty string acceptance**
  - **Validates: Requirements 6.2**

- [ ]* 7.2 Write unit tests for backend validation
  - Test crop batch creation with valid crop types
  - Test crop batch creation with empty crop type (should fail)
  - Test error message format
  - _Requirements: 6.1, 6.3_

- [x] 8. Implement search/filter functionality (optional enhancement)





  - Add search input field above crop selection grid
  - Implement client-side filtering by crop name (Bengali or English)
  - Show/hide search based on number of crops (>10)
  - Add clear search functionality
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 8.1 Write property test for search filter correctness
  - **Property 7: Search filter correctness**
  - **Validates: Requirements 5.2**

- [ ]* 8.2 Write property test for search clear round-trip
  - **Property 8: Search clear round-trip**
  - **Validates: Requirements 5.3**

- [x] 9. Implement user crop history tracking (optional enhancement)





  - Track which crop types each farmer has used in previous batches
  - Query farmer's crop batches to get unique crop types
  - Store or compute frequently used crops
  - _Requirements: 7.1, 7.3_

- [ ]* 9.1 Write property test for user crop history tracking
  - **Property 9: User crop history tracking**
  - **Validates: Requirements 7.1**

- [ ]* 9.2 Write property test for full crop list availability
  - **Property 10: Full crop list availability**
  - **Validates: Requirements 7.3**

- [x] 10. Checkpoint - Ensure all tests pass




  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Test offline mode with new crop types
  - Test language switching with crop selection
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 11. Integration testing
  - Test complete flow: select crop → fill form → submit → view in dashboard
  - Test with multiple different crop types
  - Test in both Bengali and English languages
  - Test offline mode: add crop offline → sync when online
  - Test backward compatibility with existing rice entries
  - _Requirements: All_
