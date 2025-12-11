
const { pool } = require('./src/config/database');

async function run() {
  const courseId = 199;
  try {
    // 1. Get Course Info (Docente)
    const [events] = await pool.execute('SELECT TITULO, Docente, ESTADO FROM evento WHERE SECUENCIAL = ?', [courseId]);
    if (events.length === 0) {
        console.log('Course not found');
        process.exit(1);
    }
    const course = events[0];
    const docenteId = course.Docente;
    console.log(`📘 Curso: ${course.TITULO}`);
    console.log(`👨‍🏫 Docente ID: ${docenteId}`);
    
    // 2. Reopen Course
    console.log(`🔓 Reopening course...`);
    await pool.execute("UPDATE evento SET ESTADO = 'EN CURSO' WHERE SECUENCIAL = ?", [courseId]);
    
    // 3. Get Enrollments (including teacher if they were enrolled, to check)
    // We use a raw query without the exclusion to see if they exist in DB
    const [allEnrollments] = await pool.execute(`
        SELECT i.SECUENCIAL as INSCRIPCION_ID, i.SECUENCIALUSUARIO, u.NOMBRES, u.APELLIDOS, i.CODIGOESTADOINSCRIPCION
        FROM inscripcion i
        JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
        WHERE i.SECUENCIALEVENTO = ? AND i.CODIGOESTADOINSCRIPCION = 'ACE'
    `, [courseId]);

    console.log(`👥 Total Inscritos (ACE): ${allEnrollments.length}`);
    
    const teacherEnrollment = allEnrollments.find(e => e.SECUENCIALUSUARIO === docenteId);
    if (teacherEnrollment) {
        console.warn(`⚠️ ALERTA: El docente (${teacherEnrollment.NOMBRES} ${teacherEnrollment.APELLIDOS}) ESTÁ inscrito como estudiante!`);
        // We will NOT update their grades, effectively ignoring them as requested
    } else {
        console.log(`✅ El docente NO está inscrito como estudiante.`);
    }

    // 4. Update Grades for Students (Excluding Teacher)
    console.log(`📝 Updating grades for students...`);
    for (const student of allEnrollments) {
        if (student.SECUENCIALUSUARIO === docenteId) {
            console.log(`   ⏭️ Skipping Docente: ${student.NOMBRES}`);
            continue;
        }

        console.log(`   ✅ Grading ${student.NOMBRES} ${student.APELLIDOS} (ID: ${student.SECUENCIALUSUARIO}) - Nota: 95, Asistencia: 100`);
        await pool.execute(
            `UPDATE inscripcion SET NOTA = ?, ASISTENCIA = ? WHERE SECUENCIAL = ?`,
            [95, 100, student.INSCRIPCION_ID]
        );
    }
    
    console.log('✅ Proceso completado.');
    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
