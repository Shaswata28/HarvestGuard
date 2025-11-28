# Design Document

## Overview

This design document outlines the integration of the Dashboard page with the backend MongoDB API. The system will transition from using mock localStorage data to fetching real farmer data via Express API endpoints, while maintaining offline functionality as a fallback. The design implements an AuthContext for global authentication state management, seamless online/offline transitions, and type-safe API calls using shared TypeScript interfaces.

The integration builds on the existing mongodb-integration spec, which provides the backend infrastructure (repositories, services, and API routes). This spec focuses on the frontend integration layer, connecting React components to the backend while preserving the offline-first user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │    Login     │  │   Profile    │      │
│  │    Page      │  │    Page      │  │    Page      │ ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AuthContext (Global State)                 │
│  - farmerId                                                  │
│  - isAuthenticated                                           │
│  - login() / logout()                                        │
│  - isOnline                                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   API Service Layer      │  │  Offline Storage Layer   │
│  - fetchDashboardData()  │  │  - localStorage cache    │
│  - fetchCropBatches()    │  │  - offlineStorage utils  │
│  - fetchHealthScans()    │  │  - sync queue            │
│  - Type-safe calls       │  │                          │
└──────────────────────────┘  └──────────────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Express API Backend    │  │   Browser localStorage   │
│  /api/dashboard/farmer   │  │  harvestguard_*          │
│  /api/crop-batches       │  │                          │
│  /api/health-scans       │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

### Data Flow

**Online Mode (Happy Path)**:
1. User logs in → farmerId stored in localStorage + AuthContext
2. Dashboard loads → checks AuthContext for farmerId
3. Fetch dashboard data from `/api/dashboard/farmer/:farmerId`
4. Fetch crop batches from `/api/crop-batches?farmerId=xxx`
5. Fetch health scans from `/api/health-scans?farmerId=xxx&limit=10`
6. Cache all fetched data in localStorage
7. Display data in UI

**Offline Mode (Fallback)**:
1. Dashboard loads → detects offline status
2. Retrieve cached data from localStorage
3. Display cached data with offline indicator
4. Queue any user actions for later sync

**Online Transition**:
1. Detect online status change
2. Sync queued actions to backend
3. Refresh all data from API
4. Update cache and UI

## Components and Interfaces

### 1. AuthContext

**Location**: `client/context/AuthContext.tsx`

**Responsibilities**:
- Manage global authentication state
- Provide farmerId to all components
- Handle login/logout operations
- Persist authentication across sessions
- Track online/offline status

**Interface**:
```typescript
interface AuthContextType {
  farmerId: string | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (farmerId: string, farmerData: FarmerData) => void;
  logout: () => void;
  refreshAuth: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useAuth(): AuthContextType
```

**Implementation Details**:
- Initialize from localStorage on mount
- Use `useOnlineStatus` hook for connectivity tracking
- Store farmerId in localStorage key: `harvestguard_farmer_id`
- Clear all cached data on logout
- Provide context to entire app via `<AuthProvider>` in `App.tsx`

### 2. API Service Layer

**Location**: `client/services/api.ts`

**Responsibilities**:
- Encapsulate all API calls
- Handle request/response transformation
- Implement error handling
- Provide type-safe interfaces
- Handle authentication headers

**Interface**:
```typescript
export const apiService = {
  // Dashboard
  fetchDashboardData(farmerId: string): Promise<FarmerDashboardResponse>;
  
  // Crop Batches
  fetchCropBatches(farmerId: string): Promise<CropBatchResponse[]>;
  createCropBatch(data: CreateCropBatchRequest): Promise<CropBatchResponse>;
  updateCropBatch(id: string, data: UpdateCropBatchRequest): Promise<CropBatchResponse>;
  deleteCropBatch(id: string): Promise<void>;
  
  // Health Scans
  fetchHealthScans(farmerId: string, limit?: number): Promise<HealthScanResponse[]>;
  createHealthScan(data: CreateHealthScanRequest): Promise<HealthScanResponse>;
  updateHealthScanOutcome(id: string, data: UpdateHealthScanOutcomeRequest): Promise<HealthScanResponse>;
  
  // Weather
  fetchWeather(farmerId: string): Promise<WeatherResponse>;
  fetchForecast(farmerId: string): Promise<ForecastResponse>;
  
  // Advisories
  fetchAdvisories(farmerId: string): Promise<AdvisoryResponse[]>;
  markAdvisoryRead(id: string, farmerId: string): Promise<void>;
};
```

**Error Handling**:
```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public type: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new ApiError(
      response.status,
      errorData.error.type,
      errorData.error.message,
      errorData.error.details
    );
  }
  return response.json();
}
```

### 3. Offline Storage Service

**Location**: `client/services/offlineStorage.ts` (enhanced version)

**Responsibilities**:
- Cache API responses in localStorage
- Provide fallback data when offline
- Queue pending actions for sync
- Merge online/offline data
- Handle cache expiration

**Interface**:
```typescript
export const offlineStorageService = {
  // Cache management
  cacheDashboardData(farmerId: string, data: FarmerDashboardResponse): void;
  getCachedDashboardData(farmerId: string): FarmerDashboardResponse | null;
  
  cacheCropBatches(farmerId: string, batches: CropBatchResponse[]): void;
  getCachedCropBatches(farmerId: string): CropBatchResponse[] | null;
  
  cacheHealthScans(farmerId: string, scans: HealthScanResponse[]): void;
  getCachedHealthScans(farmerId: string): HealthScanResponse[] | null;
  
  // Sync queue
  queueAction(action: PendingAction): void;
  getPendingActions(): PendingAction[];
  clearPendingActions(): void;
  
  // Cache invalidation
  invalidateCache(farmerId: string): void;
  clearAllCache(): void;
  
  // Expiration
  isCacheExpired(key: string, maxAgeMs: number): boolean;
};

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'crop-batch' | 'health-scan' | 'advisory';
  data: any;
  timestamp: string;
}
```

**Cache Keys**:
- `harvestguard_dashboard_${farmerId}`: Dashboard metrics
- `harvestguard_crops_${farmerId}`: Crop batches
- `harvestguard_scans_${farmerId}`: Health scans
- `harvestguard_weather_${farmerId}`: Weather data
- `harvestguard_sync_queue`: Pending actions

**Cache Expiration**:
- Dashboard data: 5 minutes
- Crop batches: 10 minutes
- Health scans: 10 minutes
- Weather data: 30 minutes

### 4. Dashboard Page Integration

**Location**: `client/pages/Dashboard.tsx` (enhanced)

**Responsibilities**:
- Fetch and display farmer data
- Handle loading states
- Show offline indicators
- Trigger data refresh
- Navigate to login if unauthenticated

**Data Fetching Strategy**:
```typescript
useEffect(() => {
  const loadDashboardData = async () => {
    if (!farmerId) {
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isOnline) {
        // Fetch from API
        const [dashboard, crops, scans] = await Promise.all([
          apiService.fetchDashboardData(farmerId),
          apiService.fetchCropBatches(farmerId),
          apiService.fetchHealthScans(farmerId, 10)
        ]);
        
        // Update state
        setDashboardData(dashboard);
        setCropBatches(crops);
        setHealthScans(scans);
        
        // Cache for offline use
        offlineStorageService.cacheDashboardData(farmerId, dashboard);
        offlineStorageService.cacheCropBatches(farmerId, crops);
        offlineStorageService.cacheHealthScans(farmerId, scans);
      } else {
        // Load from cache
        const cachedDashboard = offlineStorageService.getCachedDashboardData(farmerId);
        const cachedCrops = offlineStorageService.getCachedCropBatches(farmerId);
        const cachedScans = offlineStorageService.getCachedHealthScans(farmerId);
        
        if (cachedDashboard) setDashboardData(cachedDashboard);
        if (cachedCrops) setCropBatches(cachedCrops);
        if (cachedScans) setHealthScans(cachedScans);
        
        setShowOfflineIndicator(true);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadDashboardData();
}, [farmerId, isOnline]);
```

### 5. Login Page Integration

**Location**: `client/pages/Login.tsx` (enhanced)

**Responsibilities**:
- Authenticate farmer via API
- Store farmerId in AuthContext
- Cache farmer profile
- Redirect to dashboard on success

**Login Flow**:
```typescript
const handleVerifyOTP = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(mobileNumber);
    
    // Call backend login API
    const response = await fetch('/api/farmers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        password: otp
      })
    });
    
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }
    
    const data: LoginFarmerResponse = await response.json();
    
    // Update AuthContext
    login(data.farmer._id, {
      id: data.farmer._id,
      name: data.farmer.name,
      phone: data.farmer.phone,
      division: data.farmer.division,
      district: data.farmer.district,
      upazila: data.farmer.upazila,
      registeredDate: data.farmer.registeredAt
    });
    
    toast({ title: t("welcome") });
    navigate("/dashboard");
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

### 6. Sync Service

**Location**: `client/services/syncService.ts`

**Responsibilities**:
- Sync pending offline actions when online
- Resolve conflicts (last-write-wins)
- Retry failed syncs
- Log sync operations

**Interface**:
```typescript
export const syncService = {
  syncPendingActions(): Promise<SyncResult>;
  syncCropBatches(farmerId: string): Promise<void>;
  syncHealthScans(farmerId: string): Promise<void>;
  resolveConflict(local: any, remote: any): any;
};

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ action: PendingAction; error: string }>;
}
```

**Sync Strategy**:
1. Get all pending actions from queue
2. Sort by timestamp (oldest first)
3. Execute each action via API
4. Remove successful actions from queue
5. Retry failed actions (max 3 attempts)
6. Log all sync operations

## Data Models

### Frontend Data Models

**Dashboard State**:
```typescript
interface DashboardState {
  farmerId: string;
  dashboardData: FarmerDashboardResponse | null;
  cropBatches: CropBatchResponse[];
  healthScans: HealthScanResponse[];
  weather: WeatherData | null;
  advisories: AdvisoryResponse[];
  isLoading: boolean;
  isOffline: boolean;
  lastSyncTime: string | null;
  error: string | null;
}
```

**Cached Data Structure**:
```typescript
interface CachedData<T> {
  data: T;
  timestamp: string;
  expiresAt: string;
}
```

**Sync Queue Item**:
```typescript
interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'crop-batch' | 'health-scan' | 'advisory';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}
```

### Data Transformation

**Backend to Frontend**:
```typescript
// Transform CropBatchResponse to legacy CropBatch format
function transformCropBatch(apiResponse: CropBatchResponse): CropBatch {
  return {
    id: apiResponse._id,
    cropType: apiResponse.cropType,
    batchNumber: apiResponse.batchNumber,
    enteredDate: apiResponse.enteredDate,
    stage: apiResponse.stage,
    estimatedWeight: apiResponse.estimatedWeightKg,
    expectedHarvestDate: apiResponse.expectedHarvestDate,
    finalWeight: apiResponse.finalWeightKg,
    actualHarvestDate: apiResponse.actualHarvestDate,
    storageLocation: apiResponse.storageLocation,
    storageDivision: apiResponse.storageDivision,
    storageDistrict: apiResponse.storageDistrict
  };
}

// Transform HealthScanResponse to legacy ScanRecord format
function transformHealthScan(apiResponse: HealthScanResponse): ScanRecord {
  return {
    id: apiResponse._id,
    date: apiResponse.capturedAt,
    disease: apiResponse.diseaseLabel,
    confidence: apiResponse.confidence,
    remedy: apiResponse.remedyText,
    immediateFeedback: apiResponse.immediateFeedback,
    outcome: apiResponse.outcome
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication persistence across sessions

*For any* successful login with a farmerId, storing it in localStorage and then reloading the application should restore the authenticated state with the same farmerId.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Dashboard API endpoint correctness

*For any* farmerId, when the dashboard loads in online mode, the system should call GET /api/dashboard/farmer/:farmerId and GET /api/crop-batches?farmerId=xxx with the correct farmerId parameter.

**Validates: Requirements 2.1, 2.3**

### Property 3: Dashboard data display completeness

*For any* dashboard data fetched from the API, the UI should display all required fields including total crops, total weight, earned badges, and all crop batches.

**Validates: Requirements 2.2, 2.4**

### Property 4: API error handling graceful degradation

*For any* API error during dashboard load, the system should display an error message to the user and fall back to cached data if available.

**Validates: Requirements 2.5, 4.3**

### Property 5: API data caching round-trip

*For any* successful API fetch, caching the data in localStorage and then retrieving it should return data equivalent to the original API response.

**Validates: Requirements 3.1**

### Property 6: Offline fallback completeness

*For any* cached data in localStorage, loading the dashboard in offline mode should display that cached data without errors and show an offline indicator.

**Validates: Requirements 3.2, 3.3**

### Property 7: Online transition data refresh

*For any* dashboard in offline mode, transitioning to online mode should automatically trigger a data refresh from the API and update the UI with fresh data.

**Validates: Requirements 3.4, 3.5**

### Property 8: Loading state consistency

*For any* data fetch operation, the loading indicator should be visible when the fetch begins and hidden when the fetch completes (success or failure).

**Validates: Requirements 4.1, 4.2**

### Property 9: Request deduplication

*For any* data resource, triggering multiple simultaneous fetch requests should result in only one actual API call being made.

**Validates: Requirements 4.4**

### Property 10: Logout data cleanup

*For any* authenticated session, logging out should remove the farmerId and authentication token from localStorage, clear all cached dashboard data, and redirect to the login page.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 11: AuthContext initialization

*For any* farmerId stored in localStorage, mounting the AuthContext provider should initialize the authentication state with that farmerId.

**Validates: Requirements 6.3**

### Property 12: AuthContext propagation

*For any* component consuming AuthContext, changes to authentication state should trigger re-renders with updated values.

**Validates: Requirements 6.4**

### Property 13: Offline data merging

*For any* pending offline changes and newly fetched online data, merging should preserve offline changes and incorporate online updates without data loss.

**Validates: Requirements 7.1**

### Property 14: Offline sync execution

*For any* set of pending offline actions, transitioning to online mode should sync all actions to the server in chronological order (oldest first).

**Validates: Requirements 7.2**

### Property 15: Conflict resolution determinism

*For any* conflict between offline and online data with different timestamps, the last-write-wins strategy should consistently choose the data with the most recent timestamp.

**Validates: Requirements 7.3**

### Property 16: Sync UI update

*For any* completed sync operation, the UI should update to reflect the latest data from the server.

**Validates: Requirements 7.4**

### Property 17: Sync operation logging

*For any* sync operation (successful or failed), the system should create a log entry with timestamp, action type, and result.

**Validates: Requirements 7.5**

### Property 18: API response type validation

*For any* API response, if the response data doesn't match the expected TypeScript type, the system should log a warning with details about the type mismatch.

**Validates: Requirements 8.2, 8.3**

### Property 19: Weather location parameter correctness

*For any* farmer with stored location data (division, district, upazila), fetching weather should call the weather API with those exact location parameters.

**Validates: Requirements 9.1, 9.2**

### Property 20: Weather data caching with expiration

*For any* fetched weather data, caching it with a 30-minute expiration and then checking before that time should return cached data; checking after expiration should trigger a fresh fetch.

**Validates: Requirements 9.4**

### Property 21: Weather advisory relevance

*For any* set of weather advisories and farmer's crops, only advisories relevant to those crop types should be displayed.

**Validates: Requirements 9.5**

### Property 22: Health scan API endpoint correctness

*For any* farmerId, loading the dashboard should call GET /api/health-scans?farmerId=xxx&limit=10 with the correct parameters.

**Validates: Requirements 10.1**

### Property 23: Health scan display completeness

*For any* health scan fetched from the API, the UI should display the disease label, confidence score, timestamp, and associated crop batch (if present).

**Validates: Requirements 10.2, 10.3**

### Property 24: Health scan display limit

*For any* set of health scans returned from the API, the dashboard should display at most 10 scans, ordered by most recent first.

**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials
   - Expired session
   - Missing farmerId
   - **Handling**: Redirect to login page, clear auth state, show error message

2. **Network Errors**
   - API unreachable
   - Timeout
   - Connection refused
   - **Handling**: Fall back to cached data, show offline indicator, queue actions for sync

3. **API Errors**
   - 400 Bad Request (validation errors)
   - 404 Not Found (farmer/resource not found)
   - 409 Conflict (data conflict)
   - 500 Internal Server Error
   - **Handling**: Display user-friendly error message, log error details, fall back to cache if available

4. **Cache Errors**
   - localStorage quota exceeded
   - Corrupted cache data
   - Missing cache keys
   - **Handling**: Clear corrupted cache, fetch fresh data, log error

5. **Sync Errors**
   - Conflict during sync
   - Partial sync failure
   - Retry limit exceeded
   - **Handling**: Log failed actions, notify user, keep in queue for manual retry

### Error Display Strategy

**Toast Notifications**:
- Use for transient errors (network issues, temporary failures)
- Auto-dismiss after 5 seconds
- Include retry action when applicable

**Inline Error Messages**:
- Use for persistent errors (authentication failures, validation errors)
- Display near affected component
- Provide clear action steps

**Offline Indicator**:
- Persistent banner at top of dashboard
- Shows "Viewing offline data" message
- Includes "Retry" button to attempt reconnection

### Error Logging

**Client-Side Logging**:
```typescript
interface ErrorLog {
  timestamp: string;
  type: 'auth' | 'network' | 'api' | 'cache' | 'sync';
  message: string;
  details: Record<string, any>;
  farmerId?: string;
  stackTrace?: string;
}

function logError(error: Error, context: Partial<ErrorLog>): void {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type: context.type || 'api',
    message: error.message,
    details: context.details || {},
    farmerId: context.farmerId,
    stackTrace: error.stack
  };
  
  console.error('[Dashboard Error]', errorLog);
  
  // Store in localStorage for debugging
  const logs = JSON.parse(localStorage.getItem('harvestguard_error_logs') || '[]');
  logs.push(errorLog);
  localStorage.setItem('harvestguard_error_logs', JSON.stringify(logs.slice(-50))); // Keep last 50
}
```

## Testing Strategy

### Dual Testing Approach

This project will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Library**: `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must be tagged with a comment explicitly referencing the correctness property in this design document using this format:

```typescript
// **Feature: dashboard-integration, Property 1: Authentication persistence across sessions**
```

**Property Test Coverage**:

1. **Property 1 - Authentication persistence**: Generate random farmerIds, store in localStorage, reload app, verify same farmerId restored
2. **Property 2 - Dashboard API endpoint correctness**: Generate random farmerIds, load dashboard, verify correct API endpoints called
3. **Property 3 - Dashboard data display**: Generate random dashboard data, verify all required fields displayed
4. **Property 4 - API error handling**: Generate random API errors, verify error messages and fallback to cache
5. **Property 5 - API data caching round-trip**: Generate random API responses, cache them, retrieve, verify equivalence
6. **Property 6 - Offline fallback**: Generate random cached data, load dashboard offline, verify data displays with offline indicator
7. **Property 7 - Online transition**: Generate random offline states, transition to online, verify data refresh triggered
8. **Property 8 - Loading states**: Generate random fetch operations, verify loading indicator shown/hidden correctly
9. **Property 9 - Request deduplication**: Trigger multiple simultaneous fetches, verify only one API call made
10. **Property 10 - Logout cleanup**: Generate random authenticated states, logout, verify all data cleared and redirect
11. **Property 11 - AuthContext initialization**: Generate random farmerIds in localStorage, mount provider, verify state initialized
12. **Property 12 - AuthContext propagation**: Generate random auth state changes, verify all consumers re-render
13. **Property 13 - Offline data merging**: Generate random offline changes and online data, merge, verify no data loss
14. **Property 14 - Offline sync execution**: Generate random pending actions, go online, verify chronological sync
15. **Property 15 - Conflict resolution**: Generate random conflicting data with timestamps, resolve, verify last-write-wins
16. **Property 16 - Sync UI update**: Complete sync operation, verify UI reflects latest data
17. **Property 17 - Sync logging**: Perform sync operations, verify log entries created
18. **Property 18 - API response type validation**: Generate invalid API responses, verify type warnings logged
19. **Property 19 - Weather location parameters**: Generate random farmer locations, fetch weather, verify correct params
20. **Property 20 - Weather caching with expiration**: Fetch weather, verify caching and expiration logic
21. **Property 21 - Weather advisory relevance**: Generate random advisories and crops, verify only relevant advisories shown
22. **Property 22 - Health scan API endpoint**: Generate random farmerIds, load dashboard, verify health scan endpoint called
23. **Property 23 - Health scan display**: Generate random health scans, verify all fields displayed
24. **Property 24 - Health scan limit**: Generate many health scans, verify only 10 most recent displayed

### Unit Testing

**Library**: Vitest (already in project dependencies)

**Unit Test Coverage**:

1. **AuthContext**:
   - Login sets farmerId correctly
   - Logout clears farmerId
   - Initial state loads from localStorage
   - Online status tracking works

2. **API Service**:
   - fetchDashboardData returns correct type
   - fetchCropBatches handles empty results
   - Error responses throw ApiError
   - Request headers include correct content-type

3. **Offline Storage Service**:
   - cacheDashboardData stores data correctly
   - getCachedDashboardData retrieves data correctly
   - queueAction adds to sync queue
   - isCacheExpired calculates correctly

4. **Dashboard Page**:
   - Redirects to login when not authenticated
   - Shows loading indicator during fetch
   - Displays offline indicator when offline
   - Renders crop batches correctly

5. **Login Page**:
   - Formats phone number correctly
   - Calls login API with correct payload
   - Stores farmerId on success
   - Shows error on failure

6. **Sync Service**:
   - syncPendingActions processes queue in order
   - Failed actions remain in queue
   - Successful actions removed from queue
   - Conflict resolution uses last-write-wins

### Integration Testing

Integration tests will verify:

1. **End-to-end authentication flow**:
   - Login → Dashboard → Logout → Login again

2. **Online/offline transitions**:
   - Load dashboard online → go offline → verify cache → go online → verify refresh

3. **Data synchronization**:
   - Create crop batch offline → go online → verify sync to backend

4. **Error recovery**:
   - API fails → fall back to cache → API recovers → refresh data

### Test Execution

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run only property-based tests
pnpm test --grep "Property"

# Run only unit tests
pnpm test --grep -v "Property"

# Run integration tests
pnpm test:integration
```

### Manual Testing Checklist

- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails gracefully
- [ ] Dashboard loads data on first visit
- [ ] Dashboard shows cached data when offline
- [ ] Dashboard refreshes data when going online
- [ ] Logout clears all data and redirects
- [ ] Creating crop batch works online
- [ ] Creating crop batch queues for sync when offline
- [ ] Sync executes when returning online
- [ ] Error messages display correctly
- [ ] Loading indicators show during operations
- [ ] Offline indicator appears when offline
- [ ] Weather data fetches for farmer location
- [ ] Health scans display correctly
- [ ] Type errors logged for invalid API responses

