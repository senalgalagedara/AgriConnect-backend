import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { DatabaseConnection, QueryResult } from '..';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agriconnect',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait for a connection
});

// Export query function with logging
const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { text, duration, error });
    throw error;
  }
};

// Export function to get a client for transactions
const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Graceful shutdown
const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
};

// Export graceful shutdown function but don't auto-attach to process events

const database: DatabaseConnection = {
  query,
  getClient,
};

export default database;
export { query, getClient, closePool };