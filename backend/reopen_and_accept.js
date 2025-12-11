
const { pool } = require('./src/config/database');

async function run() {
  const courseId = 199;
  try {
    // 1. Reopen Course
    console.log(`Reopening course ${courseId}...`);
    await pool.execute("UPDATE evento SET ESTADO = 'EN CURSO' WHERE SECUENCIAL = ?", [courseId]);
    console.log('✅ Course reopened.');

    // 2. Find UTA student in this course
    const [students] = await pool.execute(`
      SELECT i.SECUENCIAL as INSCRIPCION_ID, u.CORREO, u.NOMBRES
      FROM inscripcion i
      JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
      WHERE i.SECUENCIALEVENTO = ? AND u.CORREO LIKE '%@uta%'
      LIMIT 1
    `, [courseId]);

    if (students.length > 0) {
      const student = students[0];
      console.log(`Found UTA student: ${student.NOMBRES} (${student.CORREO})`);
      
      // 3. Update status to ACE
      await pool.execute("UPDATE inscripcion SET CODIGOESTADOINSCRIPCION = 'ACE' WHERE SECUENCIAL = ?", [student.INSCRIPCION_ID]);
      console.log(`✅ Student ${student.CORREO} status set to 'ACE'.`);
    } else {
      console.log('⚠️ No student with @uta email found in this course.');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
