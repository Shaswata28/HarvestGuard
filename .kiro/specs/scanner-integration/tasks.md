 Implementation Plan

## Phase 1: Basic Scanner (COMPLETED ✅)

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

## Phase 2: Pest Identification & Risk Assessment with Visual RAG (NEW)

- [x] 8. Enhance GeminiService with Google Search grounding (Visual RAG)
  - Add Google Search grounding tool to Gemini API configuration
  - Create new method `analyzePestImage()` for pest-specific analysis
  - Update prompts to explicitly request pest identification vs disease detection
  - Add risk level assessment (High/Medium/Low) to response structure
  - Parse grounding sources/citations from Gemini response
  - Keep existing `analyzeImage()` for backward compatibility
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 9. Update response types for pest identification and risk levels
  - Add `PestIdentification` interface with pest name, scientific name, risk level
  - Add `riskLevel` field to analysis response ('high' | 'medium' | 'low')
  - Add `groundingSources` array for Visual RAG citations
  - Add `scanType` field to distinguish 'disease' vs 'pest' scans
  - Update `AnalyzeScanResponse` in shared/api.ts
  - _Requirements: 3.1, 3.2_

- [x] 10. Create new API endpoint for pest identification
  - Create POST /api/scanner/analyze-pest route
  - Use same image upload handling as disease scanner
  - Call `analyzePestImage()` instead of `analyzeImage()`
  - Store pest scans with scanType='pest' in database
  - Return pest identification with risk level and grounding sources
  - _Requirements: 2.1, 2.4, 3.1, 3.2_

- [x] 11. Update UI to display risk levels with visual indicators
  - Add risk level badge component with color coding (red=high, yellow=medium, green=low)
  - Display risk level prominently in scan results
  - Add risk level to health journal scan cards
  - Show grounding sources as "Learn more" links
  - _Requirements: 3.2, 3.3_

- [x] 12. Add pest scanner mode toggle in UI
  - Add toggle/tabs to switch between "Disease Scanner" and "Pest Scanner"
  - Route to appropriate API endpoint based on selected mode
  - Update UI labels and instructions for pest scanning
  - Display pest-specific results (pest name, scientific name, risk level)
  - _Requirements: 2.1, 3.1_

- [x] 13. Update health journal to show both disease and pest scans
  - Add filter to view "All", "Diseases", or "Pests"
  - Display scan type badge on each scan card
  - Show risk level indicator on scan cards
  - Update detail view to handle both scan types
  - _Requirements: 4.4, 5.1, 5.2_

- [x] 14. Add Bengali translations for pest identification
  - Add pest-related UI text translations
  - Add risk level translations (উচ্চ, মাধ্যম, নিম্ন)
  - Update prompts to request Bengali pest names
  - _Requirements: 3.5_

- [x] 15. Final checkpoint - Test pest identification and risk levels
  - Test pest scanner with various pest images
  - Verify risk levels are displayed correctly
  - Check Visual RAG grounding sources appear
  - Test health journal filtering
  - Ensure all tests pass
  - Ask user for feedback
