
const { pool } = require('./src/config/database');

async function checkStatus() {
  try {
    const courseId = 199;
    const [rows] = await pool.execute('SELECT SECUENCIAL, TITULO, ESTADO FROM evento WHERE SECUENCIAL = ?', [courseId]);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkStatus();
