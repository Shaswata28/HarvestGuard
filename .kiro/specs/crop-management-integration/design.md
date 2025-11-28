# Design Document

## Overview

This design document outlines the integration of crop management features (create, edit, delete, stage transition) with the backend MongoDB API. The implementation will update the AddCrop page to call backend endpoints and add edit/delete functionality to the Dashboard, while maintaining offline support as a fallback.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AddCrop    │  │  Dashboard   │  │  EditCrop    │      │
│  │    Page      │  │    Page      │  │    Page      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Service Layer                          │
│  - createCropBatch()                                         │
│  - updateCropBatch()                                         │
│  - deleteCropBatch()                                         │
│  - transitionCropStage()                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Express API Backend    │  │  Offline Storage Layer   │
│  POST /api/crop-batches  │  │  - localStorage fallback │
│  PUT /api/crop-batches   │  │  - sync queue            │
│  DELETE /api/crop-batches│  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

## Components and Interfaces

### 1. AddCrop Page Updates

**Location**: `client/pages/AddCrop.tsx`

**Changes**:
- Replace `offlineStorage.addCropBatch()` with `apiService.createCropBatch()`
- Add farmerId from AuthContext
- Handle online/offline modes
- Show loading state during API call
- Handle errors with toast notifications

**Implementation**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation...
  
  const cropData: CreateCropBatchRequest = {
    farmerId: farmerId!,
    cropType: "ধান",
    stage: stage,
    enteredDate: new Date().toISOString(),
    ...(stage === "growing" ? {
      estimatedWeightKg: weightInKg,
      expectedHarvestDate: date
    } : {
      finalWeightKg: weightInKg,
      actualHarvestDate: date,
      storageLocation: storageType,
      storageDivision: farmerData.division,
      storageDistrict: farmerData.district
    })
  };
  
  try {
    if (isOnline) {
      await apiService.createCropBatch(cropData);
    } else {
      offlineStorageService.queueAction({
        id: generateId(),
        type: 'create',
        resource: 'crop-batch',
        data: cropData,
        timestamp: new Date().toISOString()
      });
    }
    setIsSuccess(true);
    setTimeout(() => navigate("/dashboard"), 2500);
  } catch (error) {
    toast({ title: "Error saving crop", variant: "destructive" });
  }
};
```

### 2. EditCrop Page (New)

**Location**: `client/pages/EditCrop.tsx`

**Responsibilities**:
- Load existing crop data from route params or API
- Pre-fill form with existing values
- Submit updates via PUT /api/crop-batches/:id
- Handle offline mode with localStorage

**Route**: `/edit-crop/:id`

### 3. Dashboard Updates

**Location**: `client/pages/Dashboard.tsx`

**Changes**:
- Add edit button to each crop batch card
- Add delete button with confirmation dialog
- Add "Mark as Harvested" button for growing crops
- Implement delete handler calling `apiService.deleteCropBatch()`
- Implement stage transition handler

**Delete Handler**:
```typescript
const handleDeleteCrop = async (cropId: string) => {
  if (!confirm("Are you sure you want to delete this crop?")) return;
  
  try {
    await apiService.deleteCropBatch(cropId);
    // Refresh dashboard data
    setCropBatches(prev => prev.filter(c => c._id !== cropId));
    toast({ title: "Crop deleted successfully" });
  } catch (error) {
    toast({ title: "Error deleting crop", variant: "destructive" });
  }
};
```

### 4. API Service Updates

**Location**: `client/services/api.ts`

**New Methods**:
```typescript
// Already exists, just ensure it's being used
createCropBatch(data: CreateCropBatchRequest): Promise<CropBatchResponse>;

// Already exists
updateCropBatch(id: string, data: UpdateCropBatchRequest): Promise<CropBatchResponse>;

// Already exists
deleteCropBatch(id: string): Promise<void>;

// New method for stage transition
transitionCropStage(id: string, data: {
  stage: 'harvested';
  finalWeightKg: number;
  actualHarvestDate: string;
  storageLocation: string;
  storageDivision?: string;
  storageDistrict?: string;
}): Promise<CropBatchResponse> {
  return handleApiCall(`/api/crop-batches/${id}/stage`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
```

### 5. Offline Storage Updates

**Location**: `client/services/offlineStorage.ts`

**Changes**:
- Ensure queueAction() properly stores pending operations
- Add methods to handle edit/delete in offline mode
- Sync queued actions when online

## Data Models

### CreateCropBatchRequest
```typescript
interface CreateCropBatchRequest {
  farmerId: string;
  cropType: string;
  stage: 'growing' | 'harvested';
  enteredDate: string;
  estimatedWeightKg?: number;
  expectedHarvestDate?: string;
  finalWeightKg?: number;
  actualHarvestDate?: string;
  storageLocation?: string;
  storageDivision?: string;
  storageDistrict?: string;
}
```

### UpdateCropBatchRequest
```typescript
interface UpdateCropBatchRequest {
  cropType?: string;
  estimatedWeightKg?: number;
  expectedHarvestDate?: string;
  finalWeightKg?: number;
  actualHarvestDate?: string;
  storageLocation?: string;
  storageDivision?: string;
  storageDistrict?: string;
}
```

## Error Handling

### Error Categories

1. **Network Errors**: Fall back to offline storage, queue for sync
2. **Validation Errors**: Display inline error messages
3. **Not Found Errors**: Redirect to dashboard with error message
4. **Server Errors**: Display error toast, keep data in form

### Error Display
- Use toast notifications for transient errors
- Show inline validation errors on forms
- Confirm dialogs for destructive actions (delete)

## Testing Strategy

Since you want to test manually in the real app, we'll skip automated tests for now. Focus on:

**Manual Testing Checklist**:
- [ ] Create crop online - saves to database
- [ ] Create crop offline - saves to localStorage
- [ ] Edit crop - updates in database
- [ ] Delete crop - removes from database
- [ ] Mark as harvested - transitions stage correctly
- [ ] Offline sync - queued actions sync when online
