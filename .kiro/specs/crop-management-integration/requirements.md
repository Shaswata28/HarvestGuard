# Requirements Document

## Introduction

This document specifies the requirements for integrating crop management features (create, edit, delete, stage transition) with the backend MongoDB API. The system will transition the AddCrop page from using localStorage to calling backend API endpoints, and add edit/delete functionality to the Dashboard for managing existing crops.

## Glossary

- **Crop Batch**: A collection of crops tracked from planting through harvest
- **Stage**: The lifecycle phase of a crop batch (growing or harvested)
- **Stage Transition**: Moving a crop batch from growing to harvested stage
- **FarmerId**: A unique identifier (MongoDB ObjectId) for each farmer
- **Online Mode**: Application state when connected to the backend API
- **Offline Mode**: Application state when using cached localStorage data as fallback

## Requirements

### Requirement 1

**User Story:** As a farmer, I want to save new crop batches to the database, so that my data persists across devices and sessions.

#### Acceptance Criteria

1. WHEN a farmer submits the AddCrop form in online mode THEN the system SHALL call POST /api/crop-batches with the crop data
2. WHEN the crop batch is successfully created THEN the system SHALL redirect to the dashboard
3. WHEN the API call fails THEN the system SHALL fall back to saving in localStorage for offline sync
4. THE system SHALL include farmerId in the crop batch creation request
5. THE system SHALL convert weight units (mon to kg) before sending to the API

### Requirement 2

**User Story:** As a farmer, I want to edit existing crop batches, so that I can correct mistakes or update information.

#### Acceptance Criteria

1. WHEN a farmer clicks edit on a crop batch THEN the system SHALL navigate to an edit form pre-filled with existing data
2. WHEN the farmer submits the edit form THEN the system SHALL call PUT /api/crop-batches/:id with updated data
3. WHEN the update succeeds THEN the system SHALL redirect to the dashboard with updated data
4. THE system SHALL preserve the crop batch ID during editing
5. THE system SHALL handle API errors gracefully with user feedback

### Requirement 3

**User Story:** As a farmer, I want to delete crop batches, so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. WHEN a farmer clicks delete on a crop batch THEN the system SHALL show a confirmation dialog
2. WHEN the farmer confirms deletion THEN the system SHALL call DELETE /api/crop-batches/:id
3. WHEN the deletion succeeds THEN the system SHALL remove the crop from the UI
4. WHEN the deletion fails THEN the system SHALL display an error message
5. THE system SHALL refresh the dashboard data after successful deletion

### Requirement 4

**User Story:** As a farmer, I want to transition crops from growing to harvested, so that I can update their status when I harvest them.

#### Acceptance Criteria

1. WHEN a farmer clicks "Mark as Harvested" on a growing crop THEN the system SHALL show a form to enter harvest details
2. WHEN the farmer submits harvest details THEN the system SHALL call PUT /api/crop-batches/:id/stage with the new data
3. THE system SHALL include finalWeightKg, actualHarvestDate, and storageLocation in the stage transition request
4. WHEN the transition succeeds THEN the system SHALL update the crop's stage to "harvested" in the UI
5. THE system SHALL validate that only growing crops can be transitioned to harvested

### Requirement 5

**User Story:** As a farmer, I want offline support for crop management, so that I can work without internet connectivity.

#### Acceptance Criteria

1. WHEN the farmer is offline and creates a crop THEN the system SHALL save it to localStorage
2. WHEN the farmer is offline and edits a crop THEN the system SHALL update it in localStorage
3. WHEN the farmer is offline and deletes a crop THEN the system SHALL remove it from localStorage
4. WHEN the application goes online THEN the system SHALL sync pending changes to the backend
5. THE system SHALL queue offline actions for later synchronization
