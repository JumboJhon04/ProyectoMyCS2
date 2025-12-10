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

// Obtener todos los usuarios (para administrador)
const obtenerTodosUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT 
        u.SECUENCIAL as id,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA,
        u.CORREO,
        u.TELEFONO,
        u.DIRECCION,
        u.FECHA_NACIMIENTO,
        u.CODIGOESTADO,
        u.CODIGOROL,
        DATE_FORMAT(u.FECHA_NACIMIENTO, '%d/%m/%Y') as date,
        r.NOMBRE as rol
       FROM usuario u
       LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
       ORDER BY u.SECUENCIAL DESC`
    );

    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios',
      details: error.message
    });
  }
};

// Actualizar rol de usuario
const actualizarRolUsuario = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { usuarioId, nuevoRol } = req.body;

    if (!usuarioId || !nuevoRol) {
      return res.status(400).json({
        error: 'Usuario ID y nuevo rol son requeridos'
      });
    }

    // Validar que el rol exista
    const [rolExiste] = await connection.execute(
      'SELECT CODIGO FROM rol_usuario WHERE CODIGO = ?',
      [nuevoRol]
    );

    if (rolExiste.length === 0) {
      return res.status(400).json({
        error: 'El rol especificado no existe'
      });
    }

    // Actualizar rol del usuario
    await connection.execute(
      'UPDATE usuario SET CODIGOROL = ? WHERE SECUENCIAL = ?',
      [nuevoRol, usuarioId]
    );

    console.log(`✅ Rol del usuario ${usuarioId} actualizado a ${nuevoRol}`);

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar rol:', error);
    res.status(500).json({
      error: 'Error al actualizar rol',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Actualizar estado de usuario (activo/inactivo)
const actualizarEstadoUsuario = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { usuarioId, nuevoEstado } = req.body;

    if (!usuarioId || !nuevoEstado) {
      return res.status(400).json({
        error: 'Usuario ID y nuevo estado son requeridos'
      });
    }

    // Validar estado (ACTIVO o INACTIVO)
    if (!['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
      return res.status(400).json({
        error: 'El estado debe ser ACTIVO o INACTIVO'
      });
    }

    await connection.execute(
      'UPDATE usuario SET CODIGOESTADO = ? WHERE SECUENCIAL = ?',
      [nuevoEstado, usuarioId]
    );

    console.log(`✅ Estado del usuario ${usuarioId} actualizado a ${nuevoEstado}`);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({
      error: 'Error al actualizar estado',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener roles disponibles
const obtenerRolesDisponibles = async (req, res) => {
  try {
    const [roles] = await pool.execute(
      'SELECT CODIGO, NOMBRE FROM rol_usuario ORDER BY NOMBRE'
    );

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    res.status(500).json({
      error: 'Error al obtener roles',
      details: error.message
    });
  }
};

module.exports = {
  obtenerAdmins,
  obtenerTodosUsuarios,
  actualizarRolUsuario,
  actualizarEstadoUsuario,
  obtenerRolesDisponibles
};

