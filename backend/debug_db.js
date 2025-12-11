
const { pool } = require('./src/config/database');

async function debugInscripciones() {
  try {
    const [rows] = await pool.execute('SELECT SECUENCIAL, SECUENCIALEVENTO, SECUENCIALUSUARIO, CODIGOESTADOINSCRIPCION FROM inscripcion LIMIT 50');
    console.log('--- INSCRIPCIONES (First 50) ---');
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debugInscripciones();
