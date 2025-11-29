# HarvestGuard - Complete Project Documentation

## Overview

HarvestGuard is a production-ready, full-stack agricultural management platform designed to empower farmers with real-time insights, AI-assisted crop health monitoring, and offline-first capabilities. The system bridges traditional farming practices with modern technology through a Progressive Web App (PWA) that works seamlessly in low-connectivity environments.

### Core Value Proposition

- **Smart Crop Management**: Complete lifecycle tracking from sowing to harvest with storage management
- **AI-Powered Diagnostics**: Disease detection using Google Gemini API with confidence scoring
- **Hyper-Local Weather**: Real-time and forecast data from OpenWeatherMap with intelligent caching
- **Offline-First Architecture**: Full functionality without constant internet connectivity
- **Bilingual Support**: Native English and Bengali (বাংলা) localization
- **Data-Driven Insights**: Interactive dashboards with yield, finance, and resource analytics

## Architecture

### High-Level Architecture

HarvestGuard follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  React 18 SPA + PWA + Offline Storage + Service Workers     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│   Express.js + Services + Validation + Error Handling       │
└─────────────────────────────────────────────────────────────┘
                            ↕ Repository Pattern
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│   MongoDB + Zod Schemas + Geospatial Indexing              │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
HarvestGuard/
├── client/              # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── services/       # API client and offline storage
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React Context providers
│   ├── utils/          # Helper functions and utilities
│   └── locales/        # Internationalization strings
│
├── server/             # Backend Express application
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic layer
│   ├── db/            # Database layer
│   │   ├── schemas/   # Zod validation schemas
│   │   └── repositories/ # Data access layer
│   ├── middleware/    # Express middleware
│   └── utils/         # Server utilities
│
├── shared/            # Shared TypeScript types
│   └── api.ts        # API contracts and interfaces
│
└── public/           # Static assets and PWA manifest
```

### Technology Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | React 18, TypeScript, Vite | Modern SPA with fast builds |
| **UI Framework** | TailwindCSS, Shadcn/UI | Accessible component library |
| **State Management** | React Context, TanStack Query | Authentication and data fetching |
| **Routing** | React Router v6 | Client-side navigation |
| **Charts** | Recharts | Data visualization |
| **Animation** | Framer Motion | Smooth UI transitions |
| **Backend** | Node.js 18+, Express 5 | RESTful API server |
| **Validation** | Zod | Runtime type validation |
| **Database** | MongoDB Atlas | Document store with geospatial |
| **Image Processing** | Sharp | Crop image optimization |
| **AI/ML** | Google Gemini API | Disease detection |
| **Weather** | OpenWeatherMap API | Weather data provider |
| **Testing** | Vitest, Supertest, fast-check | Unit and property-based tests |
| **Build Tools** | Vite, TypeScript, PNPM | Fast builds and package management |
| **Deployment** | Render, Docker | Cloud hosting |

## Components and Interfaces

### Frontend Architecture

#### Component Hierarchy

```
App
├── AuthContext Provider
│   └── LangContext Provider
│       ├── Layout
│       │   ├── Navbar
│       │   └── BottomNav
│       └── Routes
│           ├── Landing
│           ├── Login / Register
│           ├── Dashboard
│           │   ├── StatsCard
│           │   ├── WeatherCard
│           │   └── AdvisoryCard
│           ├── AddCrop / EditCrop
│           │   ├── CropBatchEntry
│           │   └── StorageSelector
│           ├── HealthJournal
│           ├── Scanner
│           │   └── WeightInput
│           ├── Weather
│           │   └── WeatherAdvisory
│           ├── Profile
│           │   └── ExportData
│           └── AdminDashboard
```

#### Key Services

**API Service (`client/services/api.ts`)**
- Type-safe API client using shared TypeScript contracts
- Centralized error handling with `ApiError` class
- Methods for all backend endpoints (dashboard, crops, scans, weather, advisories)

**Offline Storage Service (`client/services/offlineStorage.ts`)**
- LocalStorage-based caching with expiration timestamps
- Sync queue for offline actions (create, update, delete)
- Cache invalidation and management utilities
- Configurable TTL per resource type

**Sync Service (`client/services/syncService.ts`)**
- Background synchronization of pending actions
- Retry logic with exponential backoff
- Status notifications for sync progress
- Automatic cleanup of failed actions after 3 attempts

#### Custom Hooks

- `useAutoSync`: Automatic background sync when online
- `useOnlineStatus`: Network connectivity detection
- `useLocalStorage`: Persistent state management
- `usePWAInstall`: PWA installation prompt handling
- `useAdvisoryNotifications`: Push notification management
- `useHarvestReminders`: Scheduled harvest alerts

#### Context Providers

**AuthContext**
- User authentication state
- Login/logout functionality
- Farmer profile data
- Session management

**LangContext**
- Language selection (English/Bengali)
- Localized string retrieval
- Persistent language preference

### Backend Architecture

#### API Routes Structure

```
/api
├── /farmers
│   ├── POST /register          # Create farmer account
│   ├── POST /login            # Authenticate farmer
│   ├── GET /:id               # Get farmer profile
│   └── PUT /:id               # Update farmer profile
│
├── /crop-batches
│   ├── GET /                  # List crop batches (with filters)
│   ├── POST /                 # Create new crop batch
│   ├── GET /:id               # Get single crop batch
│   ├── PUT /:id               # Update crop batch
│   ├── PUT /:id/stage         # Transition to harvested
│   └── DELETE /:id            # Delete crop batch
│
├── /health-scans
│   ├── GET /                  # List health scans
│   ├── POST /                 # Create health scan
│   ├── GET /:id               # Get single scan
│   ├── PUT /:id/outcome       # Update treatment outcome
│   └── PUT /:id/feedback      # Update immediate feedback
│
├── /scanner
│   └── POST /analyze          # Upload image for AI analysis
│
├── /weather
│   ├── GET /current           # Current weather by farmer location
│   └── GET /forecast          # 5-day forecast
│
├── /advisories
│   ├── GET /                  # List advisories for farmer
│   ├── POST /                 # Create advisory (admin)
│   └── PUT /:id/read          # Mark advisory as read
│
└── /dashboard
    ├── GET /farmer/:id        # Farmer dashboard metrics
    └── GET /admin             # System-wide analytics
```

#### Service Layer

**Farmer Service (`server/services/farmer.service.ts`)**
- User registration with password hashing (bcrypt)
- Authentication and session creation
- Profile management
- Location-based queries

**Crop Batch Service (`server/services/cropBatch.service.ts`)**
- Crop lifecycle management (growing → harvested)
- Storage location tracking
- Loss percentage calculations
- Batch filtering and pagination

**Health Scan Service (`server/services/healthScan.service.ts`)**
- Disease scan recording
- Treatment outcome tracking
- Feedback collection
- Scan history retrieval

**Gemini Service (`server/services/gemini.service.ts`)**
- Image upload to Google Gemini API
- Disease detection with confidence scoring
- Remedy text generation
- Error handling for API failures

**Weather Service (`server/services/weather.service.ts`)**
- OpenWeatherMap API integration
- Intelligent caching with TTL
- Rate limit management (1000 calls/day free tier)
- Fallback to cached data on API errors

**Advisory Service (`server/services/advisory.service.ts`)**
- Farmer-specific and broadcast advisories
- Weather-based advisory generation
- Scanner-based advisory creation
- Read status tracking

**Dashboard Service (`server/services/dashboard.service.ts`)**
- Aggregated metrics calculation
- Farmer-specific statistics
- Admin system-wide analytics
- Badge calculation logic

#### Repository Pattern

**Base Repository (`server/db/repositories/base.repository.ts`)**

Provides generic CRUD operations with automatic validation:

```typescript
class BaseRepository<T> {
  create(data: Partial<T>): Promise<T>
  findById(id: string): Promise<T | null>
  findOne(filter: Filter<T>): Promise<T | null>
  findMany(filter: Filter<T>, options?: FindOptions): Promise<T[]>
  updateById(id: string, update: Partial<T>): Promise<T | null>
  deleteById(id: string): Promise<boolean>
  count(filter: Filter<T>): Promise<number>
}
```

**Specialized Repositories**

Each collection has a dedicated repository extending `BaseRepository`:

- `FarmersRepository`: Phone-based lookup, index creation
- `CropBatchesRepository`: Stage filtering, farmer queries
- `HealthScansRepository`: Batch association, status filtering
- `LossEventsRepository`: Event type filtering, date ranges
- `InterventionsRepository`: Success tracking, batch queries
- `AdvisoriesRepository`: Farmer filtering, read status
- `SessionsRepository`: Expiration handling, cleanup
- `WeatherSnapshotsRepository`: Location-based queries, TTL

#### Middleware

**Validation Middleware (`server/middleware/validation.ts`)**
- Zod schema validation for request bodies
- Query parameter validation
- Automatic error responses for invalid data

**Error Handler Middleware (`server/middleware/errorHandler.ts`)**
- Centralized error handling
- Structured error responses
- Error logging
- Status code mapping

## Data Models

### MongoDB Collections

#### Farmers Collection

```typescript
{
  _id: ObjectId,
  phone: string,              // Unique, format: +880XXXXXXXXXX
  passwordHash: string,       // bcrypt hashed
  name: string,
  division: string,           // Bangladesh administrative division
  district: string,
  upazila: string,
  language: 'bn' | 'en',
  roles: ['farmer' | 'admin'],
  registeredAt: Date,
  // Cached dashboard metrics (optional)
  totalCrops?: number,
  totalWeight?: number,
  badges?: string[]
}

Indexes:
- phone (unique)
- { division, district, upazila }
```

#### Crop Batches Collection

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  cropType: string,
  stage: 'growing' | 'harvested',
  // Growing stage
  estimatedWeightKg?: number,
  expectedHarvestDate?: Date,
  // Harvested stage
  finalWeightKg?: number,
  actualHarvestDate?: Date,
  storageLocation?: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed',
  storageDivision?: string,
  storageDistrict?: string,
  enteredDate: Date,
  lossPercentage?: number,
  notes?: string,
  batchNumber?: string
}

Indexes:
- { farmerId, stage }
- { storageDivision, storageDistrict }
```

#### Health Scans Collection

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId?: ObjectId,
  capturedAt: Date,
  diseaseLabel: string,
  confidence: number,         // 0-100
  remedyText?: string,
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure',
  outcome?: 'recovered' | 'same' | 'worse',
  status: 'pending' | 'resolved' | 'healthy',
  imageUrl?: string
}

Indexes:
- { farmerId, capturedAt }
- batchId
- status
```

#### Loss Events Collection

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId: ObjectId,
  eventType: string,
  lossPercentage: number,     // 0-100
  lossWeightKg: number,
  reportedAt: Date,
  location: string
}

Indexes:
- { farmerId, reportedAt }
- batchId
```

#### Interventions Collection

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  batchId: ObjectId,
  interventionType: string,
  success: boolean,
  notes?: string,
  performedAt: Date
}

Indexes:
- { farmerId, performedAt }
- { batchId, success }
```

#### Advisories Collection

```typescript
{
  _id: ObjectId,
  farmerId?: ObjectId,        // null for broadcast
  source: 'weather' | 'scanner' | 'manual',
  payload: {
    message: string,
    actions?: string[]
  },
  status: 'delivered' | 'read',
  createdAt: Date
}

Indexes:
- { farmerId, status, createdAt }
- { source, createdAt }
```

#### Sessions Collection

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,
  authType: 'otp' | 'password',
  expiresAt: Date,
  deviceMeta?: {
    userAgent?: string,
    ip?: string
  },
  createdAt: Date
}

Indexes:
- { farmerId, expiresAt }
- expiresAt (TTL index)
```

#### Weather Snapshots Collection

```typescript
{
  _id: ObjectId,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  temperature: number,
  feelsLike: number,
  humidity: number,
  pressure: number,
  windSpeed: number,
  windDirection: number,
  rainfall: number,
  weatherCondition: string,
  weatherDescription: string,
  weatherIcon: string,
  visibility: number,
  cloudiness: number,
  sunrise: Date,
  sunset: Date,
  fetchedAt: Date,
  expiresAt: Date,
  source: string,
  apiCallCount: number
}

Indexes:
- { location, fetchedAt } (geospatial)
- expiresAt (TTL index)
```

### Shared Type Contracts

The `shared/api.ts` file defines TypeScript interfaces for all API requests and responses, ensuring type safety across the client-server boundary:

- Request types: `Create*Request`, `Update*Request`
- Response types: `*Response`, `*ListResponse`
- Query parameter types: `*QueryParams`
- Error types: `ErrorResponse` with structured error details
- Pagination types: `PaginationParams`, `PaginatedResponse<T>`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Documentation Completeness
*For any* documented feature in the requirements, the design document should contain corresponding architecture, component, and data model descriptions.
**Validates: Requirements 1.1, 2.1**

### Property 2: Type Contract Consistency
*For any* API endpoint, the request and response types in `shared/api.ts` should match the Zod schemas in `server/db/schemas/index.ts` (accounting for ObjectId serialization).
**Validates: Requirements 2.4, 4.3**

### Property 3: Repository Pattern Uniformity
*For any* MongoDB collection, there should exist a corresponding repository class extending `BaseRepository` with collection-specific methods.
**Validates: Requirements 4.2**

### Property 4: Offline-First Data Consistency
*For any* cached data in localStorage, when the cache is not expired, retrieving the data should return the same value that was stored.
**Validates: Requirements 3.3**

### Property 5: Sync Queue Idempotency
*For any* pending action in the sync queue, executing the sync operation multiple times should produce the same final state as executing it once.
**Validates: Requirements 3.3**

### Property 6: Validation Round-Trip
*For any* valid data object conforming to a Zod schema, parsing and then serializing the object should produce an equivalent object.
**Validates: Requirements 4.3, 8.3**

### Property 7: Error Response Structure
*For any* API error response, the response should contain a structured error object with type, message, and optional details fields.
**Validates: Requirements 4.5, 9.4**

### Property 8: Authentication Session Expiration
*For any* session, when the current time exceeds the `expiresAt` timestamp, the session should be considered invalid and removed.
**Validates: Requirements 8.2**

### Property 9: Cache Expiration Consistency
*For any* cached resource with a TTL, when the current time exceeds the `expiresAt` timestamp, the cache retrieval should return null.
**Validates: Requirements 3.3, 5.2**

### Property 10: Localization Completeness
*For any* UI string key, both English and Bengali translations should exist in the localization files.
**Validates: Requirements 7.5**

## Error Handling

### Error Types

The system defines structured error types with consistent HTTP status codes:

| Error Type | Status Code | Description |
|-----------|-------------|-------------|
| `ValidationError` | 400 | Zod schema validation failure |
| `AuthenticationError` | 401 | Invalid credentials or expired session |
| `AuthorizationError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Unique constraint violation |
| `DatabaseError` | 500 | Database operation failure |
| `ExternalAPIError` | 502 | Third-party API failure |

### Error Response Format

```typescript
{
  error: {
    type: string,
    message: string,
    details?: Record<string, any>,
    timestamp: string
  }
}
```

### Error Handling Strategy

**Backend**
1. Zod validation errors are caught and transformed into `ValidationError`
2. MongoDB duplicate key errors are caught and transformed into `ConflictError`
3. All errors are logged with structured logging
4. Error details are sanitized to prevent information leakage
5. Stack traces are only included in development mode

**Frontend**
1. API errors are wrapped in `ApiError` class with status code
2. Network errors trigger offline mode and queue actions
3. User-friendly error messages are displayed via toast notifications
4. Errors are logged to console in development mode
5. Critical errors trigger fallback UI states

### Retry Logic

**Weather API**
- Retry on 5xx errors with exponential backoff
- Fall back to cached data if available
- Log rate limit warnings at 80% threshold

**Sync Service**
- Retry failed actions up to 3 times
- Exponential backoff between retries
- Remove actions after 3 failures to prevent queue buildup

**Image Upload**
- Retry on network errors
- Compress images before upload to reduce failures
- Show upload progress to user

## Testing Strategy

### Unit Testing

**Framework**: Vitest with TypeScript support

**Coverage Areas**:
- Repository CRUD operations
- Service layer business logic
- Utility functions (password hashing, location parsing, image processing)
- API request/response transformers
- Cache expiration logic
- Validation schemas

**Example Test Structure**:
```typescript
describe('FarmersRepository', () => {
  it('should create a farmer with valid data', async () => {
    const farmer = await farmersRepo.create({
      phone: '+8801234567890',
      passwordHash: 'hashed',
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      language: 'bn'
    });
    expect(farmer._id).toBeDefined();
  });

  it('should throw ValidationError for invalid phone', async () => {
    await expect(farmersRepo.create({
      phone: 'invalid',
      // ...
    })).rejects.toThrow(ValidationError);
  });
});
```

### Property-Based Testing

**Framework**: fast-check for property-based testing

**Library Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment referencing the design document property:
```typescript
// Feature: project-documentation, Property 6: Validation Round-Trip
```

**Coverage Areas**:
- Schema validation round-trips
- Cache expiration logic across random timestamps
- Sync queue idempotency with random action sequences
- Error response structure across all error types
- Localization key completeness

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: project-documentation, Property 6: Validation Round-Trip
describe('Validation Round-Trip Property', () => {
  it('should preserve data through parse and serialize', () => {
    fc.assert(
      fc.property(
        fc.record({
          phone: fc.constant('+8801234567890'),
          name: fc.string({ minLength: 1 }),
          division: fc.string({ minLength: 1 }),
          district: fc.string({ minLength: 1 }),
          upazila: fc.string({ minLength: 1 }),
          language: fc.constantFrom('bn', 'en')
        }),
        (data) => {
          const parsed = FarmerSchema.parse(data);
          const serialized = JSON.parse(JSON.stringify(parsed));
          expect(serialized.name).toBe(data.name);
          expect(serialized.language).toBe(data.language);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework**: Supertest for API endpoint testing

**Coverage Areas**:
- End-to-end API workflows
- Authentication flows
- Database integration
- External API mocking (Gemini, OpenWeatherMap)

**Example Integration Test**:
```typescript
describe('POST /api/crop-batches', () => {
  it('should create a crop batch and return 201', async () => {
    const response = await request(app)
      .post('/api/crop-batches')
      .send({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: '2024-12-31'
      })
      .expect(201);
    
    expect(response.body._id).toBeDefined();
    expect(response.body.cropType).toBe('Rice');
  });
});
```

### Test Execution

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test --ui

# Run tests in watch mode (development)
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test server/db/repositories/farmers.repository.test.ts
```

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `beforeEach` and `afterEach` to reset state
3. **Mocking**: Mock external APIs (Gemini, OpenWeatherMap) to avoid rate limits
4. **Fixtures**: Use test data factories for consistent test data
5. **Assertions**: Use descriptive assertion messages
6. **Coverage**: Aim for >80% code coverage on critical paths
7. **Property Tests**: Use property-based testing for validation and data transformation logic

## Deployment

### Environment Variables

**Required Variables**:
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=HarvestGuard

# API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Server
NODE_ENV=production
PORT=3000
```

**Optional Variables**:
```env
# Weather API Configuration
WEATHER_CACHE_TTL=3600
WEATHER_CACHE_EXTENDED_TTL=7200
WEATHER_API_DAILY_LIMIT=1000
WEATHER_API_WARNING_THRESHOLD=800

# CORS (for split deployment)
CORS_ORIGIN=https://yourdomain.com

# Frontend API URL (for split deployment)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Deployment Strategies

#### Strategy 1: Full-Stack Single Deployment (Recommended for MVP)

**Pros**: Simple setup, single server, no CORS issues
**Cons**: Less scalable, single point of failure

**Build Commands**:
```bash
pnpm install
pnpm build:fullstack  # Builds both client and server
```

**Start Command**:
```bash
pnpm start:fullstack  # Serves both frontend and API
```

**Render Configuration** (render.yaml):
```yaml
services:
  - type: web
    name: harvestguard
    env: node
    buildCommand: pnpm install && pnpm build:fullstack
    startCommand: pnpm start:fullstack
```

#### Strategy 2: Split Deployment (Recommended for Production)

**Pros**: Independent scaling, CDN for frontend, better performance
**Cons**: More complex setup, CORS configuration required

**Frontend** (Static Site on Netlify/Vercel):
```bash
pnpm build:client
# Deploy dist/spa directory
```

**Backend** (Node.js on Render/Railway):
```bash
pnpm build:api
pnpm start:api
```

**Render Configuration** (render.yaml):
```yaml
services:
  - type: web
    name: harvestguard-backend
    buildCommand: pnpm install && pnpm build:api
    startCommand: pnpm start:api
    
  - type: web
    name: harvestguard-frontend
    env: static
    buildCommand: pnpm install && pnpm build:client
    staticPublishPath: dist/spa
```

### Build Output Structure

```
dist/
├── spa/                 # Frontend static files
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── manifest.json
│
├── server/             # Backend server bundle
│   └── production.mjs
│
└── api/               # API-only bundle (for split deployment)
    └── api-server.mjs
```

### Performance Optimizations

**Frontend**:
- Code splitting by route
- Lazy loading of heavy components (charts, 3D animations)
- Image optimization with Sharp
- Service worker caching for offline access
- Gzip compression

**Backend**:
- MongoDB connection pooling
- Weather data caching (30-minute TTL)
- Response compression middleware
- Rate limiting on expensive endpoints
- Database query optimization with indexes

### Monitoring and Logging

**Recommended Tools**:
- **Application Monitoring**: New Relic, Datadog
- **Error Tracking**: Sentry
- **Log Aggregation**: Papertrail, Logtail
- **Uptime Monitoring**: UptimeRobot, Pingdom

**Key Metrics to Monitor**:
- API response times
- Database query performance
- Weather API call count (rate limit tracking)
- Gemini API usage and costs
- Error rates by endpoint
- User session duration
- Offline sync success rate

### Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly, use separate keys for dev/prod
3. **Database**: Use MongoDB Atlas with IP whitelisting
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Restrict CORS origins to known domains
6. **Rate Limiting**: Implement rate limiting on public endpoints
7. **Input Validation**: All inputs validated with Zod schemas
8. **Password Security**: bcrypt with salt rounds ≥ 10
9. **Session Management**: Sessions expire after inactivity
10. **Error Messages**: Sanitize error messages to prevent information leakage

## Contributing

### Development Workflow

1. **Fork and Clone**
```bash
git clone https://github.com/yourusername/harvestguard.git
cd harvestguard
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Create Feature Branch**
```bash
git checkout -b feature/amazing-feature
```

4. **Make Changes**
- Write code following TypeScript best practices
- Add tests for new functionality
- Update documentation if needed

5. **Run Tests**
```bash
pnpm test
pnpm typecheck
```

6. **Commit Changes**
```bash
git commit -m "feat: add amazing feature"
```

7. **Push and Create PR**
```bash
git push origin feature/amazing-feature
```

### Code Style Guidelines

**TypeScript**:
- Use strict mode (`"strict": true` in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` type, use `unknown` if necessary

**React**:
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Use TypeScript for prop types
- Prefer composition over inheritance

**File Naming**:
- Components: PascalCase (e.g., `CropBatchEntry.tsx`)
- Utilities: camelCase (e.g., `locationData.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `*.types.ts` (if separate from implementation)

**Directory Structure**:
- Group by feature, not by file type
- Keep related files close together
- Use index files for clean imports

### Pull Request Guidelines

1. **Title**: Use conventional commit format (feat:, fix:, docs:, etc.)
2. **Description**: Explain what and why, not how
3. **Tests**: Include tests for new features
4. **Documentation**: Update README or docs if needed
5. **Breaking Changes**: Clearly mark breaking changes
6. **Review**: Request review from maintainers

### Testing Requirements

- All new features must include unit tests
- Critical paths should have integration tests
- Property-based tests for validation logic
- Maintain >80% code coverage

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **OpenWeatherMap** for weather data API
- **Google Gemini** for AI-powered disease detection
- **Shadcn/UI** for accessible component library
- **MongoDB Atlas** for database hosting
- **Render** for deployment platform
