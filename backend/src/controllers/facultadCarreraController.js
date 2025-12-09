// controllers/facultadCarreraController.js
const { pool } = require('../config/database');

// Obtener todas las facultades activas
const obtenerFacultades = async (req, res) => {
  try {
    const [facultades] = await pool.execute(
      `SELECT 
        SECUENCIAL,
        NOMBRE,
        SIGLA,
        UBICACION
       FROM facultad
       WHERE ACTIVO = 1
       ORDER BY NOMBRE ASC`
    );

    res.json({
      success: true,
      data: facultades
    });
  } catch (error) {
    console.error('❌ Error al obtener facultades:', error);
    res.status(500).json({
      error: 'Error al obtener las facultades',
      details: error.message
    });
  }
};

// Obtener todas las carreras
const obtenerCarreras = async (req, res) => {
  try {
    const [carreras] = await pool.execute(
      `SELECT 
        c.SECUENCIAL,
        c.NOMBRE_CARRERA,
        c.SECUENCIALFACULTAD,
        f.NOMBRE as NOMBRE_FACULTAD
       FROM carrera c
       INNER JOIN facultad f ON c.SECUENCIALFACULTAD = f.SECUENCIAL
       WHERE f.ACTIVO = 1
       ORDER BY c.NOMBRE_CARRERA ASC`
    );

    res.json({
      success: true,
      data: carreras
    });
  } catch (error) {
    console.error('❌ Error al obtener carreras:', error);
    res.status(500).json({
      error: 'Error al obtener las carreras',
      details: error.message
    });
  }
};

// Obtener carreras por facultad
const obtenerCarrerasPorFacultad = async (req, res) => {
  try {
    const { facultadId } = req.params;

    const [carreras] = await pool.execute(
      `SELECT 
        c.SECUENCIAL,
        c.NOMBRE_CARRERA,
        c.SECUENCIALFACULTAD
       FROM carrera c
       INNER JOIN facultad f ON c.SECUENCIALFACULTAD = f.SECUENCIAL
       WHERE c.SECUENCIALFACULTAD = ? AND f.ACTIVO = 1
       ORDER BY c.NOMBRE_CARRERA ASC`,
      [facultadId]
    );

    res.json({
      success: true,
      data: carreras
    });
  } catch (error) {
    console.error('❌ Error al obtener carreras por facultad:', error);
    res.status(500).json({
      error: 'Error al obtener las carreras',
      details: error.message
    });
  }
};

module.exports = {
  obtenerFacultades,
  obtenerCarreras,
  obtenerCarrerasPorFacultad
};