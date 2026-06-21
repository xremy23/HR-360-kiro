import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let poolInitialized = false;

function createPool() {
  // Check if we're using Cloud SQL with Unix socket
  const isCloudSQL = process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/');
  
  const poolConfig: any = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'emergency_app',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
  };

  if (isCloudSQL) {
    // Cloud SQL with Unix socket
    poolConfig.host = process.env.DB_HOST;
  } else {
    // Local or TCP connection
    poolConfig.host = process.env.DB_HOST || '127.0.0.1';
    poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  }

  return new Pool(poolConfig);
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
