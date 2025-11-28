import { Collection, Db, Filter, FindOptions, ObjectId, OptionalId, UpdateFilter } from 'mongodb';
import { ZodSchema, ZodError } from 'zod';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  handleZodError,
  handleDatabaseError,
  logError
} from '../../utils/errors';

/**
 * Base repository interface defining CRUD operations
 */
export interface IBaseRepository<T> {
  create(data: OptionalId<T>): Promise<T>;
  findById(id: ObjectId): Promise<T | null>;
  findOne(filter: Filter<T>): Promise<T | null>;
  findMany(filter: Filter<T>, options?: FindOptions): Promise<T[]>;
  updateById(id: ObjectId, update: Partial<T>): Promise<T | null>;
  deleteById(id: ObjectId): Promise<boolean>;
  count(filter: Filter<T>): Promise<number>;
}

/**
 * Base repository class with common CRUD operations and validation
 */
export class BaseRepository<T extends { _id?: ObjectId }> implements IBaseRepository<T> {
  protected collection: Collection<T>;
  protected schema: ZodSchema<T>;
  protected collectionName: string;

  constructor(db: Db, collectionName: string, schema: ZodSchema<T>) {
    this.collection = db.collection<T>(collectionName);
    this.schema = schema;
    this.collectionName = collectionName;
  }

  /**
   * Validates data against the schema
   * @throws ValidationError if validation fails
   */
  protected validate(data: any): T {
    try {
      return this.schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw handleZodError(error);
      }
      throw error;
    }
  }

  /**
   * Validates partial data for updates
   * @throws ValidationError if validation fails
   */
  protected validatePartial(data: any): Partial<T> {
    try {
      // Use Zod's partial() method to make all fields optional for validation
      // This allows updating individual fields without requiring all required fields
      const partialSchema = this.schema.partial();
      const validated = partialSchema.parse(data);
      
      // Return only the fields that were provided in the input
      // This prevents adding undefined values for fields not in the update
      const result: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          result[key] = validated[key];
        }
      }
      
      return result as Partial<T>;
    } catch (error) {
      if (error instanceof ZodError) {
        throw handleZodError(error);
      }
      throw error;
    }
  }

  /**
   * Creates a new document in the collection
   */
  async create(data: OptionalId<T>): Promise<T> {
    try {
      // Validate the data (this applies defaults from Zod schema)
      const validatedData = this.validate(data);

      // Remove _id to let MongoDB generate it
      const { _id, ...rest } = validatedData as any;
      const inputData = data as any;
      const dataToInsert: any = {};
      
      // Process each field from validated data
      for (const key in rest) {
        if (rest.hasOwnProperty(key)) {
          const value = rest[key];
          
          // If field was explicitly set to undefined in input, store as null (for nullable fields)
          if (inputData.hasOwnProperty(key) && inputData[key] === undefined && value === undefined) {
            dataToInsert[key] = null;
          }
          // Otherwise, include all non-undefined values (including defaults from Zod)
          else if (value !== undefined) {
            dataToInsert[key] = value;
          }
        }
      }
      
      // Insert into database
      const result = await this.collection.insertOne(dataToInsert as OptionalId<T>);

      // Retrieve and return the created document
      const created = await this.collection.findOne({ _id: result.insertedId } as Filter<T>);
      
      if (!created) {
        throw new DatabaseError(`Failed to retrieve created document ${result.insertedId}`);
      }

      return created as T;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error as Error, `${this.collectionName}.create`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds a document by ID
   */
  async findById(id: ObjectId): Promise<T | null> {
    try {
      const document = await this.collection.findOne({ _id: id } as Filter<T>);
      return document as T | null;
    } catch (error) {
      logError(error as Error, `${this.collectionName}.findById`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds a single document matching the filter
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    try {
      const document = await this.collection.findOne(filter);
      return document as T | null;
    } catch (error) {
      logError(error as Error, `${this.collectionName}.findOne`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds multiple documents matching the filter
   */
  async findMany(filter: Filter<T>, options?: FindOptions): Promise<T[]> {
    try {
      const documents = await this.collection.find(filter, options).toArray();
      return documents as T[];
    } catch (error) {
      logError(error as Error, `${this.collectionName}.findMany`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Updates a document by ID
   */
  async updateById(id: ObjectId, update: Partial<T>): Promise<T | null> {
    try {
      // Validate the update data
      const validatedUpdate = this.validatePartial(update);

      // Remove _id from update to prevent modification
      const { _id, ...updateData } = validatedUpdate as any;

      // Update the document
      const result = await this.collection.findOneAndUpdate(
        { _id: id } as Filter<T>,
        { $set: updateData } as UpdateFilter<T>,
        { returnDocument: 'after' }
      );

      return result as T | null;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error as Error, `${this.collectionName}.updateById`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Deletes a document by ID
   */
  async deleteById(id: ObjectId): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ _id: id } as Filter<T>);
      return result.deletedCount > 0;
    } catch (error) {
      logError(error as Error, `${this.collectionName}.deleteById`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Counts documents matching the filter
   */
  async count(filter: Filter<T>): Promise<number> {
    try {
      return await this.collection.countDocuments(filter);
    } catch (error) {
      logError(error as Error, `${this.collectionName}.count`);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the collection
   * Should be overridden by specific repositories
   */
  async createIndexes(): Promise<void> {
    // Override in specific repositories
  }
}
