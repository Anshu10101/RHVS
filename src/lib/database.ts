import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rhvs_portfolio',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Optional SSL for hosts that require it (set DB_SSL=true in env)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery(query: string, params: unknown[] = [], attempt: number = 1): Promise<unknown> {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error: unknown) {
    const transient = (error as { code?: string; fatal?: boolean }).code === 'ECONNRESET' || (error as { code?: string; fatal?: boolean }).code === 'PROTOCOL_CONNECTION_LOST' || (error as { code?: string; fatal?: boolean }).fatal;
    if (transient && attempt < 3) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
      return executeQuery(query, params, attempt + 1);
    }
    console.error('Database query error:', error);
    throw error;
  }
}

// Get connection from pool
export async function getConnection() {
  return await pool.getConnection();
}

// Close all connections
export async function closePool() {
  await pool.end();
}

export default pool;
