# Design Document

## Overview

This design document outlines the MongoDB Atlas integration for the agricultural management application. The system will use the official MongoDB Node.js driver to connect to MongoDB Atlas, implement schema validation using Zod (already in the project), and provide a repository pattern for data access. The design supports both farmer-facing features (crop tracking, health scans) and administrative dashboards (analytics, aggregations).

The integration will be built incrementally, starting with connection management, then implementing core collections (farmers, crop_batches), followed by related collections (health_scans, loss_events, interventions, advisories), and finally optional features (weather_snapshots, sessions).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express API Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Farmers    │  │  Crop Batch  │  │    Health    │      │
│  │   Routes     │  │   Routes     │  │    Routes    │ ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (Business Logic)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Farmers    │  │  Crop Batch  │  │    Health    │      │
│  │   Service    │  │   Service    │  │    Service   │ ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Layer (Data Access)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Farmers    │  │  Crop Batch  │  │    Health    │      │
│  │  Repository  │  │  Repository  │  │  Repository  │ ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Connection                        │
│              (Connection Pool + Error Handling)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   MongoDB Atlas Cloud
```

### Technology Stack

- **Database**: MongoDB Atlas (cloud-hosted)
- **Driver**: mongodb npm package (official Node.js driver)
- **Validation**: Zod (already in project dependencies)
- **Connection**: Connection pooling with automatic reconnection
- **Environment**: dotenv for configuration


## Components and Interfaces

### 1. Database Connection Module

**Location**: `server/db/connection.ts`

**Responsibilities**:
- Establish connection to MongoDB Atlas
- Manage connection pool
- Provide database instance to repositories
- Handle connection errors and retries

**Interface**:
```typescript
export async function connectToDatabase(): Promise<Db>
export function getDatabase(): Db
export async function closeDatabase(): Promise<void>
```

**Configuration** (via environment variables):
- `MONGODB_URI`: Full connection string including credentials
- `MONGODB_DB_NAME`: Database name

### 2. Schema Definitions

**Location**: `server/db/schemas/`

**Responsibilities**:
- Define Zod schemas for validation
- Export TypeScript types
- Provide validation functions

**Collections**:

#### Farmers Schema
```typescript
const FarmerSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  phone: z.string().regex(/^\+880\d{10}$/), // Bangladesh phone format
  passwordHash: z.string(),
  name: z.string().min(1),
  division: z.string(),
  district: z.string(),
  upazila: z.string(),
  language: z.enum(['bn', 'en']).default('bn'),
  roles: z.array(z.enum(['farmer', 'admin'])).default(['farmer']),
  registeredAt: z.date().default(() => new Date()),
  // Optional dashboard caches
  totalCrops: z.number().optional(),
  totalWeight: z.number().optional(),
  badges: z.array(z.string()).optional()
});
```

#### Crop Batches Schema
```typescript
const CropBatchSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId),
  cropType: z.string(),
  stage: z.enum(['growing', 'harvested']),
  // Growing stage fields
  estimatedWeightKg: z.number().positive().optional(),
  expectedHarvestDate: z.date().optional(),
  // Harvested stage fields
  finalWeightKg: z.number().positive().optional(),
  actualHarvestDate: z.date().optional(),
  storageLocation: z.enum(['silo', 'jute_bag', 'open_space', 'tin_shed']).optional(),
  storageDivision: z.string().optional(),
  storageDistrict: z.string().optional(),
  enteredDate: z.date().default(() => new Date()),
  lossPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional()
});
```


#### Health Scans Schema
```typescript
const HealthScanSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId),
  batchId: z.instanceof(ObjectId).optional(),
  capturedAt: z.date().default(() => new Date()),
  diseaseLabel: z.string(),
  confidence: z.number().min(0).max(100),
  remedyText: z.string().optional(),
  immediateFeedback: z.enum(['correct', 'incorrect', 'unsure']).optional(),
  outcome: z.enum(['recovered', 'same', 'worse']).optional(),
  status: z.enum(['pending', 'resolved', 'healthy']).default('pending'),
  imageUrl: z.string().url().optional()
});
```

#### Loss Events Schema
```typescript
const LossEventSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId),
  batchId: z.instanceof(ObjectId),
  eventType: z.string(),
  lossPercentage: z.number().min(0).max(100),
  lossWeightKg: z.number().positive(),
  reportedAt: z.date().default(() => new Date()),
  location: z.string()
});
```

#### Interventions Schema
```typescript
const InterventionSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId),
  batchId: z.instanceof(ObjectId),
  interventionType: z.string(),
  success: z.boolean(),
  notes: z.string().optional(),
  performedAt: z.date().default(() => new Date())
});
```

#### Advisories Schema
```typescript
const AdvisorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId).optional(), // null for broadcast
  source: z.enum(['weather', 'scanner', 'manual']),
  payload: z.object({
    message: z.string(),
    actions: z.array(z.string()).optional()
  }),
  status: z.enum(['delivered', 'read']).default('delivered'),
  createdAt: z.date().default(() => new Date())
});
```

#### Sessions Schema
```typescript
const SessionSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  farmerId: z.instanceof(ObjectId),
  authType: z.enum(['otp', 'password']),
  expiresAt: z.date(),
  deviceMeta: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional()
  }).optional(),
  createdAt: z.date().default(() => new Date())
});
```

#### Weather Snapshots Schema (Optional)
```typescript
const WeatherSnapshotSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  division: z.string(),
  district: z.string(),
  upazila: z.string(),
  payload: z.record(z.any()), // Flexible structure for API response
  capturedAt: z.date().default(() => new Date())
});
```


### 3. Repository Pattern

**Location**: `server/db/repositories/`

**Responsibilities**:
- Encapsulate database operations
- Provide type-safe CRUD operations
- Handle validation
- Manage indexes

**Base Repository Interface**:
```typescript
interface BaseRepository<T> {
  create(data: Omit<T, '_id'>): Promise<T>;
  findById(id: ObjectId): Promise<T | null>;
  findMany(filter: Filter<T>, options?: FindOptions): Promise<T[]>;
  updateById(id: ObjectId, update: Partial<T>): Promise<T | null>;
  deleteById(id: ObjectId): Promise<boolean>;
  count(filter: Filter<T>): Promise<number>;
}
```

**Specific Repositories**:
- `FarmersRepository`: Includes `findByPhone()`, `updateDashboardCache()`
- `CropBatchesRepository`: Includes `findByFarmerId()`, `findByLocation()`, `updateStage()`
- `HealthScansRepository`: Includes `findByFarmerId()`, `findByBatchId()`, `updateStatus()`
- `LossEventsRepository`: Includes `findByFarmerId()`, `findByBatchId()`, `aggregateLossByLocation()`
- `InterventionsRepository`: Includes `findByFarmerId()`, `calculateSuccessRate()`
- `AdvisoriesRepository`: Includes `findByFarmerId()`, `findUnread()`, `markAsRead()`
- `SessionsRepository`: Includes `findByFarmerId()`, `deleteExpired()`, `validateSession()`
- `WeatherSnapshotsRepository`: Includes `findByLocation()`, `findRecent()`

### 4. Service Layer

**Location**: `server/services/`

**Responsibilities**:
- Implement business logic
- Coordinate between repositories
- Handle complex operations
- Validate business rules

**Services**:
- `FarmerService`: Registration, authentication, profile management
- `CropBatchService`: Batch creation, stage transitions, loss tracking
- `HealthScanService`: Scan recording, status updates, outcome tracking
- `DashboardService`: Aggregations for farmer and admin dashboards
- `AdvisoryService`: Advisory creation, delivery, read tracking

### 5. API Routes

**Location**: `server/routes/`

**Responsibilities**:
- Handle HTTP requests
- Validate request data
- Call service layer
- Format responses
- Handle errors

**Route Groups**:
- `/api/farmers`: Registration, login, profile
- `/api/crop-batches`: CRUD operations, filtering
- `/api/health-scans`: Scan recording, history
- `/api/loss-events`: Loss reporting, analytics
- `/api/interventions`: Intervention recording, success tracking
- `/api/advisories`: Advisory delivery, read status
- `/api/dashboard/farmer`: Farmer-specific metrics
- `/api/dashboard/admin`: System-wide analytics


## Data Models

### Collection Relationships

```
farmers (1) ──────< (N) crop_batches
   │                      │
   │                      │
   │                      ├──< (N) health_scans
   │                      │
   │                      ├──< (N) loss_events
   │                      │
   │                      └──< (N) interventions
   │
   ├──< (N) health_scans (direct)
   │
   ├──< (N) sessions
   │
   └──< (N) advisories (or null for broadcast)

weather_snapshots (independent, location-based)
```

### Indexes

**farmers**:
- `{ phone: 1 }` - unique index for authentication
- `{ division: 1, district: 1, upazila: 1 }` - location queries

**crop_batches**:
- `{ farmerId: 1, stage: 1 }` - farmer's active/harvested crops
- `{ storageDivision: 1, storageDistrict: 1 }` - location-based analytics
- `{ farmerId: 1, enteredDate: -1 }` - recent batches

**health_scans**:
- `{ farmerId: 1, capturedAt: -1 }` - farmer's scan history
- `{ batchId: 1 }` - batch-specific scans
- `{ status: 1, capturedAt: -1 }` - pending scans

**loss_events**:
- `{ farmerId: 1, reportedAt: -1 }` - farmer's loss history
- `{ batchId: 1 }` - batch-specific losses

**interventions**:
- `{ farmerId: 1, performedAt: -1 }` - farmer's interventions
- `{ batchId: 1 }` - batch-specific interventions
- `{ success: 1 }` - success rate calculations

**advisories**:
- `{ farmerId: 1, status: 1, createdAt: -1 }` - unread advisories
- `{ source: 1, createdAt: -1 }` - source-based filtering

**sessions**:
- `{ farmerId: 1, expiresAt: 1 }` - active sessions
- `{ expiresAt: 1 }` - TTL index for automatic cleanup

**weather_snapshots**:
- `{ division: 1, district: 1, upazila: 1, capturedAt: -1 }` - location-based queries
- `{ capturedAt: 1 }` - TTL index for data retention (optional)

### Data Migration Strategy

Since the frontend currently uses localStorage with mock data, the migration strategy is:

1. **Phase 1**: Implement database with API endpoints
2. **Phase 2**: Update frontend to call APIs instead of localStorage
3. **Phase 3**: Provide data export/import utilities for existing users
4. **Phase 4**: Deprecate localStorage usage

The existing `offlineStorage.ts` interfaces align well with the MongoDB schemas, requiring minimal frontend changes.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema validation rejects invalid documents

*For any* collection and any document that violates the schema (missing required fields, wrong types, invalid enum values, out-of-range numbers), attempting to insert or update should fail with a descriptive validation error.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Document creation round-trip preserves data

*For any* valid document in any collection, creating the document and then retrieving it by ID should return a document with equivalent field values.

**Validates: Requirements 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 11.1**

### Property 3: Phone number uniqueness constraint

*For any* two farmer registration attempts with the same phone number, the second registration should fail with a unique constraint violation error.

**Validates: Requirements 3.2**

### Property 4: Password hashing prevents plaintext storage

*For any* farmer registration with a plaintext password, the stored passwordHash field should not equal the plaintext password.

**Validates: Requirements 3.3**

### Property 5: Referential integrity for foreign keys

*For any* document with a farmerId or batchId field, the referenced document must exist in the corresponding collection, or the operation should fail with a referential integrity error.

**Validates: Requirements 4.2, 5.2, 5.3, 6.2, 7.2, 9.2**

### Property 6: Stage-specific field requirements

*For any* crop batch in "growing" stage, the estimatedWeightKg and expectedHarvestDate fields should be present; for any crop batch in "harvested" stage, the finalWeightKg and actualHarvestDate fields should be present.

**Validates: Requirements 4.3, 4.4**

### Property 7: Automatic timestamp generation

*For any* document creation in collections with timestamp fields (registeredAt, capturedAt, reportedAt, performedAt, createdAt), the timestamp should be automatically set to a value close to the current time (within a reasonable delta).

**Validates: Requirements 3.5, 6.5, 7.5, 11.3**

### Property 8: Optional farmerId for broadcast advisories

*For any* advisory with farmerId set to null, it should be stored and retrievable as a broadcast advisory; for any advisory with a specific farmerId, it should be retrievable only for that farmer.

**Validates: Requirements 8.2**

### Property 9: Session expiration validation

*For any* session with expiresAt in the past, session validation should fail and prevent access.

**Validates: Requirements 9.5**

### Property 10: Aggregation correctness across collections

*For any* set of crop batches, loss events, and interventions belonging to a farmer, aggregating total weight, total loss, and success rate should produce mathematically correct results that match manual calculation.

**Validates: Requirements 10.3, 10.5**

### Property 11: Join operations return related documents

*For any* farmer with associated crop batches, health scans, or other related documents, joining via farmerId or batchId should return all and only the related documents.

**Validates: Requirements 10.4**

### Property 12: Location-based queries return matching documents

*For any* location query (division, district, upazila), the results should include all and only documents with matching location fields.

**Validates: Requirements 11.5**

### Property 13: Structured error responses

*For any* database operation failure, the error response should have a consistent structure including error type, message, and relevant details.

**Validates: Requirements 12.1**

### Property 14: Unique constraint violation errors identify field

*For any* unique constraint violation (e.g., duplicate phone number), the error response should specifically identify which field caused the violation.

**Validates: Requirements 12.2**

### Property 15: Validation errors include all failures

*For any* document that fails validation on multiple fields, the error response should include all validation failures, not just the first one.

**Validates: Requirements 12.4**


## Error Handling

### Error Categories

1. **Connection Errors**
   - MongoDB Atlas unreachable
   - Authentication failures
   - Network timeouts
   - **Handling**: Retry with exponential backoff, log errors, prevent server startup if initial connection fails

2. **Validation Errors**
   - Schema validation failures
   - Type mismatches
   - Required field missing
   - **Handling**: Return 400 Bad Request with detailed validation errors

3. **Constraint Violations**
   - Unique constraint violations (duplicate phone)
   - Referential integrity violations (invalid farmerId)
   - **Handling**: Return 409 Conflict with specific field information

4. **Not Found Errors**
   - Document not found by ID
   - No results for query
   - **Handling**: Return 404 Not Found with descriptive message

5. **Database Operation Errors**
   - Write failures
   - Transaction failures
   - Index errors
   - **Handling**: Return 500 Internal Server Error, log full error details

### Error Response Format

All API errors will follow this structure:

```typescript
interface ErrorResponse {
  error: {
    type: 'ValidationError' | 'NotFoundError' | 'ConflictError' | 'DatabaseError' | 'AuthenticationError';
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  }
}
```

### Error Handling Utilities

**Location**: `server/utils/errors.ts`

```typescript
class AppError extends Error {
  constructor(
    public type: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

function handleDatabaseError(error: any): AppError
function formatErrorResponse(error: AppError): ErrorResponse
```

### Logging Strategy

- **Connection events**: Log all connection attempts, successes, and failures
- **Validation errors**: Log validation failures with sanitized data (no passwords)
- **Database errors**: Log full error stack for debugging
- **Performance**: Log slow queries (>100ms)


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
// **Feature: mongodb-integration, Property 1: Schema validation rejects invalid documents**
```

**Property Test Coverage**:

Each correctness property listed above must be implemented by a single property-based test:

1. **Property 1 - Schema validation**: Generate random invalid documents (missing fields, wrong types, invalid enums) and verify all are rejected
2. **Property 2 - Round-trip**: Generate random valid documents, insert them, retrieve by ID, and verify equivalence
3. **Property 3 - Phone uniqueness**: Generate random farmer data, register twice with same phone, verify second fails
4. **Property 4 - Password hashing**: Generate random passwords, register farmers, verify stored hash ≠ plaintext
5. **Property 5 - Referential integrity**: Generate random documents with invalid foreign keys, verify rejection
6. **Property 6 - Stage-specific fields**: Generate random crop batches in different stages, verify required fields present
7. **Property 7 - Automatic timestamps**: Generate random documents, verify timestamps are set and recent
8. **Property 8 - Broadcast advisories**: Generate random advisories with/without farmerId, verify retrieval behavior
9. **Property 9 - Session expiration**: Generate random sessions with past expiresAt, verify validation fails
10. **Property 10 - Aggregation correctness**: Generate random sets of related documents, verify aggregated metrics match manual calculation
11. **Property 11 - Join operations**: Generate random farmers with related documents, verify joins return correct sets
12. **Property 12 - Location queries**: Generate random documents with locations, verify queries return exact matches
13. **Property 13 - Structured errors**: Trigger random database errors, verify response structure consistency
14. **Property 14 - Unique constraint errors**: Trigger unique violations, verify field identification in error
15. **Property 15 - Validation error completeness**: Generate documents with multiple validation failures, verify all are returned

### Unit Testing

**Library**: Vitest (already in project dependencies)

**Unit Test Coverage**:

Unit tests will cover:

1. **Connection module**:
   - Successful connection with valid credentials
   - Connection failure with invalid credentials
   - Connection timeout handling

2. **Repository operations**:
   - CRUD operations for each repository
   - Index creation verification
   - Query filtering and sorting

3. **Service layer**:
   - Business logic for farmer registration
   - Crop batch stage transitions
   - Dashboard aggregation calculations
   - Advisory delivery logic

4. **API routes**:
   - Request validation
   - Response formatting
   - Error handling middleware
   - Authentication middleware (when implemented)

5. **Edge cases**:
   - Empty query results
   - Null/undefined handling
   - Boundary values (0, negative numbers, very large numbers)
   - Special characters in strings
   - Date edge cases (past dates, future dates, invalid dates)

### Test Database

**Strategy**: Use a separate MongoDB Atlas database or local MongoDB instance for testing

**Setup**:
- Create test database before test suite runs
- Seed with known test data
- Clean up after each test to ensure isolation
- Drop test database after test suite completes

**Environment**: Use `MONGODB_URI_TEST` environment variable for test database connection

### Integration Testing

While not property-based, integration tests will verify:

1. **End-to-end flows**:
   - Farmer registration → crop batch creation → health scan → advisory
   - Loss event → intervention → outcome tracking

2. **API integration**:
   - Full request/response cycles
   - Error handling across layers
   - Transaction behavior (if implemented)

3. **Weather API integration** (when implemented):
   - API call success
   - Data transformation
   - Optional caching behavior

### Test Execution

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run only property-based tests
pnpm test --grep "Property"

# Run only unit tests
pnpm test --grep -v "Property"
```

### Continuous Testing

- Tests must pass before merging code
- Property-based tests will catch edge cases that unit tests might miss
- Both test types are required for comprehensive correctness verification

