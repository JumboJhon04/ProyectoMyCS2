
const { pool } = require('./src/config/database');

async function showAccepted() {
  try {
    const courseId = 199;
    const [rows] = await pool.execute(`
      SELECT 
        u.SECUENCIAL as ID_USUARIO,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        i.CODIGOESTADOINSCRIPCION as ESTADO,
        i.FECHAINSCRIPCION
      FROM inscripcion i
      JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      WHERE i.SECUENCIALEVENTO = ? 
      AND i.CODIGOESTADOINSCRIPCION = 'ACE'
    `, [courseId]);

    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

showAccepted();
