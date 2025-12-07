const { pool } = require('../config/database');

// Obtener todos los administradores
const obtenerAdmins = async (req, res) => {
  try {
    const [admins] = await pool.execute(
      `SELECT 
        u.SECUENCIAL as id,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        u.TELEFONO,
        CONCAT(u.NOMBRES, ' ', u.APELLIDOS) as NOMBRE_COMPLETO
      FROM usuario u
      WHERE u.CODIGOROL = 'ADM' AND u.CODIGOESTADO = 'ACTIVO'
      ORDER BY u.NOMBRES, u.APELLIDOS`
    );

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('❌ Error al obtener admins:', error);
    res.status(500).json({
      error: 'Error al obtener administradores',
      details: error.message
    });
  }
};

module.exports = {
  obtenerAdmins
};

