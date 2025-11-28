# Implementation Plan

- [x] 1. Create AuthContext for global authentication state




  - Create AuthContext with farmerId, isAuthenticated, login, logout functions
  - Initialize from localStorage on mount
  - Integrate useOnlineStatus hook for connectivity tracking
  - Wrap App with AuthProvider
  - _Requirements: 1.1, 1.3, 1.4, 6.1, 6.2, 6.3_

- [x] 2. Create API service layer for type-safe backend calls


  - Create apiService with fetchDashboardData, fetchCropBatches, fetchHealthScans methods
  - Use shared types from shared/api.ts
  - Implement basic error handling with ApiError class
  - _Requirements: 2.1, 2.3, 8.1, 8.2_

- [x] 3. Enhance offline storage service for caching


  - Add cacheDashboardData, getCachedDashboardData methods
  - Add cacheCropBatches, getCachedCropBatches methods
  - Add cacheHealthScans, getCachedHealthScans methods
  - Implement cache expiration checking
  - _Requirements: 3.1, 3.2_

- [x] 4. Update Login page to use backend API and AuthContext


  - Call /api/farmers/login endpoint on OTP verification
  - Store farmerId in AuthContext on successful login
  - Cache farmer profile data
  - Redirect to dashboard after login
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 5. Update Dashboard page to fetch real data from backend


  - Use AuthContext to get farmerId
  - Fetch dashboard data, crop batches, and health scans from API
  - Cache fetched data in localStorage
  - Display loading states during fetch
  - Handle API errors with fallback to cache
  - Show offline indicator when using cached data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 6. Implement logout functionality

  - Add logout button to Dashboard
  - Clear farmerId and auth token from localStorage
  - Clear cached dashboard data
  - Redirect to login page
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Add online/offline transition handling

  - Detect online status changes using useOnlineStatus
  - Refresh data from API when transitioning to online
  - Update UI to reflect online/offline status
  - _Requirements: 3.4, 3.5_

- [x] 8. Transform API responses to match existing UI data structures


  - Create transformation functions for CropBatchResponse → CropBatch
  - Create transformation functions for HealthScanResponse → ScanRecord
  - Create transformation functions for FarmerDashboardResponse → dashboard metrics
  - Ensure backward compatibility with existing UI components
  - _Requirements: 2.2, 2.4, 10.2, 10.3_

- [x] 9. Update weather integration to use farmer location

  - Use farmer's division, district, upazila from AuthContext
  - Pass farmerId to weather API endpoints
  - Cache weather data with 30-minute expiration
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 10. Checkpoint - Test end-to-end flow



  - Ensure all tests pass, ask the user if questions arise.
  - Test: Login → Dashboard loads → Data displays → Logout
  - Test: Go offline → Dashboard shows cached data → Go online → Data refreshes
