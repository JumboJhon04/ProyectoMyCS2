
const { pool } = require('./src/config/database');

async function checkEvents() {
  try {
    const [rows] = await pool.execute("SELECT SECUENCIAL, TITULO, ESTADO, Docente FROM evento WHERE TITULO LIKE '%SQL%'");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkEvents();
