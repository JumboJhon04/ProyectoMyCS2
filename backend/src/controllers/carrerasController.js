const { pool } = require('../config/database');

// Obtener todas las carreras con su facultad
const obtenerCarreras = async (req, res) => {
  console.log('🔔 GET /api/carreras called');
  try {
    const [rows] = await pool.execute(
      `SELECT 
        c.SECUENCIAL,
        c.NOMBRE_CARRERA,
        c.IMAGEN,
        c.SECUENCIALFACULTAD,
        f.NOMBRE as NOMBRE_FACULTAD,
        f.SIGLA as SIGLA_FACULTAD
       FROM carrera c
       LEFT JOIN facultad f ON c.SECUENCIALFACULTAD = f.SECUENCIAL
       WHERE f.ACTIVO = 1 OR f.ACTIVO IS NULL
       ORDER BY f.NOMBRE, c.NOMBRE_CARRERA ASC`
    );
    
    console.log(`✅ Se obtuvieron ${rows.length} carreras`);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener carreras:', error);
    res.status(500).json({ 
      error: 'Error al obtener carreras',
      details: error.message
    });
  }
};

// Obtener carreras agrupadas por facultad (opcional)
const obtenerCarrerasPorFacultad = async (req, res) => {
  try {
    const [facultades] = await pool.execute(
      `SELECT 
        f.SECUENCIAL,
        f.NOMBRE,
        f.SIGLA
       FROM facultad f
       WHERE f.ACTIVO = 1
       ORDER BY f.NOMBRE`
    );

    const resultado = [];

    for (const facultad of facultades) {
      const [carreras] = await pool.execute(
        `SELECT 
          SECUENCIAL,
          NOMBRE_CARRERA,
          IMAGEN
         FROM carrera
         WHERE SECUENCIALFACULTAD = ?
         ORDER BY NOMBRE_CARRERA`,
        [facultad.SECUENCIAL]
      );

      resultado.push({
        facultad: {
          id: facultad.SECUENCIAL,
          nombre: facultad.NOMBRE,
          sigla: facultad.SIGLA
        },
        carreras: carreras
      });
    }
    
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Error al obtener carreras por facultad:', error);
    res.status(500).json({ 
      error: 'Error al obtener carreras por facultad',
      details: error.message
    });
  }
};

module.exports = {
  obtenerCarreras,
  obtenerCarrerasPorFacultad
};