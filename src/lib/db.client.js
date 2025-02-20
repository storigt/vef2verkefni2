import pg from 'pg';
import { environment } from './environment.js';
import { logger as loggerSingleton } from './logger.js';

/**
 * Database class.
 */
export class Database {
  constructor(connectionString, logger) {
    this.connectionString = connectionString;
    this.logger = logger;
    this.pool = null;
  }

  open() {
    if (this.pool) {
      return;
    }

    console.log('🔍 Initializing database connection...');
    this.pool = new pg.Pool({ connectionString: this.connectionString });

    this.pool.on('error', (err) => {
      this.logger.error('Database connection error', err);
      this.close();
    });
  }

  async close() {
    if (!this.pool) {
      this.logger.error('Attempted to close an unopened database connection');
      return false;
    }

    try {
      await this.pool.end();
      return true;
    } catch (e) {
      this.logger.error('Error closing database connection', e);
      return false;
    } finally {
      this.pool = null;
    }
  }

  async connect() {
    if (!this.pool) {
      this.logger.error('Database connection is not open');
      return null;
    }

    try {
      return await this.pool.connect();
    } catch (e) {
      this.logger.error('Error connecting to database', e);
      return null;
    }
  }

  async query(query, values = []) {
    const client = await this.connect();

    if (!client) {
      this.logger.error('Query failed: Database connection is unavailable');
      return null;
    }

    try {
      return await client.query(query, values);
    } catch (e) {
      this.logger.error('Error running query', e);
      return null;
    } finally {
      client.release();
    }
  }
}

let db = null;

export function getDatabase() {
  if (db) {
    return db;
  }

  const env = environment(process.env, loggerSingleton);
  if (!env || !env.connectionString) {
    loggerSingleton.error('Missing or invalid database connection string');
    return null;
  }

  db = new Database(env.connectionString, loggerSingleton);
  db.open();

  return db;
}
