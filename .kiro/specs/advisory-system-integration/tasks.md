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
