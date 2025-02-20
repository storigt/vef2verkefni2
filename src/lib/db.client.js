import pg from 'pg';
import { environment } from './environment.js';
import { logger as loggerSingleton } from './logger.js';

/**
 * Database class.
 */
export class Database {
  /**
   * Create a new database connection.
   * @param {string} connectionString
   * @param {import('./logger.js').Logger} logger
   */
  constructor(connectionString, logger) {
    this.connectionString = connectionString;
    this.logger = logger;
  }

  /** @type {pg.Pool | null} */
  pool = null;

  open() {
    this.pool = new pg.Pool({ connectionString: this.connectionString });

    this.pool.on('error', (err) => {
      this.logger.error('error in database pool', err);
      this.close();
    });
  }

  /**
   * Close the database connection.
   * @returns {Promise<boolean>}
   */
  async close() {
    if (!this.pool) {
      this.logger.error('unable to close database connection that is not open');
      return false;
    }

    try {
      await this.pool.end();
      return true;
    } catch (e) {
      this.logger.error('error closing database pool', { error: e });
      return false;
    } finally {
      this.pool = null;
    }
  }

  /**
   * Connect to the database via the pool.
   * @returns {Promise<pg.PoolClient | null>}
   */
  async connect() {
    if (!this.pool) {
      this.logger.error('Reynt að nota gagnagrunn sem er ekki opinn');
      return null;
    }

    try {
      const client = await this.pool.connect();
      return client;
    } catch (e) {
      this.logger.error('error connecting to db', { error: e });
      return null;
    }
  }

  /**
   * Run a query on the database.
   * @param {string} query
   * @param {Array<string>} values
   * @returns {Promise<pg.QueryResult | null>}
   */
  async query(query, values = []) {
    const client = await this.connect();

    if (!client) {
      return null;
    }

    try {
      const result = await client.query(query, values);
      return result;
    } catch (e) {
      this.logger.error('Error running query', e);
      return null;
    } finally {
      client.release();
    }
  }
}

/** @type {Database | null} */
let db = null;

/**
 * Return a singleton database instance.
 * @returns {Database | null}
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  const env = environment(process.env, loggerSingleton);

  if (!env) {
    return null;
  }
  db = new Database(env.connectionString, loggerSingleton);
  db.open();

  return db;
}
