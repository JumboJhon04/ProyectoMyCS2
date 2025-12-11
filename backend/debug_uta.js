
const { pool } = require('./src/config/database');

async function findUtaStudents() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.SECUENCIALEVENTO,
        e.TITULO as EVENTO_TITULO,
        e.ESTADO as EVENTO_ESTADO,
        u.SECUENCIAL as USUARIO_ID,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        i.CODIGOESTADOINSCRIPCION
      FROM inscripcion i
      JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
      WHERE u.CORREO LIKE '%@uta%' 
      AND i.CODIGOESTADOINSCRIPCION = 'ACE'
    `);
    
    console.log('--- ESTUDIANTES UTA INSCRITOS (ACE) ---');
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findUtaStudents();
