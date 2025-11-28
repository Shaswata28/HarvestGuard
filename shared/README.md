# Shared API Types

This directory contains TypeScript types shared between the client and server to ensure type consistency across the application.

## Overview

All API request/response interfaces are defined in `api.ts` and can be imported using the `@shared/api` path alias.

## Available Types

### Farmer Types

**Requests:**
- `RegisterFarmerRequest` - Register a new farmer
- `LoginFarmerRequest` - Authenticate a farmer
- `UpdateFarmerRequest` - Update farmer profile

**Responses:**
- `FarmerResponse` - Farmer data
- `LoginFarmerResponse` - Login result with farmer data

**Query Parameters:**
- `FarmerQueryParams` - Filter farmers by location, role, with pagination

### Crop Batch Types

**Requests:**
- `CreateCropBatchRequest` - Create a new crop batch
- `UpdateCropBatchRequest` - Update crop batch details
- `TransitionStageRequest` - Transition from growing to harvested

**Responses:**
- `CropBatchResponse` - Crop batch data
- `CropBatchListResponse` - List of crop batches with total count

**Query Parameters:**
- `CropBatchQueryParams` - Filter by farmer, stage, location, with pagination

### Health Scan Types

**Requests:**
- `CreateHealthScanRequest` - Record a new health scan
- `UpdateHealthScanStatusRequest` - Update scan status
- `UpdateHealthScanOutcomeRequest` - Update treatment outcome

**Responses:**
- `HealthScanResponse` - Health scan data
- `HealthScanListResponse` - List of health scans with total count

**Query Parameters:**
- `HealthScanQueryParams` - Filter by farmer, batch, status, with pagination

### Loss Event Types

**Requests:**
- `CreateLossEventRequest` - Record a crop loss event

**Responses:**
- `LossEventResponse` - Loss event data
- `LossEventListResponse` - List of loss events with total count

**Query Parameters:**
- `LossEventQueryParams` - Filter by farmer, batch, type, date range, with pagination

### Intervention Types

**Requests:**
- `CreateInterventionRequest` - Record an intervention

**Responses:**
- `InterventionResponse` - Intervention data
- `InterventionListResponse` - List of interventions with total count

**Query Parameters:**
- `InterventionQueryParams` - Filter by farmer, batch, type, success, date range, with pagination

### Advisory Types

**Requests:**
- `CreateAdvisoryRequest` - Create a farmer-specific or broadcast advisory
- `MarkAdvisoryReadRequest` - Mark an advisory as read

**Responses:**
- `AdvisoryResponse` - Advisory data
- `AdvisoryListResponse` - List of advisories with total count

**Query Parameters:**
- `AdvisoryQueryParams` - Filter by farmer, source, status, date range, with pagination

### Dashboard Types

**Responses:**
- `FarmerDashboardResponse` - Aggregated metrics for a farmer
- `AdminDashboardResponse` - System-wide analytics for administrators

### Session Types

**Requests:**
- `CreateSessionRequest` - Create an authentication session
- `ValidateSessionRequest` - Validate a session

**Responses:**
- `SessionResponse` - Session data
- `ValidateSessionResponse` - Session validation result

### Weather Snapshot Types

**Requests:**
- `CreateWeatherSnapshotRequest` - Cache weather data

**Responses:**
- `WeatherSnapshotResponse` - Weather snapshot data
- `WeatherSnapshotListResponse` - List of weather snapshots with total count

**Query Parameters:**
- `WeatherSnapshotQueryParams` - Filter by location, date range, with pagination

### Common Types

**Error Handling:**
- `ErrorResponse` - Structured error response with type, message, and details
  - Error types: `ValidationError`, `NotFoundError`, `ConflictError`, `DatabaseError`, `AuthenticationError`, `AuthorizationError`

**Success Responses:**
- `SuccessResponse` - Generic success response

**Pagination:**
- `PaginationParams` - Common pagination parameters (page, limit, sortBy, sortOrder)
- `PaginatedResponse<T>` - Generic paginated response with data and pagination metadata

## Usage Examples

### Client-Side (React)

```typescript
import { 
  RegisterFarmerRequest, 
  FarmerResponse,
  ErrorResponse 
} from '@shared/api';

async function registerFarmer(data: RegisterFarmerRequest): Promise<FarmerResponse> {
  const response = await fetch('/api/farmers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}
```

### Server-Side (Express)

```typescript
import { RequestHandler } from 'express';
import { 
  CreateCropBatchRequest, 
  CropBatchResponse 
} from '@shared/api';

export const handleCreateCropBatch: RequestHandler = async (req, res) => {
  const request: CreateCropBatchRequest = req.body;
  
  // Process request...
  
  const response: CropBatchResponse = {
    _id: batch._id.toString(),
    farmerId: batch.farmerId.toString(),
    cropType: batch.cropType,
    stage: batch.stage,
    enteredDate: batch.enteredDate.toISOString()
  };
  
  res.json(response);
};
```

## Type Consistency

All types in this file are designed to match the MongoDB schemas defined in `server/db/schemas/index.ts`. Key differences:

- **ObjectId**: Represented as `string` in API types (serialized), but as `ObjectId` in database schemas
- **Dates**: Represented as ISO date strings in API types, but as `Date` objects in database schemas
- **Optional fields**: Consistently marked with `?` in both API types and schemas

## Validation

While these types provide compile-time type safety, runtime validation is performed using:
- **Zod schemas** in `server/db/schemas/index.ts` for database operations
- **Validation middleware** in `server/middleware/validation.ts` for API requests

## Testing

Type definitions are tested in `shared/api.test.ts` to ensure:
- All types can be imported successfully
- Type structures are valid
- Enum values are complete
- Types can be used to create valid objects

Run tests with:
```bash
npm test -- shared/api.test.ts --run
```
