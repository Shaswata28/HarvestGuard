import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { Session, SessionSchema } from '../schemas';
import { handleDatabaseError, logError } from '../../utils/errors';

/**
 * Repository for managing session documents
 */
export class SessionsRepository extends BaseRepository<Session> {
  constructor(db: Db) {
    super(db, 'sessions', SessionSchema);
  }

  /**
   * Finds all sessions for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to an array of sessions
   */
  async findByFarmerId(farmerId: ObjectId): Promise<Session[]> {
    try {
      return await this.findMany(
        { farmerId } as Filter<Session>,
        { sort: { createdAt: -1 } }
      );
    } catch (error) {
      logError(error as Error, 'SessionsRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Validates if a session is still valid (not expired)
   * @param sessionId - The session's ObjectId
   * @returns Promise resolving to true if valid, false if expired or not found
   */
  async validateSession(sessionId: ObjectId): Promise<boolean> {
    try {
      const session = await this.findById(sessionId);
      
      if (!session) {
        return false;
      }

      // Check if session has expired
      const now = new Date();
      return session.expiresAt > now;
    } catch (error) {
      logError(error as Error, 'SessionsRepository.validateSession');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Deletes all expired sessions
   * @returns Promise resolving to the number of deleted sessions
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.collection.deleteMany({
        expiresAt: { $lt: now }
      } as Filter<Session>);

      return result.deletedCount;
    } catch (error) {
      logError(error as Error, 'SessionsRepository.deleteExpired');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the sessions collection
   * - Compound index on (farmerId, expiresAt) for efficient farmer session queries
   * - TTL index on expiresAt for automatic cleanup of expired sessions
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId and expiresAt
      await this.collection.createIndex(
        { farmerId: 1, expiresAt: 1 },
        { name: 'farmerId_expiresAt_index' }
      );

      // TTL index on expiresAt for automatic cleanup
      // MongoDB will automatically delete documents when expiresAt is reached
      await this.collection.createIndex(
        { expiresAt: 1 },
        { 
          expireAfterSeconds: 0,
          name: 'expiresAt_ttl_index'
        }
      );

      console.log('✓ Sessions collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'SessionsRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
