const { pool } = require('../config/database');

// Obtener perfil de usuario
const obtenerPerfil = async (req, res) => {
  const { id } = req.params;

  try {
    const [usuarios] = await pool.execute(
      `SELECT 
        SECUENCIAL as id,
        NOMBRES,
        APELLIDOS,
        CORREO,
        CEDULA,
        TELEFONO,
        DIRECCION,
        FOTO_PERFIL,
        CODIGOROL,
        CODIGOESTADO
       FROM usuario 
       WHERE SECUENCIAL = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const usuario = usuarios[0];

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener el perfil',
      details: error.message
    });
  }
};

// Actualizar perfil de usuario
const actualizarPerfil = async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, telefono } = req.body;
  // Si se subió archvo, req.file tendrá la info de Cloudinary via multer
  const file = req.file;

  try {
    // Validaciones básicas
    if (!nombres || !apellidos) {
      return res.status(400).json({
        error: 'Nombres y apellidos son obligatorios'
      });
    }

    // Construir query
    let query = 'UPDATE usuario SET NOMBRES = ?, APELLIDOS = ?, TELEFONO = ?';
    let params = [nombres, apellidos, telefono];

    // Si hay archivo, actualizamos FOTO_PERFIL con la URL segura de Cloudinary
    if (file && file.path) {
      query += ', FOTO_PERFIL = ?';
      params.push(file.path);
    } 
    // Si no hay archivo, verificamos si se envió el campo fotoPerfil (incluso si está vacío para borrar)
    else if (req.body.fotoPerfil !== undefined) {
       query += ', FOTO_PERFIL = ?';
       // Si es string vacío, guardamos NULL
       params.push(req.body.fotoPerfil || null);
    }

    query += ' WHERE SECUENCIAL = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Obtener datos actualizados
    const [updatedUser] = await pool.execute(
      'SELECT SECUENCIAL as id, NOMBRES, APELLIDOS, CORREO, CEDULA, TELEFONO, FOTO_PERFIL FROM usuario WHERE SECUENCIAL = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser[0]
    });

  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({
      error: 'Error al actualizar el perfil',
      details: error.message
    });
  }
};

// Obtener lista de docentes (usuarios disponibles para asignar)
const obtenerDocentes = async (req, res) => {
  try {
    const [docentes] = await pool.execute(
      `SELECT SECUENCIAL as id, NOMBRES, APELLIDOS, CORREO 
       FROM usuario 
       WHERE CODIGOROL = 'EST'
       ORDER BY APELLIDOS ASC`
    );

    res.json({
      success: true,
      data: docentes
    });
  } catch (error) {
    console.error('❌ Error al obtener docentes:', error);
    res.status(500).json({
      error: 'Error al obtener lista de docentes',
      details: error.message
    });
  }
};

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  obtenerDocentes
};

