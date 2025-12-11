const { pool } = require('../config/database');
const { enviarEmailSolicitud } = require('../services/emailService');

// Crear una nueva solicitud de soporte (para usuarios finales: docentes, estudiantes)
const crearSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { 
      moduloAfectado, 
      tipoSolicitud, 
      descripcion, 
      justificacion, 
      urgencia,
      usuarioId 
    } = req.body;

    const archivoEvidencia = req.file;

    // Validaciones
    if (!moduloAfectado || !tipoSolicitud || !descripcion || !justificacion || !urgencia) {
      return res.status(400).json({ 
        error: 'Todos los campos obligatorios deben ser completados' 
      });
    }

    // Validar tipo de solicitud: solo se permiten estos tres valores exactos
    const tiposPermitidos = ['Problema', 'Mejora', 'Idea'];
    if (!tiposPermitidos.includes(tipoSolicitud)) {
      return res.status(400).json({ 
        error: `Tipo de solicitud inválido. Valores permitidos: ${tiposPermitidos.join(', ')}`,
        valorRecibido: tipoSolicitud
      });
    }

    // Validar urgencia
    const urgenciasPermitidas = ['Alta', 'Media', 'Baja'];
    if (!urgenciasPermitidas.includes(urgencia)) {
      return res.status(400).json({ 
        error: `Urgencia inválida. Valores permitidos: ${urgenciasPermitidas.join(', ')}`,
        valorRecibido: urgencia
      });
    }

    // Validar que el usuario existe y no es admin ni responsable
    if (usuarioId) {
      const [usuario] = await connection.execute(
        `SELECT SECUENCIAL, CODIGOROL FROM usuario WHERE SECUENCIAL = ?`,
        [usuarioId]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const rol = usuario[0].CODIGOROL;
      if (rol === 'ADM' || rol === 'RES') {
        return res.status(403).json({ 
          error: 'Los administradores y responsables no pueden crear solicitudes de soporte' 
        });
      }
    }

    // Guardar archivo de evidencia si existe (Cloudinary ya subió el archivo)
    let archivoEvidenciaUrl = null;
    if (archivoEvidencia) {
      archivoEvidenciaUrl = archivoEvidencia.path; // URL de Cloudinary
    }

    // Insertar la solicitud
    const [result] = await connection.execute(
      `INSERT INTO solicitud_cambio (
        SECUENCIAL_USUARIO,
        MODULO_AFECTADO,
        TIPO_SOLICITUD,
        DESCRIPCION,
        JUSTIFICACION,
        URGENCIA,
        ARCHIVO_EVIDENCIA,
        ESTADO,
        FECHA_ENVIO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente', NOW())`,
      [
        usuarioId || null,
        moduloAfectado,
        tipoSolicitud,
        descripcion,
        justificacion,
        urgencia,
        archivoEvidenciaUrl
      ]
    );

    await connection.commit();

    console.log('✅ Solicitud creada con ID:', result.insertId);
    res.status(201).json({ 
      success: true, 
      message: 'Solicitud de soporte enviada correctamente',
      data: { solicitudId: result.insertId }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al crear solicitud:', error);
    res.status(500).json({ 
      error: 'Error al crear solicitud', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todas las solicitudes (para admin)
const obtenerTodasSolicitudes = async (req, res) => {
  try {
    const [solicitudes] = await pool.execute(
      `SELECT 
        sc.SECUENCIAL,
        sc.SECUENCIAL_USUARIO,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION,
        sc.JUSTIFICACION,
        sc.URGENCIA,
        sc.ARCHIVO_EVIDENCIA,
        sc.ESTADO,
        sc.FECHA_ENVIO,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        r.NOMBRE as ROL_NOMBRE
      FROM solicitud_cambio sc
      LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
      LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
      ORDER BY sc.FECHA_ENVIO DESC`
    );

    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    res.status(500).json({
      error: 'Error al obtener solicitudes',
      details: error.message
    });
  }
};

// Obtener solicitudes del usuario actual
const obtenerMisSolicitudes = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    const [solicitudes] = await pool.execute(
      `SELECT 
        sc.SECUENCIAL,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION,
        sc.JUSTIFICACION,
        sc.URGENCIA,
        sc.ARCHIVO_EVIDENCIA,
        sc.ESTADO,
        sc.FECHA_ENVIO
      FROM solicitud_cambio sc
      WHERE sc.SECUENCIAL_USUARIO = ?
      ORDER BY sc.FECHA_ENVIO DESC`,
      [usuarioId]
    );

    // Construir URLs absolutas para archivos de evidencia
    const solicitudesConUrls = solicitudes.map(s => ({
      ...s,
      ARCHIVO_EVIDENCIA: buildImageUrl(s.ARCHIVO_EVIDENCIA, req)
    }));

    res.json({
      success: true,
      data: solicitudesConUrls
    });
  } catch (error) {
    console.error('❌ Error al obtener mis solicitudes:', error);
    res.status(500).json({
      error: 'Error al obtener solicitudes',
      details: error.message
    });
  }
};

// Cambiar estado de una solicitud y enviar email (para admin)
const cambiarEstadoSolicitud = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { estado, mensaje } = req.body;

    if (!estado || !['Pendiente', 'Aprobado', 'Rechazado'].includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser: Pendiente, Aprobado o Rechazado' 
      });
    }

    // Obtener información de la solicitud y usuario
    const [solicitudes] = await connection.execute(
      `SELECT sc.*, u.CORREO, u.NOMBRES, u.APELLIDOS 
       FROM solicitud_cambio sc
       LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
       WHERE sc.SECUENCIAL = ?`,
      [id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = solicitudes[0];

    // Actualizar el estado
    await connection.execute(
      `UPDATE solicitud_cambio SET ESTADO = ? WHERE SECUENCIAL = ?`,
      [estado, id]
    );

    // Enviar email si hay correo del usuario
    if (solicitud.CORREO && (estado === 'Aprobado' || estado === 'Rechazado')) {
      const nombreUsuario = solicitud.NOMBRES && solicitud.APELLIDOS
        ? `${solicitud.NOMBRES} ${solicitud.APELLIDOS}`
        : 'Usuario';
      
      try {
        await enviarEmailSolicitud(
          solicitud.CORREO,
          nombreUsuario,
          estado,
          mensaje || '',
          id
        );
      } catch (emailError) {
        console.error('⚠️ Error al enviar email (continuando):', emailError);
        // No fallar la operación si el email falla
      }
    }

    await connection.commit();

    console.log(`✅ Estado de solicitud ${id} cambiado a: ${estado}`);
    res.json({ 
      success: true, 
      message: `Estado cambiado a ${estado} correctamente`
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({ 
      error: 'Error al cambiar estado', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Crear una petición de cambio desde una solicitud aprobada (para admin)
const crearPeticionCambio = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { solicitudId } = req.params;
    const {
      tituloCambio,
      nombreSolicitante,
      motivoCambio,
      descripcionCambio,
      planImplementacion,
      planPrueba,
      personaAprobadora,
      responsableTecnico,
      fechaSolicitud,
      fechaEntrega,
      tipoCambio,
      riesgo,
      aprobadoresIds,
      creadorId
    } = req.body;

    // Validaciones básicas
    if (!tituloCambio || !nombreSolicitante || !motivoCambio || !descripcionCambio) {
      return res.status(400).json({ 
        error: 'Los campos obligatorios deben ser completados' 
      });
    }

    // Verificar que la solicitud existe y está aprobada
    const [solicitud] = await connection.execute(
      'SELECT SECUENCIAL, ESTADO FROM solicitud_cambio WHERE SECUENCIAL = ?',
      [solicitudId]
    );

    if (solicitud.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitud[0].ESTADO !== 'Aprobado') {
      return res.status(400).json({ 
        error: 'Solo se pueden crear peticiones de cambio desde solicitudes aprobadas' 
      });
    }

    // Actualizar el estado de la solicitud a "Evaluado"
    await connection.execute(
      `UPDATE solicitud_cambio SET ESTADO = 'Evaluado' WHERE SECUENCIAL = ?`,
      [solicitudId]
    );


    // Crear registro en recepcion_cambio (petición de cambio formal) con estado Pendiente
    // Incluir SECUENCIAL_CREADOR si viene como creadorId
    const [result] = await connection.execute(
      `INSERT INTO recepcion_cambio (
        SECUENCIAL_CAMBIO,
        SECUENCIAL_CREADOR,
        TITULO_CAMBIO,
        NOMBRE_SOLICITANTE,
        TIPO_ITIL,
        PRIORIDAD,
        CATEGORIA_TECNICA,
        EVALUACION,
        BENEFICIOS,
        IMPACTO_NEGATIVO,
        ACCIONES,
        DECISION,
        OBSERVACIONES,
        RESPONSABLE_TECNICO,
        FECHA_DECISION,
        FECHA_SOLICITUD,
        FECHA_ENTREGA,
        ESTADO,
        APROBACIONES_COUNT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'Pendiente', 0)`,
      [
        solicitudId,
        creadorId || null,
        tituloCambio,
        nombreSolicitante,
        tipoCambio || 'Normal',
        riesgo || 'Media',
        'Sistema',
        descripcionCambio,
        planImplementacion || null,
        motivoCambio,
        planPrueba || null,
        'Más información',
        `Solicitud generada desde solicitud #${solicitudId}. Solicitante: ${nombreSolicitante}`,
        responsableTecnico || personaAprobadora || null,
        fechaSolicitud || null,
        fechaEntrega || null
      ]
    );

    const peticionId = result.insertId;

    // Insertar aprobadores seleccionados si vienen
    if (Array.isArray(aprobadoresIds) && aprobadoresIds.length > 0) {
      for (const adminId of aprobadoresIds) {
        await connection.execute(
          `INSERT INTO aprobadores_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN) VALUES (?, ?)`,
          [peticionId, adminId]
        );
      }
    }

    await connection.commit();

    console.log('✅ Petición de cambio creada con ID:', result.insertId);
    res.status(201).json({ 
      success: true, 
      message: 'Petición de cambio creada correctamente',
      data: { peticionId: result.insertId }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al crear petición de cambio:', error);
    res.status(500).json({ 
      error: 'Error al crear petición de cambio', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener una solicitud por ID
const obtenerSolicitudPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [solicitudes] = await pool.execute(
      `SELECT 
        sc.SECUENCIAL,
        sc.SECUENCIAL_USUARIO,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION,
        sc.JUSTIFICACION,
        sc.URGENCIA,
        sc.ARCHIVO_EVIDENCIA,
        sc.ESTADO,
        sc.FECHA_ENVIO,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        r.NOMBRE as ROL_NOMBRE
      FROM solicitud_cambio sc
      LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
      LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
      WHERE sc.SECUENCIAL = ?`,
      [id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Construir URL absoluta para archivo de evidencia
    const solicitud = {
      ...solicitudes[0],
      ARCHIVO_EVIDENCIA: buildImageUrl(solicitudes[0].ARCHIVO_EVIDENCIA, req)
    };

    res.json({
      success: true,
      data: solicitud
    });
  } catch (error) {
    console.error('❌ Error al obtener solicitud:', error);
    res.status(500).json({
      error: 'Error al obtener solicitud',
      details: error.message
    });
  }
};

module.exports = {
  crearSolicitud,
  obtenerTodasSolicitudes,
  obtenerMisSolicitudes,
  cambiarEstadoSolicitud,
  crearPeticionCambio,
  obtenerSolicitudPorId
};

