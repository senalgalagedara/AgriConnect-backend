require('dotenv').config();  
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agriconnect',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait for a connection
});

// Export query function
const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params).then(res => {
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  });
};

// Export pool for transactions
const getClient = () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  pool
};