import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { WeatherSnapshotsRepository } from './weatherSnapshots.repository';
import { WeatherSnapshot } from '../schemas';

describe('WeatherSnapshotsRepository', () => {
  let repository: WeatherSnapshotsRepository;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new WeatherSnapshotsRepository(db);
    await repository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up the collection before each test
    await repository['collection'].deleteMany({});
  });

  describe('saveSnapshot', () => {
    it('should save a weather snapshot with valid data', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3600 * 1000); // 1 hour from now

      const snapshotData: Omit<WeatherSnapshot, '_id'> = {
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103] // [lon, lat] for Dhaka
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: now,
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 1
      };

      const created = await repository.saveSnapshot(snapshotData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.location.coordinates).toEqual([90.4125, 23.8103]);
      expect(created.temperature).toBe(28);
      expect(created.humidity).toBe(75);
    });

    it('should auto-generate fetchedAt if not provided', async () => {
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      const snapshotData = {
        location: {
          type: 'Point' as const,
          coordinates: [91.7832, 22.3569] as [number, number]
        },
        temperature: 30,
        feelsLike: 32,
        humidity: 80,
        pressure: 1010,
        windSpeed: 5,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 8000,
        cloudiness: 20,
        sunrise: new Date(),
        sunset: new Date(),
        expiresAt: expiresAt
      };

      const before = Date.now();
      const created = await repository.saveSnapshot(snapshotData);
      const after = Date.now();

      expect(created.fetchedAt).toBeInstanceOf(Date);
      expect(created.fetchedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(created.fetchedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('should reject snapshot with missing required fields', async () => {
      const invalidData = {
        location: {
          type: 'Point' as const,
          coordinates: [90.4125, 23.8103] as [number, number]
        },
        temperature: 25
        // Missing many required fields
      };

      await expect(repository.saveSnapshot(invalidData as any)).rejects.toThrow();
    });
  });

  describe('findByLocation', () => {
    beforeEach(async () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600 * 1000);
      
      // Create test data at different locations
      const snapshots = [
        {
          location: {
            type: 'Point' as const,
            coordinates: [90.41, 23.81] as [number, number] // Dhaka (rounded)
          },
          temperature: 28,
          feelsLike: 30,
          humidity: 75,
          pressure: 1013,
          windSpeed: 10,
          windDirection: 180,
          rainfall: 0,
          weatherCondition: 'Clear',
          weatherDescription: 'clear sky',
          weatherIcon: '01d',
          visibility: 10000,
          cloudiness: 0,
          sunrise: new Date(),
          sunset: new Date(),
          fetchedAt: new Date(now.getTime() - 1800 * 1000), // 30 min ago
          expiresAt: oneHourLater,
          source: 'openweathermap',
          apiCallCount: 1
        },
        {
          location: {
            type: 'Point' as const,
            coordinates: [91.78, 22.36] as [number, number] // Chittagong (rounded)
          },
          temperature: 32,
          feelsLike: 34,
          humidity: 80,
          pressure: 1010,
          windSpeed: 5,
          windDirection: 90,
          rainfall: 0,
          weatherCondition: 'Clouds',
          weatherDescription: 'few clouds',
          weatherIcon: '02d',
          visibility: 8000,
          cloudiness: 20,
          sunrise: new Date(),
          sunset: new Date(),
          fetchedAt: new Date(now.getTime() - 1800 * 1000), // 30 min ago
          expiresAt: oneHourLater,
          source: 'openweathermap',
          apiCallCount: 1
        }
      ];

      for (const snapshot of snapshots) {
        await repository.saveSnapshot(snapshot);
      }
    });

    it('should find cached snapshot for a location within maxAge', async () => {
      const result = await repository.findByLocation(23.8103, 90.4125, 3600);

      expect(result).not.toBeNull();
      expect(result!.temperature).toBe(28);
      expect(result!.location.coordinates[0]).toBeCloseTo(90.41, 2);
      expect(result!.location.coordinates[1]).toBeCloseTo(23.81, 2);
    });

    it('should return null for location with no nearby snapshots', async () => {
      const result = await repository.findByLocation(24.8949, 91.8687, 3600); // Sylhet

      expect(result).toBeNull();
    });

    it('should return null when cached data is older than maxAge', async () => {
      const result = await repository.findByLocation(23.8103, 90.4125, 60); // 1 minute maxAge

      expect(result).toBeNull();
    });

    it('should return null when cached data has expired', async () => {
      const now = new Date();
      const pastExpiry = new Date(now.getTime() - 1000); // Expired 1 second ago
      
      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.50, 23.90] as [number, number]
        },
        temperature: 25,
        feelsLike: 27,
        humidity: 70,
        pressure: 1015,
        windSpeed: 8,
        windDirection: 270,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(now.getTime() - 1800 * 1000),
        expiresAt: pastExpiry,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const result = await repository.findByLocation(23.90, 90.50, 3600);

      expect(result).toBeNull();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired snapshots', async () => {
      const now = new Date();
      const pastExpiry = new Date(now.getTime() - 1000); // Expired
      const futureExpiry = new Date(now.getTime() + 3600 * 1000); // Not expired

      // Create expired snapshot
      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: now,
        expiresAt: pastExpiry,
        source: 'openweathermap',
        apiCallCount: 1
      });

      // Create non-expired snapshot
      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [91.78, 22.36] as [number, number]
        },
        temperature: 30,
        feelsLike: 32,
        humidity: 80,
        pressure: 1010,
        windSpeed: 5,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 8000,
        cloudiness: 20,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: now,
        expiresAt: futureExpiry,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(1);
      
      const remaining = await repository.count({});
      expect(remaining).toBe(1);
    });

    it('should return 0 when no expired snapshots exist', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000);

      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(),
        expiresAt: futureExpiry,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const expiresAt = new Date(now.getTime() + 3600 * 1000);

      // Create snapshots with different API call counts
      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(now.getTime() - 3600 * 1000),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 2
      });

      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [91.78, 22.36] as [number, number]
        },
        temperature: 30,
        feelsLike: 32,
        humidity: 80,
        pressure: 1010,
        windSpeed: 5,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 8000,
        cloudiness: 20,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(now.getTime() - 1800 * 1000),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 3
      });

      const stats = await repository.getUsageStats(oneDayAgo);

      expect(stats.totalCalls).toBe(5); // 2 + 3
      expect(stats.cacheMisses).toBe(2);
      expect(stats.cacheHits).toBe(0);
      expect(stats.oldestSnapshot).toBeInstanceOf(Date);
      expect(stats.newestSnapshot).toBeInstanceOf(Date);
    });

    it('should return empty stats when no snapshots exist', async () => {
      const stats = await repository.getUsageStats();

      expect(stats.totalCalls).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.oldestSnapshot).toBeNull();
      expect(stats.newestSnapshot).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a snapshot by ID', async () => {
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      const created = await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const found = await repository.findById(created._id!);

      expect(found).not.toBeNull();
      expect(found!._id).toEqual(created._id);
      expect(found!.temperature).toBe(28);
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = new ObjectId();
      const found = await repository.findById(fakeId);

      expect(found).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete a snapshot by ID', async () => {
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      const created = await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const deleted = await repository.deleteById(created._id!);
      expect(deleted).toBe(true);

      const found = await repository.findById(created._id!);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent snapshot', async () => {
      const fakeId = new ObjectId();
      const deleted = await repository.deleteById(fakeId);

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all snapshots', async () => {
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      
      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [90.41, 23.81] as [number, number]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 1
      });

      await repository.saveSnapshot({
        location: {
          type: 'Point' as const,
          coordinates: [91.78, 22.36] as [number, number]
        },
        temperature: 30,
        feelsLike: 32,
        humidity: 80,
        pressure: 1010,
        windSpeed: 5,
        windDirection: 90,
        rainfall: 0,
        weatherCondition: 'Clouds',
        weatherDescription: 'few clouds',
        weatherIcon: '02d',
        visibility: 8000,
        cloudiness: 20,
        sunrise: new Date(),
        sunset: new Date(),
        fetchedAt: new Date(),
        expiresAt: expiresAt,
        source: 'openweathermap',
        apiCallCount: 1
      });

      const count = await repository.count({});
      expect(count).toBe(2);
    });
  });
});
