# Implementation Plan

- [x] 1. Update AddCrop page to use backend API





  - Import useAuth hook to get farmerId and isOnline status
  - Replace offlineStorage.addCropBatch() with apiService.createCropBatch()
  - Build CreateCropBatchRequest payload with farmerId
  - Add loading state during API call
  - Handle online/offline modes (API call vs localStorage queue)
  - Add error handling with toast notifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add delete functionality to Dashboard


  - Add delete button to crop batch cards
  - Implement confirmation dialog before deletion
  - Call apiService.deleteCropBatch(id) on confirm
  - Remove deleted crop from UI state
  - Handle errors with toast notifications
  - Refresh dashboard data after successful deletion
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create EditCrop page for editing existing crops


  - Create new EditCrop.tsx page component
  - Add route /edit-crop/:id in App.tsx
  - Load crop data from route params or fetch from API
  - Pre-fill form with existing crop data
  - Reuse AddCrop form components (WeightInput, date pickers, etc.)
  - Submit updates via apiService.updateCropBatch(id, data)
  - Handle online/offline modes
  - Redirect to dashboard on success
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Add edit button to Dashboard crop cards


  - Add edit button/icon to each crop batch card
  - Navigate to /edit-crop/:id with crop ID
  - Pass crop data via route state for faster loading
  - _Requirements: 2.1_

- [x] 5. Implement stage transition (growing → harvested)


  - Add "Mark as Harvested" button to growing crops in Dashboard
  - Create modal/dialog to collect harvest details (weight, date, storage)
  - Call apiService.transitionCropStage(id, data) with harvest details
  - Update crop stage in UI after successful transition
  - Validate that only growing crops can be transitioned
  - Handle errors with toast notifications
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Add transitionCropStage method to API service


  - Add transitionCropStage() method to apiService
  - Call PUT /api/crop-batches/:id/stage endpoint
  - Include finalWeightKg, actualHarvestDate, storageLocation in payload
  - Return updated CropBatchResponse
  - _Requirements: 4.2, 4.3_

- [x] 7. Enhance offline storage for edit/delete operations


  - Update offlineStorageService.queueAction() to handle edit/delete types
  - Add methods to update/delete crops in localStorage cache
  - Ensure queued actions sync when going online
  - Handle conflict resolution (last-write-wins)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Test end-to-end crop management flow
  - Test: Create crop online → appears in dashboard
  - Test: Edit crop → changes reflected in dashboard
  - Test: Delete crop → removed from dashboard
  - Test: Mark as harvested → stage updates correctly
  - Test: Offline create → syncs when online
  - Test: Error handling → appropriate messages shown
