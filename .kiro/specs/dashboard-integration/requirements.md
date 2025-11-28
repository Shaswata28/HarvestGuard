# Requirements Document

## Introduction

This document specifies the requirements for integrating the Dashboard page with the backend API to fetch and display real farmer data. The system will transition from using mock localStorage data to fetching live data from MongoDB via the Express API, while maintaining offline storage as a fallback for offline mode. The integration will support farmer authentication, data persistence, and seamless online/offline transitions.

## Glossary

- **Dashboard**: The main farmer interface displaying crop statistics, weather, and advisories
- **Farmer**: A registered user authenticated via the login system
- **FarmerId**: A unique identifier (MongoDB ObjectId) for each farmer
- **LocalStorage**: Browser storage used for offline data caching
- **Session**: An authenticated user session stored after successful login
- **Online Mode**: Application state when connected to the backend API
- **Offline Mode**: Application state when using cached localStorage data
- **Crop Batch**: A collection of crops tracked from planting through harvest
- **Dashboard Metrics**: Aggregated statistics including total crops, total weight, and badges

## Requirements

### Requirement 1

**User Story:** As a farmer, I want my login to establish an authenticated session, so that I can access my personal dashboard data.

#### Acceptance Criteria

1. WHEN a farmer successfully logs in THEN the system SHALL store the farmerId in localStorage
2. WHEN a farmer successfully logs in THEN the system SHALL store the authentication token in localStorage
3. THE system SHALL persist the farmerId across browser sessions
4. WHEN the application loads THEN the system SHALL check for an existing farmerId in localStorage
5. IF no farmerId exists THEN the system SHALL redirect unauthenticated users to the login page

### Requirement 2

**User Story:** As a farmer, I want to see my real crop data on the dashboard, so that I can track my agricultural activities accurately.

#### Acceptance Criteria

1. WHEN the dashboard loads in online mode THEN the system SHALL fetch dashboard data from GET /api/dashboard/farmer/:farmerId
2. WHEN the dashboard data is fetched THEN the system SHALL display total crops, total weight, and earned badges
3. WHEN the dashboard loads in online mode THEN the system SHALL fetch crop batches from GET /api/crop-batches?farmerId=xxx
4. WHEN crop batches are fetched THEN the system SHALL display them in the crop list
5. THE system SHALL handle API errors gracefully and display error messages to the user

### Requirement 3

**User Story:** As a farmer, I want the dashboard to work offline, so that I can access my data even without internet connectivity.

#### Acceptance Criteria

1. WHEN the dashboard successfully fetches data THEN the system SHALL cache the data in localStorage
2. WHEN the dashboard loads in offline mode THEN the system SHALL retrieve cached data from localStorage
3. WHEN displaying cached data THEN the system SHALL indicate to the user that they are viewing offline data
4. WHEN the application transitions from offline to online THEN the system SHALL automatically refresh data from the API
5. THE system SHALL detect online/offline status changes and update the UI accordingly

### Requirement 4

**User Story:** As a farmer, I want my dashboard to show loading states, so that I know when data is being fetched.

#### Acceptance Criteria

1. WHEN the dashboard begins fetching data THEN the system SHALL display a loading indicator
2. WHEN data fetching completes THEN the system SHALL hide the loading indicator
3. WHEN data fetching fails THEN the system SHALL display an error message
4. THE system SHALL prevent multiple simultaneous fetch requests for the same data
5. THE system SHALL provide visual feedback for all asynchronous operations

### Requirement 5

**User Story:** As a farmer, I want to log out of my session, so that I can secure my account on shared devices.

#### Acceptance Criteria

1. WHEN a farmer logs out THEN the system SHALL remove the farmerId from localStorage
2. WHEN a farmer logs out THEN the system SHALL remove the authentication token from localStorage
3. WHEN a farmer logs out THEN the system SHALL clear cached dashboard data
4. WHEN a farmer logs out THEN the system SHALL redirect to the login page
5. THE system SHALL provide a logout button accessible from the dashboard

### Requirement 6

**User Story:** As a developer, I want to use React Context for authentication state, so that farmerId is accessible throughout the application.

#### Acceptance Criteria

1. THE system SHALL create an AuthContext to manage authentication state
2. THE AuthContext SHALL provide farmerId, isAuthenticated, login, and logout functions
3. WHEN the application loads THEN the AuthContext SHALL initialize from localStorage
4. WHEN authentication state changes THEN the system SHALL update all consuming components
5. THE system SHALL use the AuthContext in Dashboard, Login, and other protected pages

### Requirement 7

**User Story:** As a farmer, I want seamless data synchronization, so that my online and offline experiences are consistent.

#### Acceptance Criteria

1. WHEN online data is fetched THEN the system SHALL merge it with any pending offline changes
2. WHEN the application goes online THEN the system SHALL sync pending offline changes to the server
3. THE system SHALL resolve conflicts between offline and online data using last-write-wins strategy
4. WHEN sync completes THEN the system SHALL update the UI with the latest data
5. THE system SHALL log sync operations for debugging purposes

### Requirement 8

**User Story:** As a developer, I want type-safe API calls, so that I can catch errors at compile time.

#### Acceptance Criteria

1. THE system SHALL use shared TypeScript types from shared/api.ts for all API requests
2. THE system SHALL validate API responses against expected types
3. WHEN API responses don't match expected types THEN the system SHALL log a warning
4. THE system SHALL use TypeScript interfaces for all dashboard data structures
5. THE system SHALL ensure type consistency between frontend and backend

### Requirement 9

**User Story:** As a farmer, I want to see weather data on my dashboard, so that I can plan my agricultural activities.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch weather data for the farmer's location
2. THE system SHALL use the farmer's stored location (division, district, upazila) for weather queries
3. WHEN weather data is unavailable THEN the system SHALL display a fallback message
4. THE system SHALL cache weather data with a reasonable expiration time
5. THE system SHALL display weather advisories relevant to the farmer's crops

### Requirement 10

**User Story:** As a farmer, I want to see my health scan history on the dashboard, so that I can track disease detection over time.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch recent health scans from GET /api/health-scans?farmerId=xxx
2. THE system SHALL display health scan results with disease labels and confidence scores
3. THE system SHALL show scan timestamps and associated crop batches
4. WHEN no health scans exist THEN the system SHALL display an empty state message
5. THE system SHALL limit the display to the most recent 10 health scans
