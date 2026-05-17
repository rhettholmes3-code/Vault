import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
const DB_NAME = 'vault.db';

/**
 * Returns the active SQLite database singleton instance, opening it if necessary.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initializes the database structure by running schema definition queries.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Dynamically import the schema query to keep startup execution lightweight
    const { CREATE_TABLES_SCHEMA } = await import('./schema');
    
    // Execute tables schema
    await db.execAsync(CREATE_TABLES_SCHEMA);
    console.log('[SQLite] Database connection initialized and schemas applied successfully.');
  } catch (error) {
    console.error('[SQLite] Failed to initialize SQLite database:', error);
    throw error;
  }
}
