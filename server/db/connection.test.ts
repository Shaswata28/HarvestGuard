import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectToDatabase, getDatabase, closeDatabase } from './connection';

describe('MongoDB Connection', () => {
  beforeAll(async () => {
    // Connect to database before running tests
    await connectToDatabase();
  });

  afterAll(async () => {
    // Close connection after all tests
    await closeDatabase();
  });

  it('should successfully connect to MongoDB', async () => {
    const db = getDatabase();
    expect(db).toBeDefined();
    expect(db.databaseName).toBe(process.env.MONGODB_DB_NAME);
  });

  it('should be able to ping the database', async () => {
    const db = getDatabase();
    const result = await db.admin().ping();
    expect(result).toEqual({ ok: 1 });
  });

  it('should throw error when getting database before connection', async () => {
    // Close the connection first
    await closeDatabase();
    
    expect(() => getDatabase()).toThrow('Database not connected');
    
    // Reconnect for other tests
    await connectToDatabase();
  });

  it('should handle connection pooling', async () => {
    const db = getDatabase();
    
    // Make multiple concurrent requests to test connection pooling
    const promises = Array.from({ length: 5 }, () => 
      db.admin().ping()
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result).toEqual({ ok: 1 });
    });
  });
});
