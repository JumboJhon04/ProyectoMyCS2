const mysql = require('mysql2/promise');
require('dotenv').config();

// Construir configuración desde DATABASE_URL si está presente, si no usar DB_*
let dbConfig = {};

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: parsed.hostname,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
      port: parsed.port ? parseInt(parsed.port, 10) : undefined
    };
  } catch (err) {
    console.warn('WARNING: Error parsing DATABASE_URL, falling back to DB_* env vars', err.message);
  }
}

// Fallback to individual DB_* env vars for any missing values
dbConfig = {
  host: dbConfig.host || process.env.DB_HOST || 'localhost',
  user: dbConfig.user || process.env.DB_USER || 'root',
  password: dbConfig.password || process.env.DB_PASSWORD || '',
  database: dbConfig.database || process.env.DB_NAME || 'uta_fisei_eventosconfig',
  port: dbConfig.port || (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Configuración de la conexión a MySQL
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };