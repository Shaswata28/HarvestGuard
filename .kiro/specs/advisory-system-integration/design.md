# Design Document

## Overview

The Advisory System Integration connects weather data, crop batch information, and farmer profiles to deliver intelligent, context-aware agricultural recommendations in simple Bangla language. The system combines weather forecasts with the farmer's specific crop data (crop type, planting date, expected harvest date) to generate actionable advisories that farmers can easily understand and act upon.

The system operates in two modes:
1. **Manual/On-Demand**: Advisories created explicitly via API calls (by admins or other services)
2. **Automated**: Context-aware advisories generated automatically by combining weather conditions with farmer's crop batch data

Key enhancement: The system now generates simple Bangla advisories that combine weather forecasts with crop-specific information, such as "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন" (85% rain in next 3 days → Harvest rice today or cover it)

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

**Purpose**: Orchestrates automatic generation of context-aware advisories by combining weather data with crop batch information

**Interface**:
```typescript
class WeatherAdvisoryService {
  constructor(
    advisoryService: AdvisoryService,
    farmersRepository: FarmersRepository,
    cropBatchesRepository: CropBatchesRepository,
    weatherService: WeatherService
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

  // Generate context-aware Bangla advisory combining weather + crop data
  private generateContextAwareAdvisory(
    weather: WeatherData,
    crops: CropBatch[]
  ): BanglaAdvisory | null

  // Calculate days until harvest for urgency determination
  private calculateDaysUntilHarvest(expectedHarvestDate: Date): number

  // Determine most urgent weather risk
  private determineMostUrgentRisk(weather: WeatherData): WeatherRisk | null
}
```

**Key Responsibilities**:
- Fetch weather forecast data for farmer locations
- Fetch active crop batches for each farmer
- Combine weather conditions with crop data to generate context-aware advisories
- Generate simple Bangla messages that show weather condition + action
- Calculate days until harvest to prioritize harvest-related advisories
- Check for duplicates (don't create same advisory within 24 hours)
- Batch process multiple farmers efficiently

### 5. Bangla Advisory Generator (NEW)

**File**: `server/utils/banglaAdvisoryGenerator.ts`

**Purpose**: Generate simple Bangla advisory messages by combining weather conditions with crop information

**Interface**:
```typescript
interface WeatherCondition {
  type: 'rain' | 'heat' | 'humidity' | 'wind'
  value: number  // e.g., 85 for 85% rain chance, 36 for 36°C
  severity: 'low' | 'medium' | 'high'
}

interface CropContext {
  cropType: string  // e.g., "ধান"
  daysUntilHarvest: number | null
  stage: 'growing' | 'harvested'
}

interface BanglaAdvisory {
  message: string  // e.g., "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
  severity: 'low' | 'medium' | 'high'
}

function generateBanglaAdvisory(
  weather: WeatherCondition,
  crop: CropContext
): BanglaAdvisory | null
```

**Advisory Message Format**:
```
[Weather Condition + Value] → [Specific Action]
```

**Examples**:
- Rain + Harvest Soon: "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
- Heat + Growing: "তাপমাত্রা ৩৬°C উঠবে → বিকেলের দিকে সেচ দিন"
- Rain + Growing: "আগামীকাল ভারী বৃষ্টি → নালা পরিষ্কার করুন"
- Heat + Harvest Soon: "তাপমাত্রা ৩৮°C → দুপুরে ধান কাটবেন না, সকাল/সন্ধ্যায় কাটুন"

**Key Responsibilities**:
- Combine weather condition with crop context
- Generate simple, actionable Bangla messages
- Prioritize harvest-related advice when harvest is within 7 days
- Use simple language that farmers can understand even when reading slowly
- Include specific numbers (temperature, rain percentage) for clarity

### 6. Advisory Card Component (UPDATE)

**File**: `client/components/AdvisoryCard.tsx`

**Purpose**: Display context-aware advisories in the UI

**Updates Needed**:
- Fetch advisories from backend API instead of generating client-side
- Display advisory message and actions from backend
- Maintain visual styling based on severity
- Support both weather-only and crop-aware advisories

### 7. Scheduled Task Runner (NEW - Optional)

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
- `message` field will now contain simple Bangla advisory combining weather + crop info

### Crop Batch Schema (Existing - Reference)

**File**: `server/db/schemas/index.ts`

**Relevant Fields for Advisory Generation**:
```typescript
{
  _id: ObjectId
  farmerId: ObjectId
  cropType: string  // e.g., "ধান" (rice/paddy)
  stage: 'growing' | 'harvested'
  expectedHarvestDate?: Date  // Used to calculate urgency
  enteredDate: Date  // Can be used to estimate crop age
}
```

### Context-Aware Advisory Generation Flow

**Input Data**:
```typescript
{
  weather: {
    temperature: number
    rainfall: number
    humidity: number
    windSpeed: number
    rainChance?: number  // Forecast probability
  },
  crops: CropBatch[]
}
```

**Processing Logic**:
1. Determine most urgent weather risk (rain > 70%, temp > 35°C, etc.)
2. Calculate days until harvest for each crop
3. Determine crop stage and urgency
4. Generate Bangla advisory combining weather + crop context

**Output Advisory**:
```typescript
{
  source: 'weather'
  payload: {
    message: "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
    actions: ["ধান কাটুন", "ঢেকে রাখুন"]  // Optional: extracted actions
  }
}
```

### Advisory Priority Rules

**Harvest-Related Advisories** (Highest Priority):
- Triggered when: `daysUntilHarvest <= 7` AND weather risk detected
- Examples:
  - Heavy rain + harvest soon → "আজই ধান কাটুন"
  - High heat + harvest soon → "দুপুরে কাটবেন না"

**Growing Stage Advisories** (Medium Priority):
- Triggered when: crop in growing stage AND weather risk detected
- Examples:
  - High heat → "বিকেলের দিকে সেচ দিন"
  - Heavy rain → "নালা পরিষ্কার করুন"

**General Weather Warnings** (Low Priority):
- Triggered when: no active crops OR no crop-specific risk
- Examples:
  - "আগামীকাল ঝড় → সতর্ক থাকুন"

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

### Property 11: Weather and crop data combination
*For any* advisory generation with weather data and active crop batches, the generated advisory should contain information from both the weather condition and the crop data (crop type or stage)
**Validates: Requirements 6.1**

### Property 12: Harvest urgency with rain
*For any* farmer with rice crops where daysUntilHarvest <= 7 AND rain forecast > 70%, an advisory should be generated containing harvest-related keywords (কাটুন, harvest, or ঢেকে)
**Validates: Requirements 6.2**

### Property 13: Irrigation advisory for heat
*For any* farmer with crops in growing stage AND temperature forecast > 35°C, an advisory should be generated containing irrigation-related keywords (সেচ, irrigation, or পানি)
**Validates: Requirements 6.3**

### Property 14: Advisory message format structure
*For any* generated advisory message, it should contain both a weather condition with a numeric value AND an action indicator (→ symbol)
**Validates: Requirements 6.5**

### Property 15: Days until harvest calculation
*For any* crop batch with an expectedHarvestDate, the calculated daysUntilHarvest should equal the difference in days between expectedHarvestDate and the current date
**Validates: Requirements 6.6**

### Property 16: Harvest advisory prioritization
*For any* farmer with crop batches where daysUntilHarvest <= 7 AND weather risk exists (rain > 70% OR temp > 35°C), a harvest-related advisory should be generated rather than a general weather warning
**Validates: Requirements 6.7**

### Property 17: Single advisory for multiple risks
*For any* weather data with multiple risks (e.g., high temperature AND high rain), only one advisory should be generated for the most urgent risk
**Validates: Requirements 6.8**

### Property 18: Crop type in advisory
*For any* farmer with active crop batches, the generated advisory message should contain the crop type from at least one of the farmer's crop batches
**Validates: Requirements 6.9**

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
   - Test `generateForFarmer` creates context-aware advisories
   - Test duplicate prevention logic
   - Test days until harvest calculation
   - Test harvest advisory prioritization
   - Test batch processing for multiple farmers
   - Test error handling when weather service fails

3. **Bangla Advisory Generator Tests** (`banglaAdvisoryGenerator.test.ts` - new):
   - Test advisory generation for rain + harvest soon scenario
   - Test advisory generation for heat + growing stage scenario
   - Test advisory message format (contains → and numeric values)
   - Test crop type inclusion in message
   - Test prioritization when multiple risks exist
   - Test null return when no significant weather risk

4. **Advisory Repository Tests** (`advisories.repository.test.ts` - existing, update):
   - Remove tests for `markAsRead` and `findUnread`
   - Add tests for `findRecentByFarmerAndType`
   - Test `findByFarmerId` includes broadcast advisories
   - Test sorting by creation date

5. **Advisory Routes Tests** (`advisories.test.ts` - existing, update):
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

11. **Property 11 Test**: Weather and crop data combination
    - Generate random weather data and crop batches
    - Verify advisory contains both weather and crop information
    - **Feature: advisory-system-integration, Property 11: Weather and crop data combination**

12. **Property 12 Test**: Harvest urgency with rain
    - Generate random farmers with crops near harvest and rain forecasts
    - Verify harvest advisories when daysUntilHarvest <= 7 AND rain > 70%
    - **Feature: advisory-system-integration, Property 12: Harvest urgency with rain**

13. **Property 13 Test**: Irrigation advisory for heat
    - Generate random farmers with growing crops and temperature data
    - Verify irrigation advisories when temp > 35°C
    - **Feature: advisory-system-integration, Property 13: Irrigation advisory for heat**

14. **Property 14 Test**: Advisory message format structure
    - Generate random advisories
    - Verify message contains numeric value and → symbol
    - **Feature: advisory-system-integration, Property 14: Advisory message format structure**

15. **Property 15 Test**: Days until harvest calculation
    - Generate random crop batches with expectedHarvestDate
    - Verify calculated daysUntilHarvest matches expected difference
    - **Feature: advisory-system-integration, Property 15: Days until harvest calculation**

16. **Property 16 Test**: Harvest advisory prioritization
    - Generate random farmers with crops near harvest and weather risks
    - Verify harvest advisories are prioritized over general warnings
    - **Feature: advisory-system-integration, Property 16: Harvest advisory prioritization**

17. **Property 17 Test**: Single advisory for multiple risks
    - Generate weather data with multiple simultaneous risks
    - Verify only one advisory is generated for most urgent risk
    - **Feature: advisory-system-integration, Property 17: Single advisory for multiple risks**

18. **Property 18 Test**: Crop type in advisory
    - Generate random farmers with crop batches
    - Verify advisory message contains crop type
    - **Feature: advisory-system-integration, Property 18: Crop type in advisory**

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

### Context-Aware Advisory Generation Strategy

1. Fetch weather forecast data for farmer's location
2. Fetch active crop batches for farmer (stage = 'growing')
3. For each crop batch:
   - Calculate days until harvest (if expectedHarvestDate exists)
   - Determine crop stage and urgency
4. Determine most urgent weather risk from forecast
5. Generate Bangla advisory using `banglaAdvisoryGenerator`:
   - If daysUntilHarvest <= 7 AND weather risk: Generate harvest-urgent advisory
   - If crop in growing stage AND weather risk: Generate growing-stage advisory
   - If no crops OR no crop-specific risk: Generate general weather warning
6. Format message as: `[Weather Condition + Value] → [Specific Action]`

**Example Logic Flow**:
```
Weather: Rain 85%, Temp 32°C
Crop: Rice, expectedHarvestDate in 5 days
→ Most urgent: Rain (harvest soon)
→ Advisory: "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
```

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
2. **SMS Alerts**: Send critical advisories via SMS in Bangla
3. **Advisory Expiration**: Auto-expire advisories after N days
4. **Advisory Feedback**: Allow farmers to rate advisory usefulness
5. **Machine Learning**: Learn from farmer feedback to improve advisory relevance and timing
6. **Multi-crop Support**: Expand beyond rice to support wheat, vegetables, etc.
7. **Weather Forecast Integration**: Use 3-day or 7-day forecasts instead of current weather
8. **Advisory Templates**: Create reusable templates for common scenarios
9. **Voice Advisories**: Convert text advisories to Bangla audio for farmers who cannot read
10. **Regional Dialects**: Adapt Bangla messages to regional dialects (Chittagong, Sylhet, etc.)
