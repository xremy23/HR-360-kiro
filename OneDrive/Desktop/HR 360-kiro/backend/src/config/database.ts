import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let poolInitialized = false;

function createPool() {
  return new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'emergency_app',
    connectionTimeoutMillis: 5000, // 5 second timeout for connections
    idleTimeoutMillis: 30000,
    max: 20,
  });
}

function getPool(): Pool {
  if (!pool) {
    pool = createPool();
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const p = getPool();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}

export async function initializeDatabase(): Promise<void> {
  // Don't actually try to connect - just mark as initialized
  // Database connections will be lazy-loaded when needed
  poolInitialized = true;
  console.log('Database initialized (lazy connection mode)');
}

export default {
  getPool,
  query,
  getClient,
  initializeDatabase,
};
