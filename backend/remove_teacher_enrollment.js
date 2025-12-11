
const { pool } = require('./src/config/database');

async function removeTeacherEnrollment() {
  const courseId = 199;
  try {
    // 1. Get Docente ID
    const [rows] = await pool.execute('SELECT Docente, TITULO FROM evento WHERE SECUENCIAL = ?', [courseId]);
    if (rows.length === 0) process.exit(1);
    
    const docenteId = rows[0].Docente;
    console.log(`Course: ${rows[0].TITULO}, Docente ID: ${docenteId}`);

    if (!docenteId) {
        console.log('No docente assigned.');
        process.exit(0);
    }

    // 2. Check if enrolled
    const [enrollment] = await pool.execute(
        'SELECT * FROM inscripcion WHERE SECUENCIALEVENTO = ? AND SECUENCIALUSUARIO = ?',
        [courseId, docenteId]
    );

    if (enrollment.length > 0) {
        console.log(`⚠️ Teacher is enrolled! (ID: ${enrollment[0].SECUENCIAL}). Deleting...`);
        
        // 3. Delete Enrollment
        await pool.execute(
            'DELETE FROM inscripcion WHERE SECUENCIALEVENTO = ? AND SECUENCIALUSUARIO = ?',
            [courseId, docenteId]
        );
        console.log('✅ Teacher removed from enrollment list successfully.');
    } else {
        console.log('✅ Teacher is NOT enrolled as a student.');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

removeTeacherEnrollment();
