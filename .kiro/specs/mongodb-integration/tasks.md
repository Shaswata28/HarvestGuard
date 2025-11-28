# Implementation Plan

- [x] 1. Set up MongoDB connection and dependencies





  - Install mongodb driver and fast-check for property testing
  - Create database connection module with connection pooling
  - Add connection error handling and retry logic
  - Test connection on server startup
  - _Requirements: 1.1, 1.3, 1.5_

- [ ]* 1.1 Write property test for connection error handling
  - **Property 13: Structured error responses**
  - **Validates: Requirements 12.1**

- [x] 2. Create Zod schemas and TypeScript types





  - Define Zod schema for farmers collection
  - Define Zod schema for crop_batches collection
  - Define Zod schema for health_scans collection
  - Define Zod schema for loss_events collection
  - Define Zod schema for interventions collection
  - Define Zod schema for advisories collection
  - Define Zod schema for sessions collection
  - Define Zod schema for weather_snapshots collection
  - Export TypeScript types from schemas
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 2.1 Write property test for schema validation
  - **Property 1: Schema validation rejects invalid documents**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 3. Implement base repository pattern





  - Create base repository interface with CRUD operations
  - Implement generic repository class with common methods
  - Add validation integration with Zod schemas
  - Add error handling utilities
  - _Requirements: 2.1, 2.2, 12.1_

- [ ]* 3.1 Write property test for document round-trip
  - **Property 2: Document creation round-trip preserves data**
  - **Validates: Requirements 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 11.1**

- [ ]* 3.2 Write property test for validation error completeness
  - **Property 15: Validation errors include all failures**
  - **Validates: Requirements 12.4**

- [x] 4. Implement farmers repository and indexes





  - Create FarmersRepository extending base repository
  - Implement findByPhone method
  - Create unique index on phone field
  - Create location indexes (division, district, upazila)
  - Add password hashing utility using bcrypt
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for phone uniqueness
  - **Property 3: Phone number uniqueness constraint**
  - **Validates: Requirements 3.2**

- [ ]* 4.2 Write property test for password hashing
  - **Property 4: Password hashing prevents plaintext storage**
  - **Validates: Requirements 3.3**

- [ ]* 4.3 Write property test for automatic timestamps
  - **Property 7: Automatic timestamp generation**
  - **Validates: Requirements 3.5, 6.5, 7.5, 11.3**

- [ ]* 4.4 Write property test for unique constraint error identification
  - **Property 14: Unique constraint violation errors identify field**
  - **Validates: Requirements 12.2**


- [x] 5. Implement crop batches repository and indexes




  - Create CropBatchesRepository extending base repository
  - Implement findByFarmerId method
  - Implement findByLocation method
  - Implement updateStage method for stage transitions
  - Create indexes on (farmerId, stage) and (storageDivision, storageDistrict)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for referential integrity
  - **Property 5: Referential integrity for foreign keys**
  - **Validates: Requirements 4.2, 5.2, 5.3, 6.2, 7.2, 9.2**

- [ ]* 5.2 Write property test for stage-specific fields
  - **Property 6: Stage-specific field requirements**
  - **Validates: Requirements 4.3, 4.4**

- [x] 6. Implement health scans repository and indexes




  - Create HealthScansRepository extending base repository
  - Implement findByFarmerId method
  - Implement findByBatchId method
  - Implement updateStatus method
  - Create indexes on (farmerId, capturedAt) and (batchId)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement loss events repository and indexes





  - Create LossEventsRepository extending base repository
  - Implement findByFarmerId method
  - Implement findByBatchId method
  - Implement aggregateLossByLocation method
  - Create indexes on (farmerId, reportedAt) and (batchId)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Implement interventions repository and indexes





  - Create InterventionsRepository extending base repository
  - Implement findByFarmerId method
  - Implement findByBatchId method
  - Implement calculateSuccessRate method
  - Create indexes on (farmerId, performedAt), (batchId), and (success)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Implement advisories repository and indexes





  - Create AdvisoriesRepository extending base repository
  - Implement findByFarmerId method
  - Implement findUnread method
  - Implement markAsRead method
  - Create indexes on (farmerId, status, createdAt) and (source, createdAt)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 9.1 Write property test for broadcast advisories
  - **Property 8: Optional farmerId for broadcast advisories**
  - **Validates: Requirements 8.2**

- [x] 10. Implement sessions repository and indexes




  - Create SessionsRepository extending base repository
  - Implement findByFarmerId method
  - Implement validateSession method
  - Implement deleteExpired method
  - Create indexes on (farmerId, expiresAt) with TTL index on expiresAt
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 10.1 Write property test for session expiration
  - **Property 9: Session expiration validation**
  - **Validates: Requirements 9.5**

- [x] 11. Implement weather snapshots repository (optional)





  - Create WeatherSnapshotsRepository extending base repository
  - Implement findByLocation method
  - Implement findRecent method
  - Create indexes on (division, district, upazila, capturedAt)
  - Add optional TTL index for data retention
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 11.1 Write property test for location-based queries
  - **Property 12: Location-based queries return matching documents**
  - **Validates: Requirements 11.5**

- [x] 12. Checkpoint - Ensure all repository tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement farmer service layer





  - Create FarmerService with registration logic
  - Implement authentication logic (password verification)
  - Implement profile management methods
  - Add business validation rules
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 14. Implement crop batch service layer





  - Create CropBatchService with batch creation logic
  - Implement stage transition logic (growing → harvested)
  - Implement loss tracking calculations
  - Add business validation for stage transitions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 15. Implement dashboard service layer




  - Create DashboardService for aggregations
  - Implement farmer dashboard metrics (total crops, total weight, badges)
  - Implement admin dashboard metrics (total farmers, total loss, success rate)
  - Add aggregation queries across collections
  - _Requirements: 10.3, 10.4, 10.5_

- [ ]* 15.1 Write property test for aggregation correctness
  - **Property 10: Aggregation correctness across collections**
  - **Validates: Requirements 10.3, 10.5**

- [ ]* 15.2 Write property test for join operations
  - **Property 11: Join operations return related documents**
  - **Validates: Requirements 10.4**

- [x] 16. Implement health scan service layer




  - Create HealthScanService with scan recording logic
  - Implement status update logic
  - Implement outcome tracking logic
  - Add business rules for scan validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 17. Implement advisory service layer




  - Create AdvisoryService with advisory creation logic
  - Implement delivery logic for farmer-specific and broadcast advisories
  - Implement read tracking logic
  - Add business rules for advisory generation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 18. Create API routes for farmers





  - Create POST /api/farmers/register endpoint
  - Create POST /api/farmers/login endpoint
  - Create GET /api/farmers/:id endpoint
  - Create PUT /api/farmers/:id endpoint
  - Add request validation middleware
  - Add error handling middleware
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 19. Create API routes for crop batches





  - Create POST /api/crop-batches endpoint
  - Create GET /api/crop-batches endpoint with filtering
  - Create GET /api/crop-batches/:id endpoint
  - Create PUT /api/crop-batches/:id endpoint
  - Create PUT /api/crop-batches/:id/stage endpoint for transitions
  - Create DELETE /api/crop-batches/:id endpoint
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 20. Create API routes for health scans




  - Create POST /api/health-scans endpoint
  - Create GET /api/health-scans endpoint with filtering
  - Create GET /api/health-scans/:id endpoint
  - Create PUT /api/health-scans/:id/status endpoint
  - Create PUT /api/health-scans/:id/outcome endpoint
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 21. Create API routes for loss events





  - Create POST /api/loss-events endpoint
  - Create GET /api/loss-events endpoint with filtering
  - Create GET /api/loss-events/:id endpoint
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 22. Create API routes for interventions




  - Create POST /api/interventions endpoint
  - Create GET /api/interventions endpoint with filtering
  - Create GET /api/interventions/:id endpoint
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 23. Create API routes for advisories





  - Create POST /api/advisories endpoint
  - Create GET /api/advisories endpoint with filtering
  - Create GET /api/advisories/:id endpoint
  - Create PUT /api/advisories/:id/read endpoint
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 24. Create API routes for dashboard




  - Create GET /api/dashboard/farmer/:farmerId endpoint
  - Create GET /api/dashboard/admin endpoint
  - Add aggregation logic for metrics
  - _Requirements: 10.3, 10.4, 10.5_

- [x] 25. Update shared types for API contracts





  - Create shared types in shared/api.ts for all request/response interfaces
  - Export types for farmers, crop batches, health scans, etc.
  - Ensure type consistency between client and server
  - _Requirements: All_

- [x] 26. Final checkpoint - Integration testing





  - Ensure all tests pass, ask the user if questions arise.
  - Test end-to-end flows (registration → crop batch → scan → advisory)
  - Verify error handling across all endpoints
  - Test with MongoDB Compass to verify data structure
