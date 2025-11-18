const { pool } = require('../config/database');

// Obtener todos los docentes
const obtenerDocentes = async (req, res) => {
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
       WHERE u.CODIGOROL = 'DOC'
       ORDER BY u.SECUENCIAL DESC`
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(u => ({
      ...u,
      FOTO_PERFIL: u.FOTO_PERFIL ? `${hostPrefix}/${u.FOTO_PERFIL}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener docentes:', error);
    res.status(500).json({ error: 'Error al obtener docentes', details: error.message });
  }
};

// Obtener docente por id
const obtenerDocente = async (req, res) => {
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
       WHERE u.SECUENCIAL = ? AND u.CODIGOROL = 'DOC'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    const docente = rows[0];
    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    docente.FOTO_PERFIL = docente.FOTO_PERFIL ? `${hostPrefix}/${docente.FOTO_PERFIL}` : null;

    res.json({ success: true, data: docente });
  } catch (error) {
    console.error('❌ Error al obtener docente:', error);
    res.status(500).json({ error: 'Error al obtener docente', details: error.message });
  }
};

// Actualizar docente (datos básicos)
const actualizarDocente = async (req, res) => {
  const id = req.params.id;
  const { nombres, apellidos, telefono, direccion, correo } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();

    const [existing] = await connection.execute('SELECT SECUENCIAL FROM usuario WHERE SECUENCIAL = ? AND CODIGOROL = "DOC"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    await connection.execute(
      `UPDATE usuario SET NOMBRES = ?, APELLIDOS = ?, TELEFONO = ?, DIRECCION = ?, CORREO = ? WHERE SECUENCIAL = ?`,
      [nombres || null, apellidos || null, telefono || null, direccion || null, correo || null, id]
    );

    res.json({ success: true, message: 'Docente actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar docente:', error);
    res.status(500).json({ error: 'Error al actualizar docente', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener eventos donde el usuario figura como organizador (puede representar dictado/participación)
const obtenerEventosDictados = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.SECUENCIAL as eventoId,
        e.TITULO,
        e.DESCRIPCION,
        e.FECHAINICIO,
        e.FECHAFIN,
        e.COSTO,
        e.ESTADO,
        ie.URL_IMAGEN
       FROM organizador_evento oe
       INNER JOIN evento e ON oe.SECUENCIALEVENTO = e.SECUENCIAL
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO AND ie.TIPO_IMAGEN = 'PORTADA'
       WHERE oe.SECUENCIALUSUARIO = ?
       ORDER BY e.SECUENCIAL DESC`,
      [id]
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(r => ({
      ...r,
      URL_IMAGEN: r.URL_IMAGEN ? `${hostPrefix}/${r.URL_IMAGEN}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener eventos dictados del docente:', error);
    res.status(500).json({ error: 'Error al obtener eventos del docente', details: error.message });
  }
};

module.exports = {
  obtenerDocentes,
  obtenerDocente,
  actualizarDocente,
  obtenerEventosDictados
};
