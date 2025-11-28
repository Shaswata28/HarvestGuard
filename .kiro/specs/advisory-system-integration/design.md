# Design Document

## Overview

The Advisory System Integration connects weather data, crop information, and farmer profiles to deliver intelligent, automated agricultural recommendations. The system leverages existing infrastructure (MongoDB repositories, weather services, and API routes) while adding automated advisory generation capabilities that proactively warn farmers about weather-related risks.

The system operates in two modes:
1. **Manual/On-Demand**: Advisories created explicitly via API calls (by admins or other services)
2. **Automated**: Weather-based advisories generated automatically when conditions warrant farmer notification

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Weather API    │
│ (OpenWeather)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           Weather Service Layer                      │
│  - getCurrentWeather()                              │
│  - getWeatherForFarmer()                            │
│  - generateAdvisories()                             │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│      Advisory Generation Service (NEW)              │
│  - generateWeatherAdvisories()                      │
│  - checkAndGenerateForFarmer()                      │
│  - checkAndGenerateForAllFarmers()                  │
│  - preventDuplicates()                              │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           Advisory Service Layer                     │
│  - createFarmerAdvisory()                           │
│  - getAdvisoriesForFarmer()                         │
│  - getAdvisoryById()                                │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│        Advisory Repository Layer                     │
│  - create()                                         │
│  - findByFarmerId()                                 │
│  - findById()                                       │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB Database                        │
│  - advisories collection                            │
│  - farmers collection                               │
│  - cropBatches collection                           │
└─────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Manual Advisory Creation:**
```
Client → API Route → Advisory Service → Repository → Database
```

**Automated Weather Advisory Generation:**
```
Scheduler/Trigger → Advisory Generation Service → Weather Service → Advisory Service → Repository → Database
```

**Advisory Retrieval:**
```
Client → API Route → Advisory Service → Repository → Database → Client
```

## Components and Interfaces

### 1. Advisory API Routes (Existing - Minor Updates)

**File**: `server/routes/advisories.ts`

**Endpoints**:
- `POST /api/advisories` - Create advisory (manual or automated)
- `GET /api/advisories?farmerId=xxx` - Get advisories for a farmer
- `GET /api/advisories/:id` - Get specific advisory
- ~~`PUT /api/advisories/:id/read`~~ - REMOVED (no longer needed)

**Updates Needed**:
- Remove the `/read` endpoint and related validation
- Update response types to exclude `status` field from responses

### 2. Advisory Service (Existing - Minor Updates)

**File**: `server/services/advisory.service.ts`

**Current Methods**:
- `createFarmerAdvisory(input)` - Creates farmer-specific advisory
- `createBroadcastAdvisory(input)` - Creates broadcast advisory
- `getAdvisoriesForFarmer(farmerId)` - Retrieves all advisories for farmer
- `getAdvisoryById(id)` - Retrieves specific advisory
- ~~`markAdvisoryAsRead(id, farmerId)`~~ - REMOVE
- ~~`getUnreadAdvisories(farmerId)`~~ - REMOVE

**Updates Needed**:
- Remove `markAdvisoryAsRead` method
- Remove `getUnreadAdvisories` method
- Remove `countUnreadAdvisories` method

### 3. Advisory Repository (Existing - Minor Updates)

**File**: `server/db/repositories/advisories.repository.ts`

**Current Methods**:
- `create(data)` - Creates new advisory
- `findByFarmerId(farmerId)` - Finds advisories for farmer
- `findById(id)` - Finds advisory by ID
- ~~`markAsRead(id)`~~ - REMOVE
- ~~`findUnread(farmerId)`~~ - REMOVE

**Updates Needed**:
- Remove `markAsRead` method
- Remove `findUnread` method
- Add `findRecentByFarmerAndType(farmerId, source, hours)` - For duplicate prevention

### 4. Weather Advisory Generation Service (NEW)

**File**: `server/services/weatherAdvisory.service.ts`

**Purpose**: Orchestrates automatic generation of weather-based advisories

**Interface**:
```typescript
class WeatherAdvisoryService {
  constructor(
    advisoryService: AdvisoryService,
    farmersRepository: FarmersRepository,
    cropBatchesRepository: CropBatchesRepository
  )

  // Generate advisories for a specific farmer
  async generateForFarmer(farmerId: ObjectId): Promise<Advisory[]>

  // Generate advisories for all farmers in a location
  async generateForLocation(division: string, district?: string): Promise<number>

  // Generate advisories for all active farmers
  async generateForAllFarmers(): Promise<number>

  // Check if advisory should be generated (duplicate prevention)
  private shouldGenerateAdvisory(
    farmerId: ObjectId,
    advisoryType: string,
    hoursWindow: number
  ): Promise<boolean>

  // Enrich advisory with crop-specific information
  private enrichAdvisoryWithCropInfo(
    advisory: Advisory,
    crops: CropBatch[]
  ): Advisory
}
```

**Key Responsibilities**:
- Fetch weather data for farmer locations
- Generate advisories using weather service
- Check for duplicates (don't create same advisory within 24 hours)
- Enrich advisories with crop-specific information
- Batch process multiple farmers efficiently

### 5. Scheduled Task Runner (NEW - Optional)

**File**: `server/services/scheduler.service.ts`

**Purpose**: Periodically trigger advisory generation

**Interface**:
```typescript
class SchedulerService {
  // Run advisory generation every N hours
  startWeatherAdvisoryScheduler(intervalHours: number): void

  // Stop the scheduler
  stopWeatherAdvisoryScheduler(): void
}
```

**Note**: This is optional for MVP. Can be triggered manually via API endpoint initially.

## Data Models

### Advisory Schema (Existing - Minor Updates)

**File**: `server/db/schemas/index.ts`

**Current Schema**:
```typescript
{
  _id: ObjectId
  farmerId?: ObjectId  // Optional - undefined for broadcast
  source: 'weather' | 'scanner' | 'manual'
  payload: {
    message: string
    actions?: string[]
  }
  status: 'delivered' | 'read'  // KEEP for now, but don't expose in API
  createdAt: Date
}
```

**Updates**:
- Keep `status` field in database for potential future use
- Don't expose `status` in API responses
- Add index on `(farmerId, source, createdAt)` for duplicate checking

### Weather Advisory Mapping

Weather conditions from `generateAdvisories()` map to advisory creation:

```typescript
{
  type: 'heat' | 'rainfall' | 'humidity' | 'wind'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  actions: string[]
  conditions: { temperature?, rainfall?, humidity?, windSpeed? }
}
```

Maps to:

```typescript
{
  source: 'weather'
  payload: {
    message: `${title}: ${message}`
    actions: actions
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Advisory retrieval completeness
*For any* farmer ID, retrieving advisories should return all advisories where the farmerId matches OR farmerId is null (broadcast), ordered by creation date descending
**Validates: Requirements 1.1, 1.4**

### Property 2: Advisory creation timestamp
*For any* advisory creation request, the created advisory should have a createdAt timestamp within 1 second of the current time
**Validates: Requirements 2.2**

### Property 3: Advisory creation returns complete object
*For any* valid advisory creation request, the response should include all required fields: _id, farmerId (or undefined), source, payload with message, and createdAt
**Validates: Requirements 2.3**

### Property 4: Weather advisory generation threshold
*For any* weather data with temperature > 35°C OR rainfall > 50mm OR humidity > 80% OR windSpeed > 10 m/s, at least one advisory should be generated
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Duplicate prevention window
*For any* farmer and advisory type (source), if an advisory of that type was created within the last 24 hours, no new advisory of the same type should be created
**Validates: Requirements 3.6**

### Property 6: Location-based targeting
*For any* weather advisory generation for a specific location, only farmers whose division/district/upazila matches that location should receive advisories
**Validates: Requirements 3.5**

### Property 7: Crop-specific enrichment
*For any* farmer with active crop batches, weather advisories generated for that farmer should reference the crop types in the advisory message or actions
**Validates: Requirements 4.1, 4.2, 4.5**

### Property 8: Empty crop handling
*For any* farmer with zero active crop batches, weather advisories should still be generated but contain only general weather warnings without crop-specific guidance
**Validates: Requirements 4.3**

### Property 9: Validation error clarity
*For any* advisory creation request missing required fields (farmerId when not broadcast, source, or message), the system should return a validation error specifying which field is missing
**Validates: Requirements 2.4**

### Property 10: Database error resilience
*For any* database connection failure during advisory operations, the system should return an appropriate error response without crashing and without creating partial records
**Validates: Requirements 5.1, 5.5**

## Error Handling

### Error Types

1. **ValidationError**: Invalid input data
   - Missing required fields
   - Invalid field formats
   - Business rule violations

2. **NotFoundError**: Resource not found
   - Advisory ID doesn't exist
   - Farmer ID doesn't exist

3. **DatabaseError**: Database operation failures
   - Connection failures
   - Query timeouts
   - Index errors

4. **WeatherAPIError**: Weather service failures
   - API rate limit exceeded
   - Network failures
   - Invalid coordinates

### Error Handling Strategy

**API Layer**:
- Catch all errors from service layer
- Convert to appropriate HTTP status codes
- Return structured error responses
- Log errors with context

**Service Layer**:
- Validate inputs before database operations
- Wrap database calls in try-catch
- Provide meaningful error messages
- Log errors with stack traces

**Repository Layer**:
- Handle MongoDB-specific errors
- Convert to application error types
- Ensure no partial writes

**Weather Advisory Generation**:
- Continue processing other farmers if one fails
- Log failures but don't stop batch processing
- Return summary of successes and failures
- Use cached weather data when API fails

### Graceful Degradation

1. **Weather API Unavailable**: Use cached weather data (up to 24 hours old)
2. **Database Temporarily Down**: Return 503 Service Unavailable, retry later
3. **Duplicate Advisory**: Skip silently, log for monitoring
4. **Invalid Farmer Location**: Use default location or skip farmer

## Testing Strategy

### Unit Testing

**Framework**: Vitest (already configured in project)

**Test Coverage**:

1. **Advisory Service Tests** (`advisory.service.test.ts` - existing, update):
   - Remove tests for `markAsRead` and `getUnreadAdvisories`
   - Test `createFarmerAdvisory` with valid/invalid inputs
   - Test `getAdvisoriesForFarmer` returns correct advisories
   - Test validation logic for message, source, actions

2. **Weather Advisory Service Tests** (`weatherAdvisory.service.test.ts` - new):
   - Test `generateForFarmer` creates advisories for weather conditions
   - Test duplicate prevention logic
   - Test crop enrichment logic
   - Test batch processing for multiple farmers
   - Test error handling when weather service fails

3. **Advisory Repository Tests** (`advisories.repository.test.ts` - existing, update):
   - Remove tests for `markAsRead` and `findUnread`
   - Add tests for `findRecentByFarmerAndType`
   - Test `findByFarmerId` includes broadcast advisories
   - Test sorting by creation date

4. **Advisory Routes Tests** (`advisories.test.ts` - existing, update):
   - Remove tests for `PUT /advisories/:id/read`
   - Test `POST /advisories` with valid/invalid data
   - Test `GET /advisories?farmerId=xxx` filtering
   - Test error responses

### Property-Based Testing

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Tests**:

Each property test must be tagged with a comment referencing the design document property number.

1. **Property 1 Test**: Advisory retrieval completeness
   - Generate random farmer IDs and advisory sets
   - Verify all matching advisories are returned
   - **Feature: advisory-system-integration, Property 1: Advisory retrieval completeness**

2. **Property 2 Test**: Advisory creation timestamp
   - Generate random advisory creation requests
   - Verify createdAt is within 1 second of now
   - **Feature: advisory-system-integration, Property 2: Advisory creation timestamp**

3. **Property 3 Test**: Advisory creation returns complete object
   - Generate random valid advisory requests
   - Verify all required fields are present in response
   - **Feature: advisory-system-integration, Property 3: Advisory creation returns complete object**

4. **Property 4 Test**: Weather advisory generation threshold
   - Generate random weather data with various conditions
   - Verify advisories are generated when thresholds are exceeded
   - **Feature: advisory-system-integration, Property 4: Weather advisory generation threshold**

5. **Property 5 Test**: Duplicate prevention window
   - Generate random advisory creation sequences
   - Verify duplicates within 24 hours are prevented
   - **Feature: advisory-system-integration, Property 5: Duplicate prevention window**

6. **Property 6 Test**: Location-based targeting
   - Generate random farmer locations and weather events
   - Verify only farmers in affected locations receive advisories
   - **Feature: advisory-system-integration, Property 6: Location-based targeting**

7. **Property 7 Test**: Crop-specific enrichment
   - Generate random farmers with crop batches
   - Verify advisories mention crop types
   - **Feature: advisory-system-integration, Property 7: Crop-specific enrichment**

8. **Property 8 Test**: Empty crop handling
   - Generate random farmers with no crops
   - Verify advisories are still generated without crop-specific content
   - **Feature: advisory-system-integration, Property 8: Empty crop handling**

9. **Property 9 Test**: Validation error clarity
   - Generate random invalid advisory requests
   - Verify error messages specify missing fields
   - **Feature: advisory-system-integration, Property 9: Validation error clarity**

10. **Property 10 Test**: Database error resilience
    - Simulate database failures during operations
    - Verify no partial records and appropriate errors
    - **Feature: advisory-system-integration, Property 10: Database error resilience**

### Integration Testing

**Scope**: End-to-end API testing with real database

**Test Scenarios**:
1. Create advisory via API, retrieve via API
2. Generate weather advisories for farmer, verify in database
3. Test with multiple concurrent requests
4. Test with database connection issues

### Manual Testing Checklist

1. Create manual advisory for specific farmer
2. Create broadcast advisory
3. Retrieve advisories for farmer (should include broadcast)
4. Trigger weather advisory generation for single farmer
5. Trigger weather advisory generation for all farmers
6. Verify no duplicates created within 24 hours
7. Test with farmer who has crops vs no crops
8. Test error cases (invalid IDs, missing fields)

## Implementation Notes

### Duplicate Prevention Strategy

Use a composite query to check for recent advisories:

```typescript
const recentAdvisories = await advisoriesRepository.findMany({
  farmerId: farmerId,
  source: 'weather',
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
});
```

If any exist, skip creation.

### Crop Enrichment Strategy

1. Fetch active crop batches for farmer
2. Extract unique crop types
3. Append crop-specific guidance to advisory message:
   - "Your rice crops may be affected..."
   - "Consider protecting your wheat from..."

### Batch Processing Strategy

For generating advisories for all farmers:
1. Fetch all farmers from database
2. Group by location (division/district) to minimize weather API calls
3. Process in batches of 10-20 farmers
4. Collect results and errors
5. Return summary statistics

### API Endpoint for Manual Trigger (Optional)

Add endpoint for admins to manually trigger generation:

```
POST /api/advisories/generate
Body: {
  farmerId?: string  // Optional - if omitted, generate for all
  division?: string  // Optional - filter by location
  district?: string
}
```

This allows testing and manual triggering without a scheduler.

## Performance Considerations

1. **Weather API Caching**: Leverage existing weather service caching (1-hour TTL)
2. **Batch Processing**: Process farmers in batches to avoid memory issues
3. **Database Indexes**: Ensure indexes on `(farmerId, source, createdAt)` for duplicate checks
4. **Async Operations**: Use fire-and-forget for non-critical operations
5. **Rate Limiting**: Respect weather API rate limits (already handled by weather service)

## Security Considerations

1. **Authorization**: Farmers can only view their own advisories (already handled by query filtering)
2. **Input Validation**: Validate all inputs using Zod schemas (already in place)
3. **SQL Injection**: Not applicable (using MongoDB with ObjectId)
4. **Rate Limiting**: Consider rate limiting on advisory creation endpoint
5. **Data Privacy**: Advisories contain no sensitive personal information

## Future Enhancements

1. **Push Notifications**: Integrate with mobile push notification service
2. **SMS Alerts**: Send critical advisories via SMS
3. **Advisory Prioritization**: Add priority levels beyond severity
4. **Advisory Expiration**: Auto-expire advisories after N days
5. **Advisory Feedback**: Allow farmers to rate advisory usefulness
6. **Machine Learning**: Learn from farmer feedback to improve advisory relevance
7. **Multi-language Support**: Translate advisories to Bengali
8. **Advisory Templates**: Create reusable templates for common scenarios
