# Base Repository Pattern

This directory contains the base repository implementation and specific repository classes for MongoDB collections.

## Overview

The base repository pattern provides a consistent interface for CRUD operations across all collections, with built-in validation using Zod schemas and comprehensive error handling.

## Base Repository

The `BaseRepository` class provides the following features:

### CRUD Operations

- `create(data)` - Create a new document with validation
- `findById(id)` - Find a document by ObjectId
- `findOne(filter)` - Find a single document matching a filter
- `findMany(filter, options)` - Find multiple documents with optional sorting/pagination
- `updateById(id, update)` - Update a document by ID with validation
- `deleteById(id)` - Delete a document by ID
- `count(filter)` - Count documents matching a filter

### Validation

All create and update operations automatically validate data against the Zod schema:

- Full validation on create (all required fields must be present)
- Partial validation on update (only provided fields are validated)
- Descriptive error messages with field-level details

### Error Handling

The repository automatically handles and transforms errors:

- **ValidationError** (400) - Schema validation failures
- **ConflictError** (409) - Unique constraint violations (e.g., duplicate phone)
- **DatabaseError** (500) - General database operation failures
- **NotFoundError** (404) - Document not found (handled by caller)

All errors include:
- Error type
- Descriptive message
- Additional details (e.g., which field caused a unique constraint violation)
- Timestamp

## Usage Example

```typescript
import { getDatabase } from '../connection';
import { BaseRepository } from './base.repository';
import { FarmerSchema, Farmer } from '../schemas';

// Create a repository instance
const db = getDatabase();
const farmersRepo = new BaseRepository<Farmer>(db, 'farmers', FarmerSchema);

// Create a document
try {
  const farmer = await farmersRepo.create({
    phone: '+8801234567890',
    passwordHash: 'hashed_password',
    name: 'John Doe',
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    language: 'bn'
  });
  console.log('Created farmer:', farmer._id);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details);
  } else if (error instanceof ConflictError) {
    console.error('Duplicate phone number:', error.details);
  }
}

// Find documents
const farmer = await farmersRepo.findById(farmerId);
const farmers = await farmersRepo.findMany({ division: 'Dhaka' });

// Update a document
const updated = await farmersRepo.updateById(farmerId, { name: 'Jane Doe' });

// Delete a document
const deleted = await farmersRepo.deleteById(farmerId);
```

## Extending the Base Repository

Specific repositories can extend `BaseRepository` to add custom methods:

```typescript
export class FarmersRepository extends BaseRepository<Farmer> {
  constructor(db: Db) {
    super(db, 'farmers', FarmerSchema);
  }

  async findByPhone(phone: string): Promise<Farmer | null> {
    return this.findOne({ phone } as Filter<Farmer>);
  }

  async createIndexes(): Promise<void> {
    await this.collection.createIndex({ phone: 1 }, { unique: true });
    await this.collection.createIndex({ division: 1, district: 1, upazila: 1 });
  }
}
```

## Error Utilities

The `server/utils/errors.ts` module provides:

- **Error Classes**: `ValidationError`, `ConflictError`, `DatabaseError`, `NotFoundError`, `AuthenticationError`
- **Error Handlers**: `handleZodError()`, `handleDatabaseError()`
- **Error Formatting**: `formatErrorResponse()` for consistent API responses
- **Logging**: `logError()` for structured error logging

## Testing

All repository implementations should include unit tests covering:

1. CRUD operations with valid data
2. Validation error handling
3. Constraint violation handling
4. Edge cases (non-existent IDs, empty results, etc.)

See `base.repository.test.ts` for examples.
