const { pool } = require('../config/database');

// Obtener todas las peticiones de cambio y solicitudes evaluadas (para admin)
const obtenerTodasPeticiones = async (req, res) => {
  try {
    // Obtener peticiones de cambio creadas
    const [peticiones] = await pool.execute(
      `SELECT 
        rc.SECUENCIAL,
        rc.SECUENCIAL_CAMBIO,
        rc.TITULO_CAMBIO,
        rc.NOMBRE_SOLICITANTE,
        rc.TIPO_ITIL,
        rc.PRIORIDAD,
        rc.CATEGORIA_TECNICA,
        rc.EVALUACION,
        rc.BENEFICIOS,
        rc.IMPACTO_NEGATIVO,
        rc.ACCIONES,
        rc.DECISION,
        rc.OBSERVACIONES,
        rc.RESPONSABLE_TECNICO,
        rc.FECHA_DECISION,
        rc.FECHA_SOLICITUD,
        rc.FECHA_ENTREGA,
        rc.ESTADO,
        rc.APROBACIONES_COUNT,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION as DESCRIPCION_SOLICITUD,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        'peticion' as TIPO
      FROM recepcion_cambio rc
      LEFT JOIN solicitud_cambio sc ON rc.SECUENCIAL_CAMBIO = sc.SECUENCIAL
      LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
      ORDER BY rc.FECHA_DECISION DESC`
    );

    // Obtener solicitudes evaluadas que aún no tienen petición creada
    const [solicitudesEvaluadas] = await pool.execute(
      `SELECT 
        NULL as SECUENCIAL,
        sc.SECUENCIAL as SECUENCIAL_CAMBIO,
        NULL as TITULO_CAMBIO,
        CONCAT(u.NOMBRES, ' ', u.APELLIDOS) as NOMBRE_SOLICITANTE,
        NULL as TIPO_ITIL,
        sc.URGENCIA as PRIORIDAD,
        NULL as CATEGORIA_TECNICA,
        sc.DESCRIPCION as EVALUACION,
        NULL as BENEFICIOS,
        sc.JUSTIFICACION as IMPACTO_NEGATIVO,
        NULL as ACCIONES,
        NULL as DECISION,
        NULL as OBSERVACIONES,
        NULL as RESPONSABLE_TECNICO,
        sc.FECHA_ENVIO as FECHA_DECISION,
        NULL as FECHA_SOLICITUD,
        NULL as FECHA_ENTREGA,
        'Pendiente Crear' as ESTADO,
        0 as APROBACIONES_COUNT,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION as DESCRIPCION_SOLICITUD,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        'solicitud_evaluada' as TIPO,
        sc.SECUENCIAL as SECUENCIAL_SOLICITUD
      FROM solicitud_cambio sc
      LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
      WHERE sc.ESTADO = 'Evaluado'
      AND NOT EXISTS (
        SELECT 1 FROM recepcion_cambio rc 
        WHERE rc.SECUENCIAL_CAMBIO = sc.SECUENCIAL
      )
      ORDER BY sc.FECHA_ENVIO DESC`
    );

    // Combinar ambos resultados
    const todasLasPeticiones = [...peticiones, ...solicitudesEvaluadas];

    res.json({
      success: true,
      data: todasLasPeticiones
    });
  } catch (error) {
    // Mostrar información más completa del error para diagnóstico local
    console.error('❌ Error al obtener peticiones:', error);
    const details = {
      message: error.message,
      code: error.code || null,
      sqlMessage: error.sqlMessage || null,
      sql: error.sql || null
    };
    res.status(500).json({
      error: 'Error al obtener peticiones',
      details
    });
  }
};

// Aprobar una petición de cambio (para admin)
const aprobarPeticionCambio = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { adminId } = req.body; // ID del admin que aprueba

    if (!adminId) {
      return res.status(400).json({ error: 'ID de administrador requerido' });
    }

    // Verificar que la petición existe y obtener información del creador
    const [peticiones] = await connection.execute(
      'SELECT SECUENCIAL, ESTADO, APROBACIONES_COUNT, RECHAZOS_COUNT, SECUENCIAL_CREADOR FROM recepcion_cambio WHERE SECUENCIAL = ?',
      [id]
    );

    if (peticiones.length === 0) {
      return res.status(404).json({ error: 'Petición no encontrada' });
    }

    const peticion = peticiones[0];

    // Verificar si el admin que aprueba es el creador
    const esCreador = peticion.SECUENCIAL_CREADOR === parseInt(adminId);

    if (esCreador) {
      // Si es el creador, solo puede aprobar cuando hay 2 aprobaciones y el estado es Aceptado
      if (peticion.ESTADO !== 'Aceptado' || peticion.APROBACIONES_COUNT < 2) {
        return res.status(400).json({ 
          error: 'El creador solo puede aprobar cuando hay 2 aprobaciones de los aprobadores seleccionados' 
        });
      }

      // Verificar que el creador no haya aprobado ya
      const [aprobacionCreador] = await connection.execute(
        'SELECT SECUENCIAL FROM aprobacion_peticion_cambio WHERE SECUENCIAL_PETICION = ? AND SECUENCIAL_ADMIN = ?',
        [id, adminId]
      );

      if (aprobacionCreador.length > 0) {
        return res.status(400).json({ 
          error: 'Ya has aprobado esta petición' 
        });
      }

      // Registrar aprobación del creador y completar el flujo
      await connection.execute(
        `INSERT INTO aprobacion_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN, FECHA_APROBACION, TIPO_ACCION)
         VALUES (?, ?, NOW(), 'Aprobacion')`,
        [id, adminId]
      );

      await connection.execute(
        `UPDATE recepcion_cambio 
         SET ESTADO = 'Completado' 
         WHERE SECUENCIAL = ?`,
        [id]
      );

      await connection.commit();

      console.log(`✅ Petición ${id} completada por creador ${adminId}`);
      res.json({ 
        success: true, 
        message: 'Petición completada exitosamente',
        data: { 
          estado: 'Completado'
        }
      });

    } else {
      // Si NO es el creador, verificar que esté en la lista de aprobadores
      const [esAprobador] = await connection.execute(
        'SELECT SECUENCIAL FROM aprobadores_peticion_cambio WHERE SECUENCIAL_PETICION = ? AND SECUENCIAL_ADMIN = ?',
        [id, adminId]
      );

      if (esAprobador.length === 0) {
        return res.status(403).json({ 
          error: 'No tienes permiso para aprobar esta petición. Solo los administradores seleccionados como aprobadores pueden aprobar.' 
        });
      }

      if (peticion.ESTADO !== 'Pendiente') {
        return res.status(400).json({ 
          error: 'Solo se pueden aprobar peticiones en estado Pendiente' 
        });
      }

      // Verificar que el admin no haya aprobado o rechazado ya esta petición
      const [accionExistente] = await connection.execute(
        'SELECT SECUENCIAL, TIPO_ACCION FROM aprobacion_peticion_cambio WHERE SECUENCIAL_PETICION = ? AND SECUENCIAL_ADMIN = ?',
        [id, adminId]
      );

      if (accionExistente.length > 0) {
        const tipoAccion = accionExistente[0].TIPO_ACCION;
        return res.status(400).json({ 
          error: tipoAccion === 'Aprobacion' 
            ? 'Ya has aprobado esta petición' 
            : 'Ya has rechazado esta petición. No puedes aprobarla después de rechazarla.' 
        });
      }

      // Obtener información completa de la petición para validar si es posible alcanzar 2 aprobaciones
      const [peticionCompleta] = await connection.execute(
        `SELECT 
          rc.APROBACIONES_COUNT,
          rc.RECHAZOS_COUNT,
          COUNT(ap.SECUENCIAL) as TOTAL_APROBADORES
        FROM recepcion_cambio rc
        LEFT JOIN aprobadores_peticion_cambio ap ON rc.SECUENCIAL = ap.SECUENCIAL_PETICION
        WHERE rc.SECUENCIAL = ?
        GROUP BY rc.SECUENCIAL`,
        [id]
      );

      const totalAprobadores = peticionCompleta[0].TOTAL_APROBADORES || 0;
      const aprobacionesActuales = peticion.APROBACIONES_COUNT;
      const rechazosActuales = peticionCompleta[0].RECHAZOS_COUNT || 0;

      // Calcular si es posible alcanzar 2 aprobaciones
      const aprobacionesNecesarias = 2;
      const aprobacionesRestantes = totalAprobadores - aprobacionesActuales - rechazosActuales - 1; // -1 porque este admin está por aprobar
      const aprobacionesFaltantes = aprobacionesNecesarias - (aprobacionesActuales + 1); // +1 porque este admin está por aprobar

      // Si después de esta aprobación no es posible alcanzar las 2 necesarias, rechazar automáticamente
      if (aprobacionesRestantes < aprobacionesFaltantes && aprobacionesFaltantes > 0) {
        // No es posible alcanzar 2 aprobaciones, marcar como rechazado
        await connection.execute(
          `UPDATE recepcion_cambio 
           SET ESTADO = 'Rechazado', APROBACIONES_COUNT = APROBACIONES_COUNT + 1
           WHERE SECUENCIAL = ?`,
          [id]
        );

        await connection.execute(
          `INSERT INTO aprobacion_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN, FECHA_APROBACION, TIPO_ACCION)
           VALUES (?, ?, NOW(), 'Aprobacion')`,
          [id, adminId]
        );

        await connection.commit();

        return res.status(400).json({ 
          error: 'No es posible alcanzar las 2 aprobaciones necesarias. La petición ha sido rechazada automáticamente.',
          data: { estado: 'Rechazado' }
        });
      }

      // Registrar la aprobación
      await connection.execute(
        `INSERT INTO aprobacion_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN, FECHA_APROBACION, TIPO_ACCION)
         VALUES (?, ?, NOW(), 'Aprobacion')`,
        [id, adminId]
      );

      // Incrementar contador de aprobaciones
      const nuevoCount = peticion.APROBACIONES_COUNT + 1;

      // Si tiene 2 o más aprobaciones, cambiar estado a Aceptado
      if (nuevoCount >= 2) {
        await connection.execute(
          `UPDATE recepcion_cambio 
           SET APROBACIONES_COUNT = ?, ESTADO = 'Aceptado' 
           WHERE SECUENCIAL = ?`,
          [nuevoCount, id]
        );
      } else {
        await connection.execute(
          `UPDATE recepcion_cambio 
           SET APROBACIONES_COUNT = ? 
           WHERE SECUENCIAL = ?`,
          [nuevoCount, id]
        );
      }

      await connection.commit();

      console.log(`✅ Petición ${id} aprobada por admin ${adminId}. Total: ${nuevoCount}`);
      res.json({ 
        success: true, 
        message: nuevoCount >= 2 
          ? 'Petición aprobada y aceptada (2 aprobaciones). El creador puede completar la petición.' 
          : `Petición aprobada (${nuevoCount}/2 aprobaciones)`,
        data: { 
          aprobacionesCount: nuevoCount,
          estado: nuevoCount >= 2 ? 'Aceptado' : 'Pendiente'
        }
      });
    }

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al aprobar petición:', error);
    res.status(500).json({ 
      error: 'Error al aprobar petición', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Rechazar una petición de cambio (para admin aprobador)
const rechazarPeticionCambio = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;
    const { adminId, motivoRechazo } = req.body; // ID del admin que rechaza y motivo opcional

    if (!adminId) {
      return res.status(400).json({ error: 'ID de administrador requerido' });
    }

    // Verificar que la petición existe y obtener información completa
    const [peticiones] = await connection.execute(
      'SELECT SECUENCIAL, ESTADO, APROBACIONES_COUNT, RECHAZOS_COUNT FROM recepcion_cambio WHERE SECUENCIAL = ?',
      [id]
    );

    if (peticiones.length === 0) {
      return res.status(404).json({ error: 'Petición no encontrada' });
    }

    const peticion = peticiones[0];

    if (peticion.ESTADO !== 'Pendiente') {
      return res.status(400).json({ 
        error: 'Solo se pueden rechazar peticiones en estado Pendiente' 
      });
    }

    // Verificar que el admin esté en la lista de aprobadores
    const [esAprobador] = await connection.execute(
      'SELECT SECUENCIAL FROM aprobadores_peticion_cambio WHERE SECUENCIAL_PETICION = ? AND SECUENCIAL_ADMIN = ?',
      [id, adminId]
    );

    if (esAprobador.length === 0) {
      return res.status(403).json({ 
        error: 'No tienes permiso para rechazar esta petición. Solo los administradores seleccionados como aprobadores pueden rechazar.' 
      });
    }

    // Verificar que el admin no haya aprobado o rechazado ya esta petición
    const [accionExistente] = await connection.execute(
      'SELECT SECUENCIAL, TIPO_ACCION FROM aprobacion_peticion_cambio WHERE SECUENCIAL_PETICION = ? AND SECUENCIAL_ADMIN = ?',
      [id, adminId]
    );

    if (accionExistente.length > 0) {
      const tipoAccion = accionExistente[0].TIPO_ACCION;
      return res.status(400).json({ 
        error: tipoAccion === 'Rechazo' 
          ? 'Ya has rechazado esta petición' 
          : 'Ya has aprobado esta petición. No puedes rechazarla después de aprobarla.' 
      });
    }

    // Obtener total de aprobadores para calcular si es posible alcanzar 2 aprobaciones
    const [peticionCompleta] = await connection.execute(
      `SELECT COUNT(ap.SECUENCIAL) as TOTAL_APROBADORES
       FROM recepcion_cambio rc
       LEFT JOIN aprobadores_peticion_cambio ap ON rc.SECUENCIAL = ap.SECUENCIAL_PETICION
       WHERE rc.SECUENCIAL = ?
       GROUP BY rc.SECUENCIAL`,
      [id]
    );

    const totalAprobadores = peticionCompleta[0].TOTAL_APROBADORES || 0;
    const aprobacionesActuales = peticion.APROBACIONES_COUNT || 0;
    const rechazosActuales = peticion.RECHAZOS_COUNT || 0;

    // Calcular si es posible alcanzar 2 aprobaciones después de este rechazo
    const aprobacionesNecesarias = 2;
    const aprobadoresRestantes = totalAprobadores - aprobacionesActuales - rechazosActuales - 1; // -1 porque este admin está por rechazar
    const aprobacionesFaltantes = aprobacionesNecesarias - aprobacionesActuales;

    // Registrar el rechazo
    await connection.execute(
      `INSERT INTO aprobacion_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN, FECHA_APROBACION, TIPO_ACCION, MOTIVO_RECHAZO)
       VALUES (?, ?, NOW(), 'Rechazo', ?)`,
      [id, adminId, motivoRechazo || null]
    );

    // Incrementar contador de rechazos
    const nuevoRechazosCount = rechazosActuales + 1;

    // Si después de este rechazo no es posible alcanzar las 2 aprobaciones necesarias, rechazar automáticamente
    if (aprobadoresRestantes < aprobacionesFaltantes && aprobacionesFaltantes > 0) {
      // No es posible alcanzar 2 aprobaciones, marcar como rechazado
      await connection.execute(
        `UPDATE recepcion_cambio 
         SET ESTADO = 'Rechazado', RECHAZOS_COUNT = ? 
         WHERE SECUENCIAL = ?`,
        [nuevoRechazosCount, id]
      );

      await connection.commit();

      console.log(`❌ Petición ${id} rechazada automáticamente por admin ${adminId}. No es posible alcanzar 2 aprobaciones.`);
      res.json({ 
        success: true, 
        message: 'Petición rechazada. No es posible alcanzar las 2 aprobaciones necesarias.',
        data: { 
          estado: 'Rechazado',
          rechazosCount: nuevoRechazosCount
        }
      });
    } else {
      // Todavía es posible alcanzar 2 aprobaciones, solo incrementar contador de rechazos
      await connection.execute(
        `UPDATE recepcion_cambio 
         SET RECHAZOS_COUNT = ? 
         WHERE SECUENCIAL = ?`,
        [nuevoRechazosCount, id]
      );

      await connection.commit();

      console.log(`⚠️ Petición ${id} rechazada por admin ${adminId}. Rechazos: ${nuevoRechazosCount}. Todavía es posible alcanzar 2 aprobaciones.`);
      res.json({ 
        success: true, 
        message: `Petición rechazada (${nuevoRechazosCount} rechazo(s)). Todavía es posible alcanzar las 2 aprobaciones necesarias.`,
        data: { 
          estado: 'Pendiente',
          rechazosCount: nuevoRechazosCount
        }
      });
    }

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al rechazar petición:', error);
    res.status(500).json({ 
      error: 'Error al rechazar petición', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener una petición por ID
const obtenerPeticionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [peticiones] = await pool.execute(
      `SELECT 
        rc.*,
        COALESCE(rc.RECHAZOS_COUNT, 0) as RECHAZOS_COUNT,
        sc.MODULO_AFECTADO,
        sc.TIPO_SOLICITUD,
        sc.DESCRIPCION as DESCRIPCION_SOLICITUD,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        creador.NOMBRES as CREADOR_NOMBRES,
        creador.APELLIDOS as CREADOR_APELLIDOS,
        creador.SECUENCIAL as CREADOR_ID
      FROM recepcion_cambio rc
      LEFT JOIN solicitud_cambio sc ON rc.SECUENCIAL_CAMBIO = sc.SECUENCIAL
      LEFT JOIN usuario u ON sc.SECUENCIAL_USUARIO = u.SECUENCIAL
      LEFT JOIN usuario creador ON rc.SECUENCIAL_CREADOR = creador.SECUENCIAL
      WHERE rc.SECUENCIAL = ?`,
      [id]
    );

    if (peticiones.length === 0) {
      return res.status(404).json({ error: 'Petición no encontrada' });
    }

    // Obtener lista de admins aprobadores seleccionados
    const [aprobadores] = await pool.execute(
      `SELECT 
        ap.SECUENCIAL_ADMIN,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO
      FROM aprobadores_peticion_cambio ap
      LEFT JOIN usuario u ON ap.SECUENCIAL_ADMIN = u.SECUENCIAL
      WHERE ap.SECUENCIAL_PETICION = ?`,
      [id]
    );

    // Obtener lista de admins que aprobaron o rechazaron
    const [acciones] = await pool.execute(
      `SELECT 
        apc.SECUENCIAL_ADMIN,
        apc.FECHA_APROBACION,
        apc.TIPO_ACCION,
        apc.MOTIVO_RECHAZO,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO
      FROM aprobacion_peticion_cambio apc
      LEFT JOIN usuario u ON apc.SECUENCIAL_ADMIN = u.SECUENCIAL
      WHERE apc.SECUENCIAL_PETICION = ?
      ORDER BY apc.FECHA_APROBACION DESC`,
      [id]
    );

    // Separar aprobaciones y rechazos
    const aprobaciones = acciones.filter(a => a.TIPO_ACCION === 'Aprobacion');
    const rechazos = acciones.filter(a => a.TIPO_ACCION === 'Rechazo');

    res.json({
      success: true,
      data: {
        ...peticiones[0],
        aprobadores,
        aprobaciones,
        rechazos,
        todasLasAcciones: acciones
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener petición:', error);
    res.status(500).json({
      error: 'Error al obtener petición',
      details: error.message
    });
  }
};

// Crear una petición de cambio directamente (sin solicitud de usuario)
const crearPeticionCambioDirecta = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

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
      solicitudId, // Opcional: si viene de una solicitud evaluada
      aprobadoresIds, // Array de IDs de admins aprobadores (mínimo 2)
      creadorId // ID del admin que crea la petición
    } = req.body;

    // Validaciones básicas
    if (!tituloCambio || !nombreSolicitante || !motivoCambio || !descripcionCambio) {
      return res.status(400).json({ 
        error: 'Los campos obligatorios deben ser completados' 
      });
    }

    // Validar que se hayan seleccionado aprobadores (mínimo 2)
    if (!aprobadoresIds || !Array.isArray(aprobadoresIds) || aprobadoresIds.length < 2) {
      return res.status(400).json({ 
        error: 'Debe seleccionar mínimo 2 administradores aprobadores' 
      });
    }

    // Validar que el creador no esté en la lista de aprobadores
    if (aprobadoresIds.includes(creadorId)) {
      return res.status(400).json({ 
        error: 'El creador de la petición no puede ser aprobador' 
      });
    }

    // Validar que todos los aprobadores sean admins activos
    const placeholders = aprobadoresIds.map(() => '?').join(',');
    const [adminsValidos] = await connection.execute(
      `SELECT SECUENCIAL FROM usuario WHERE SECUENCIAL IN (${placeholders}) AND CODIGOROL = 'ADM' AND CODIGOESTADO = 'ACTIVO'`,
      aprobadoresIds
    );

    if (adminsValidos.length !== aprobadoresIds.length) {
      return res.status(400).json({ 
        error: 'Uno o más administradores seleccionados no son válidos' 
      });
    }

    // Si viene de una solicitud, verificar que existe y está evaluada
    if (solicitudId) {
      const [solicitud] = await connection.execute(
        'SELECT SECUENCIAL, ESTADO FROM solicitud_cambio WHERE SECUENCIAL = ?',
        [solicitudId]
      );

      if (solicitud.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud[0].ESTADO !== 'Evaluado') {
        return res.status(400).json({ 
          error: 'Solo se pueden crear peticiones desde solicitudes evaluadas' 
        });
      }

      // Verificar que no exista ya una petición para esta solicitud
      const [peticionExistente] = await connection.execute(
        'SELECT SECUENCIAL FROM recepcion_cambio WHERE SECUENCIAL_CAMBIO = ?',
        [solicitudId]
      );

      if (peticionExistente.length > 0) {
        return res.status(400).json({ 
          error: 'Ya existe una petición de cambio para esta solicitud' 
        });
      }
    }

    // Crear registro en recepcion_cambio
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
        solicitudId || null,
        creadorId,
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
        solicitudId 
          ? `Petición generada desde solicitud #${solicitudId}. Solicitante: ${nombreSolicitante}`
          : `Petición creada directamente por administrador. Solicitante: ${nombreSolicitante}`,
        responsableTecnico || personaAprobadora || null,
        fechaSolicitud || null,
        fechaEntrega || null
      ]
    );

    const peticionId = result.insertId;

    // Insertar aprobadores seleccionados
    for (const adminId of aprobadoresIds) {
      await connection.execute(
        `INSERT INTO aprobadores_peticion_cambio (SECUENCIAL_PETICION, SECUENCIAL_ADMIN) VALUES (?, ?)`,
        [peticionId, adminId]
      );
    }

    await connection.commit();

    console.log('✅ Petición de cambio creada directamente con ID:', result.insertId);
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

module.exports = {
  obtenerTodasPeticiones,
  aprobarPeticionCambio,
  rechazarPeticionCambio,
  obtenerPeticionPorId,
  crearPeticionCambioDirecta
};

