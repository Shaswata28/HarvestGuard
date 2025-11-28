# Implementation Plan

- [x] 1. Create cache service for profile data





  - Create `client/services/cache.ts` with basic get/set/clear methods
  - Implement TTL-based staleness detection
  - Add farmerId-scoped cache keys
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 2. Update Profile page to use MongoDB API

  - [x] 2.1 Replace offline storage with API calls


    - Remove offlineStorage imports and usage
    - Add useAuth hook to get farmerId
    - Fetch dashboard data from `/api/dashboard/farmer/:farmerId`
    - Implement loading, error, and success states
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Integrate dashboard statistics display

    - Map FarmerDashboardResponse to UI components
    - Display totalCrops, totalWeightKg, growingCrops, harvestedCrops
    - Handle missing or zero values gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Update badge system to use API badges

    - Map badge IDs from API to badge definitions
    - Update badge rendering to show earned/locked states
    - Handle empty badge arrays
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


  - [x] 2.4 Implement cache integration

    - Cache dashboard data on successful fetch
    - Use cached data when offline
    - Show staleness indicator for old cache
    - Auto-refresh when coming back online
    - _Requirements: 7.1, 7.2, 7.3, 7.4_



- [ ] 3. Update logout functionality
  - Use AuthContext logout method
  - Ensure all auth data is cleared
  - Clear profile cache on logout
  - Navigate to login page
  - Show success toast
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Update CSV export to use API data

  - Fetch crop batches from `/api/crop-batches?farmerId=X`
  - Generate CSV with all crop batch fields
  - Trigger browser download
  - Handle export errors with toast
  - Show success message on completion
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Verify language support


  - Test Bangla number formatting with toBanglaDigits
  - Test date formatting with bn-BD and en-US locales
  - Verify all UI text uses translation function
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Final integration testing


  - Test complete profile load flow
  - Test offline/online transitions
  - Test logout and export flows
  - Verify error handling and retry
  - _Requirements: All_
