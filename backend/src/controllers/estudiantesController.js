const { pool } = require('../config/database');

// Obtener todos los estudiantes
const obtenerEstudiantes = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        u.SECUENCIAL as id,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA,
        u.CORREO,
        u.TELEFONO,
        u.DIRECCION,
        u.FOTO_PERFIL,
        r.NOMBRE as ROL_NOMBRE,
        GROUP_CONCAT(c.NOMBRE_CARRERA SEPARATOR ', ') as CARRERAS
       FROM usuario u
       LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
       LEFT JOIN usuario_carrera uc ON uc.SECUENCIALUSUARIO = u.SECUENCIAL
       LEFT JOIN carrera c ON uc.SECUENCIALCARRERA = c.SECUENCIAL
       WHERE u.CODIGOROL = 'EST'
       GROUP BY u.SECUENCIAL
       ORDER BY u.SECUENCIAL DESC`
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(u => ({
      ...u,
      FOTO_PERFIL: u.FOTO_PERFIL ? `${hostPrefix}/${u.FOTO_PERFIL}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes', details: error.message });
  }
};

// Obtener estudiante por id
const obtenerEstudiante = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
        u.SECUENCIAL as id,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA,
        u.CORREO,
        u.TELEFONO,
        u.DIRECCION,
        u.FOTO_PERFIL,
        r.NOMBRE as ROL_NOMBRE
       FROM usuario u
       LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
       WHERE u.SECUENCIAL = ? AND u.CODIGOROL = 'EST'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const estudiante = rows[0];

    // Obtener carreras asociadas
    const [carreras] = await pool.execute(
      `SELECT c.SECUENCIAL, c.NOMBRE_CARRERA
       FROM usuario_carrera uc
       INNER JOIN carrera c ON uc.SECUENCIALCARRERA = c.SECUENCIAL
       WHERE uc.SECUENCIALUSUARIO = ?`,
      [id]
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    estudiante.FOTO_PERFIL = estudiante.FOTO_PERFIL ? `${hostPrefix}/${estudiante.FOTO_PERFIL}` : null;
    estudiante.CARRERAS = carreras;

    res.json({ success: true, data: estudiante });
  } catch (error) {
    console.error('❌ Error al obtener estudiante:', error);
    res.status(500).json({ error: 'Error al obtener estudiante', details: error.message });
  }
};

// Actualizar estudiante (datos básicos)
const actualizarEstudiante = async (req, res) => {
  const id = req.params.id;
  const { nombres, apellidos, telefono, direccion, correo } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();

    // Verificar existencia
    const [existing] = await connection.execute('SELECT SECUENCIAL FROM usuario WHERE SECUENCIAL = ? AND CODIGOROL = "EST"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    await connection.execute(
      `UPDATE usuario SET NOMBRES = ?, APELLIDOS = ?, TELEFONO = ?, DIRECCION = ?, CORREO = ? WHERE SECUENCIAL = ?`,
      [nombres || null, apellidos || null, telefono || null, direccion || null, correo || null, id]
    );

    res.json({ success: true, message: 'Estudiante actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar estudiante', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener eventos en los que está inscrito un usuario (estudiante)
const obtenerEventosDeUsuario = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
        i.SECUENCIAL as inscripcionId,
        i.FECHAINSCRIPCION,
        i.CODIGOESTADOINSCRIPCION,
        e.SECUENCIAL as eventoId,
        e.TITULO,
        e.DESCRIPCION,
        e.FECHAINICIO,
        e.FECHAFIN,
        e.COSTO,
        e.ESTADO,
        ie.URL_IMAGEN
       FROM inscripcion i
       INNER JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO AND ie.TIPO_IMAGEN = 'PORTADA'
       WHERE i.SECUENCIALUSUARIO = ?
       ORDER BY i.FECHAINSCRIPCION DESC`,
      [id]
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(r => ({
      ...r,
      URL_IMAGEN: r.URL_IMAGEN ? `${hostPrefix}/${r.URL_IMAGEN}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener eventos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener eventos del usuario', details: error.message });
  }
};

// Crear inscripción para un usuario a un evento
const crearInscripcion = async (req, res) => {
  const usuarioId = req.params.id;
  const { eventoId, motivacion } = req.body;
  let connection;
  try {
    if (!eventoId) {
      return res.status(400).json({ error: 'Se requiere eventoId' });
    }

    connection = await pool.getConnection();

    // verificar si ya está inscrito
    const [exists] = await connection.execute(
      'SELECT SECUENCIAL FROM inscripcion WHERE SECUENCIALEVENTO = ? AND SECUENCIALUSUARIO = ?',
      [eventoId, usuarioId]
    );
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Usuario ya inscrito en este evento' });
    }

    const [result] = await connection.execute(
      `INSERT INTO inscripcion (SECUENCIALEVENTO, SECUENCIALUSUARIO, FECHAINSCRIPCION, CODIGOESTADOINSCRIPCION, MOTIVACION)
       VALUES (?, ?, NOW(), 'ACE', ?)`,
      [eventoId, usuarioId, motivacion || null]
    );

    res.status(201).json({ success: true, message: 'Inscripción creada', inscripcionId: result.insertId });
  } catch (error) {
    console.error('❌ Error al crear inscripción:', error);
    res.status(500).json({ error: 'Error al crear inscripción', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  obtenerEstudiantes,
  obtenerEstudiante,
  actualizarEstudiante,
  obtenerEventosDeUsuario,
  crearInscripcion
};
