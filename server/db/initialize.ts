import { getDatabase } from './connection';
import { FarmersRepository, CropBatchesRepository, HealthScansRepository, LossEventsRepository, InterventionsRepository, AdvisoriesRepository, SessionsRepository, WeatherSnapshotsRepository } from './repositories';

/**
 * Initializes all database indexes
 * Should be called after database connection is established
 */
export async function initializeIndexes(): Promise<void> {
  try {
    console.log('[Database] Creating indexes...');
    
    const db = getDatabase();
    
    // Initialize farmers repository indexes
    const farmersRepo = new FarmersRepository(db);
    await farmersRepo.createIndexes();
    
    // Initialize crop batches repository indexes
    const cropBatchesRepo = new CropBatchesRepository(db);
    await cropBatchesRepo.createIndexes();
    
    // Initialize health scans repository indexes
    const healthScansRepo = new HealthScansRepository(db);
    await healthScansRepo.createIndexes();
    
    // Initialize loss events repository indexes
    const lossEventsRepo = new LossEventsRepository(db);
    await lossEventsRepo.createIndexes();
    
    // Initialize interventions repository indexes
    const interventionsRepo = new InterventionsRepository(db);
    await interventionsRepo.createIndexes();
    
    // Initialize advisories repository indexes
    const advisoriesRepo = new AdvisoriesRepository(db);
    await advisoriesRepo.createIndexes();
    
    // Initialize sessions repository indexes
    const sessionsRepo = new SessionsRepository(db);
    await sessionsRepo.createIndexes();
    
    // Initialize weather snapshots repository indexes (optional)
    const weatherSnapshotsRepo = new WeatherSnapshotsRepository(db);
    await weatherSnapshotsRepo.createIndexes();
    
    console.log('[Database] All indexes created successfully');
  } catch (error) {
    console.error('[Database] Failed to create indexes:', error);
    throw error;
  }
}
