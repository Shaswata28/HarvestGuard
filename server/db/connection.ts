import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

// Only validate environment variables when actually connecting
// This allows the module to be imported during build time without failing
function validateEnvVars() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!MONGODB_DB_NAME) {
    throw new Error('MONGODB_DB_NAME environment variable is not defined');
  }
}

/**
 * Connects to MongoDB Atlas with connection pooling and retry logic
 * @param maxRetries Maximum number of connection attempts
 * @param retryDelayMs Delay between retry attempts in milliseconds
 * @returns Promise<Db> MongoDB database instance
 */
export async function connectToDatabase(
  maxRetries: number = 3,
  retryDelayMs: number = 2000
): Promise<Db> {
  // Validate environment variables before attempting connection
  validateEnvVars();
  
  if (db) {
    return db;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${maxRetries}...`);

      client = new MongoClient(MONGODB_URI!, {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await client.connect();
      
      // Verify connection
      await client.db('admin').command({ ping: 1 });
      
      db = client.db(MONGODB_DB_NAME);
      
      console.log(`[MongoDB] Successfully connected to database: ${MONGODB_DB_NAME}`);
      return db;
    } catch (error) {
      lastError = error as Error;
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error);

      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          console.error('[MongoDB] Error closing failed connection:', closeError);
        }
        client = null;
      }

      if (attempt < maxRetries) {
        console.log(`[MongoDB] Retrying in ${retryDelayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        // Exponential backoff
        retryDelayMs *= 2;
      }
    }
  }

  const errorMessage = `Failed to connect to MongoDB after ${maxRetries} attempts`;
  console.error(`[MongoDB] ${errorMessage}`, lastError);
  throw new Error(`${errorMessage}: ${lastError?.message}`);
}

/**
 * Gets the current database instance
 * @throws Error if database is not connected
 * @returns Db MongoDB database instance
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Closes the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    console.log('[MongoDB] Closing database connection...');
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Database connection closed');
  }
}

/**
 * Handles graceful shutdown
 */
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});
