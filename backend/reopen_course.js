
const { pool } = require('./src/config/database');

async function reopenCourse() {
  try {
    const courseId = 199;
    const newStatus = 'EN CURSO'; // Or 'ACTIVO', depending on what the default active state is. Assuming 'EN CURSO' is appropriate for a running course.

    console.log(`Reopening course ${courseId}...`);

    const [result] = await pool.execute(
      'UPDATE evento SET ESTADO = ? WHERE SECUENCIAL = ?',
      [newStatus, courseId]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Course ${courseId} updated to '${newStatus}'.`);
    } else {
      console.log(`❌ Course ${courseId} not found or not updated.`);
    }

    // Verify
    const [rows] = await pool.execute('SELECT SECUENCIAL, TITULO, ESTADO FROM evento WHERE SECUENCIAL = ?', [courseId]);
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

reopenCourse();
