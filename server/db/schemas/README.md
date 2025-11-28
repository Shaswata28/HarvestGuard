# MongoDB Schemas

This directory contains Zod schemas and TypeScript types for all MongoDB collections in the agricultural management application.

## Usage

### Importing Schemas

```typescript
import {
  FarmerSchema,
  CropBatchSchema,
  HealthScanSchema,
  LossEventSchema,
  InterventionSchema,
  AdvisorySchema,
  SessionSchema,
  WeatherSnapshotSchema
} from './schemas';
```

### Importing Types

```typescript
import type {
  Farmer,
  CropBatch,
  HealthScan,
  LossEvent,
  Intervention,
  Advisory,
  Session,
  WeatherSnapshot
} from './schemas';
```

### Validating Data

```typescript
// Parse and validate data (throws on error)
const farmer = FarmerSchema.parse(data);

// Safe parse (returns result object)
const result = FarmerSchema.safeParse(data);
if (result.success) {
  const farmer = result.data;
} else {
  console.error(result.error);
}
```

## Collections

### Farmers
- **Purpose**: Store farmer registration and profile data
- **Key Fields**: phone (unique), passwordHash, name, location, language
- **Indexes**: phone, location (division, district, upazila)

### Crop Batches
- **Purpose**: Track crops from planting to harvest
- **Key Fields**: farmerId, cropType, stage, weights, dates, storage
- **Indexes**: farmerId + stage, storage location

### Health Scans
- **Purpose**: Record disease detection scans
- **Key Fields**: farmerId, batchId, diseaseLabel, confidence, status
- **Indexes**: farmerId + capturedAt, batchId, status

### Loss Events
- **Purpose**: Track crop loss incidents
- **Key Fields**: farmerId, batchId, eventType, lossPercentage, lossWeightKg
- **Indexes**: farmerId + reportedAt, batchId

### Interventions
- **Purpose**: Record actions taken on crops
- **Key Fields**: farmerId, batchId, interventionType, success
- **Indexes**: farmerId + performedAt, batchId, success

### Advisories
- **Purpose**: Store notifications and recommendations
- **Key Fields**: farmerId (optional for broadcast), source, payload, status
- **Indexes**: farmerId + status + createdAt, source + createdAt

### Sessions
- **Purpose**: Manage authentication sessions
- **Key Fields**: farmerId, authType, expiresAt
- **Indexes**: farmerId + expiresAt, expiresAt (TTL)

### Weather Snapshots
- **Purpose**: Cache weather data for analytics (optional)
- **Key Fields**: location (division, district, upazila), payload, capturedAt
- **Indexes**: location + capturedAt, capturedAt (TTL)

## Validation Rules

### Phone Numbers
- Format: `+880XXXXXXXXXX` (Bangladesh format)
- Must be exactly 13 characters

### Weights
- Must be positive numbers
- Loss percentage: 0-100

### Confidence Scores
- Range: 0-100

### Dates
- Automatically set to current date for timestamp fields
- Can be explicitly provided for historical data

### ObjectIds
- Validated using custom Zod schema
- Must be valid MongoDB ObjectId instances

## Testing

Run schema validation tests:
```bash
npm test server/db/schemas/index.test.ts
```
