const { pool } = require('./database');

async function initDB() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🔄 Checking database schema...');

    // Add NOTA column if not exists
    await connection.execute(`
      SELECT count(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'inscripcion'
      AND COLUMN_NAME = 'NOTA'
    `).then(async ([rows]) => {
      if (rows[0]['count(*)'] === 0) {
        console.log('➕ Adding NOTA column to inscripcion table...');
        await connection.execute(`
          ALTER TABLE inscripcion 
          ADD COLUMN NOTA DECIMAL(4,2) DEFAULT 0
        `);
      }
    });

    // Add ASISTENCIA column if not exists
    await connection.execute(`
      SELECT count(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'inscripcion'
      AND COLUMN_NAME = 'ASISTENCIA'
    `).then(async ([rows]) => {
      if (rows[0]['count(*)'] === 0) {
        console.log('➕ Adding ASISTENCIA column to inscripcion table...');
        await connection.execute(`
          ALTER TABLE inscripcion 
          ADD COLUMN ASISTENCIA INT DEFAULT 0
        `);
      }
    });

    console.log('✅ Database schema check completed.');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initDB };
