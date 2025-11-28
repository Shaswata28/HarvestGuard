# Implementation Plan

- [x] 1. Set up Gemini API client and service









  - Install @google/generative-ai package
  - Create Gemini service with image analysis function
  - Configure API to return Bengali responses
  - Implement basic error handling
  - _Requirements: 2.1, 2.2, 3.5_

- [x] 2. Create image processing utilities





  - Implement image validation (format and size checks)
  - Add image compression for files >10MB
  - Create base64 conversion utility
  - _Requirements: 1.2, 1.5_

- [x] 3. Build scanner API endpoint


  - Create POST /api/scanner/analyze route
  - Handle multipart/form-data image upload
  - Integrate with Gemini service
  - Parse Gemini response and create HealthScan record
  - Return analysis results to client
  - _Requirements: 2.1, 2.4, 4.1, 4.2, 4.3_

- [x] 4. Create Scanner page UI


  - Build camera capture interface
  - Add gallery upload button
  - Implement image preview with retake/reselect options
  - Add crop batch selection dropdown
  - Show loading state during analysis
  - Display results with disease info and recommendations
  - Add offline detection warning
  - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.2, 4.5_

- [x] 5. Integrate with existing health journal

  - Ensure new scans appear in health journal list
  - Display scan images and analysis in detail view
  - Add Bengali text support in UI
  - _Requirements: 4.4, 5.1, 5.2, 5.3_

- [x] 6. Add shared TypeScript types

  - Create AnalyzeScanRequest and AnalyzeScanResponse interfaces
  - Add ScannerErrorResponse type
  - Update shared/api.ts
  - _Requirements: All_

- [x] 7. Final integration and manual testing checkpoint


  - Ensure all components work together
  - Test camera capture flow
  - Test gallery upload flow
  - Verify Gemini API integration
  - Check health journal display
  - Ask user for feedback
  - _Requirements: All_
