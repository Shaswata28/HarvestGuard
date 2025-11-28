import { Db, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { WeatherSnapshot, WeatherSnapshotSchema } from '../schemas';
import { handleDatabaseError, logError } from '../../utils/errors';

export interface UsageStats {
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  oldestSnapshot: Date | null;
  newestSnapshot: Date | null;
}

/**
 * Repository for managing weather snapshot documents with caching support
 */
export class WeatherSnapshotsRepository extends BaseRepository<WeatherSnapshot> {
  constructor(db: Db) {
    super(db, 'weather_snapshots', WeatherSnapshotSchema);
  }

  /**
   * Finds cached weather data by location coordinates using geospatial query
   * @param lat - Latitude
   * @param lon - Longitude
   * @param maxAge - Maximum age in seconds (default: 3600 = 1 hour)
   * @returns Promise resolving to cached weather snapshot or null
   */
  async findByLocation(
    lat: number,
    lon: number,
    maxAge: number = 3600
  ): Promise<WeatherSnapshot | null> {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - maxAge * 1000);

      // Round coordinates to 2 decimal places for cache key
      const roundedLat = Math.round(lat * 100) / 100;
      const roundedLon = Math.round(lon * 100) / 100;

      // Find weather snapshot near the location that hasn't expired
      const snapshot = await this.collection.findOne({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [roundedLon, roundedLat]
            },
            $maxDistance: 1000 // 1km radius
          }
        },
        fetchedAt: { $gte: cutoffTime },
        expiresAt: { $gt: now }
      } as Filter<WeatherSnapshot>);

      return snapshot as WeatherSnapshot | null;
    } catch (error) {
      logError(error as Error, 'WeatherSnapshotsRepository.findByLocation');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Saves a weather snapshot to the cache
   * @param data - Weather snapshot data
   * @returns Promise resolving to the created snapshot
   */
  async saveSnapshot(data: Omit<WeatherSnapshot, '_id'>): Promise<WeatherSnapshot> {
    try {
      return await this.create(data);
    } catch (error) {
      logError(error as Error, 'WeatherSnapshotsRepository.saveSnapshot');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Deletes expired weather snapshots
   * @returns Promise resolving to the number of deleted documents
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.collection.deleteMany({
        expiresAt: { $lte: now }
      } as Filter<WeatherSnapshot>);

      return result.deletedCount;
    } catch (error) {
      logError(error as Error, 'WeatherSnapshotsRepository.deleteExpired');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Gets API usage statistics for monitoring
   * @param since - Start date for statistics (default: 24 hours ago)
   * @returns Promise resolving to usage statistics
   */
  async getUsageStats(since?: Date): Promise<UsageStats> {
    try {
      const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000);

      const snapshots = await this.findMany(
        { fetchedAt: { $gte: sinceDate } } as Filter<WeatherSnapshot>,
        { sort: { fetchedAt: 1 } }
      );

      const totalCalls = snapshots.reduce((sum, s) => sum + (s.apiCallCount || 1), 0);
      const cacheMisses = snapshots.length;
      
      // Estimate cache hits (this is approximate - actual hits would need separate tracking)
      // For now, we'll return 0 as cache hits are not directly tracked in snapshots
      const cacheHits = 0;

      return {
        totalCalls,
        cacheHits,
        cacheMisses,
        oldestSnapshot: snapshots.length > 0 ? snapshots[0].fetchedAt : null,
        newestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].fetchedAt : null
      };
    } catch (error) {
      logError(error as Error, 'WeatherSnapshotsRepository.getUsageStats');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the weather_snapshots collection
   * - 2dsphere index on location for geospatial queries
   * - TTL index on expiresAt for automatic cleanup
   * - Compound index on location and fetchedAt for performance
   */
  async createIndexes(): Promise<void> {
    try {
      // 2dsphere index for geospatial queries
      await this.collection.createIndex(
        { location: '2dsphere' },
        { name: 'location_2dsphere_index' }
      );

      // TTL index for automatic expiration
      await this.collection.createIndex(
        { expiresAt: 1 },
        { 
          expireAfterSeconds: 0,
          name: 'expiresAt_ttl_index'
        }
      );

      // Compound index for fetchedAt queries
      await this.collection.createIndex(
        { fetchedAt: -1 },
        { name: 'fetchedAt_index' }
      );

      console.log('✓ Weather snapshots collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'WeatherSnapshotsRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
