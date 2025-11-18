const { pool } = require('../config/database');

// Obtener todos los métodos de pago disponibles
const obtenerFormasPago = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT CODIGO, NOMBRE FROM forma_pago ORDER BY NOMBRE'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Error al obtener formas de pago:', error);
    res.status(500).json({ 
      error: 'Error al obtener formas de pago', 
      details: error.message 
    });
  }
};

// Crear un pago (subir comprobante)
const crearPago = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { inscripcionId, formaPago, monto } = req.body;
    const comprobanteFile = req.file;

    if (!inscripcionId || !formaPago || !monto) {
      return res.status(400).json({ 
        error: 'inscripcionId, formaPago y monto son obligatorios' 
      });
    }

    // Verificar que la inscripción existe
    const [inscripcion] = await connection.execute(
      'SELECT SECUENCIAL, SECUENCIALEVENTO FROM inscripcion WHERE SECUENCIAL = ?',
      [inscripcionId]
    );

    if (inscripcion.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    // Verificar que no exista ya un pago para esta inscripción
    const [pagoExistente] = await connection.execute(
      'SELECT SECUENCIAL FROM pago WHERE SECUENCIALINSCRIPCION = ?',
      [inscripcionId]
    );

    if (pagoExistente.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe un pago registrado para esta inscripción' 
      });
    }

    // Guardar comprobante si existe
    let comprobanteUrl = null;
    if (comprobanteFile) {
      comprobanteUrl = `uploads/pagos/${comprobanteFile.filename}`;
    }

    // Crear el pago
    const [result] = await connection.execute(
      `INSERT INTO pago (
        SECUENCIALINSCRIPCION,
        CODIGOFORMADEPAGO,
        COMPROBANTE_URL,
        CODIGOESTADOPAGO,
        MONTO,
        FECHA_PAGO
      ) VALUES (?, ?, ?, 'PEN', ?, NOW())`,
      [inscripcionId, formaPago, comprobanteUrl, parseFloat(monto)]
    );

    await connection.commit();
    
    console.log('✅ Pago creado con ID:', result.insertId);
    res.status(201).json({ 
      success: true, 
      message: 'Pago registrado correctamente',
      data: { pagoId: result.insertId }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ 
      error: 'Error al crear pago', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener pagos de una inscripción
const obtenerPagosPorInscripcion = async (req, res) => {
  try {
    const { inscripcionId } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT 
        p.SECUENCIAL,
        p.SECUENCIALINSCRIPCION,
        p.CODIGOFORMADEPAGO,
        fp.NOMBRE as FORMA_PAGO_NOMBRE,
        p.COMPROBANTE_URL,
        p.CODIGOESTADOPAGO,
        ep.NOMBRE as ESTADO_PAGO_NOMBRE,
        p.MONTO,
        p.FECHA_PAGO,
        p.FECHA_APROBACION,
        p.SECUENCIAL_USUARIO_APROBADOR
       FROM pago p
       LEFT JOIN forma_pago fp ON p.CODIGOFORMADEPAGO = fp.CODIGO
       LEFT JOIN estado_pago ep ON p.CODIGOESTADOPAGO = ep.CODIGO
       WHERE p.SECUENCIALINSCRIPCION = ?
       ORDER BY p.FECHA_PAGO DESC`,
      [inscripcionId]
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(p => ({
      ...p,
      COMPROBANTE_URL: p.COMPROBANTE_URL ? `${hostPrefix}/${p.COMPROBANTE_URL}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener pagos:', error);
    res.status(500).json({ 
      error: 'Error al obtener pagos', 
      details: error.message 
    });
  }
};

// Aprobar o rechazar un pago (solo para responsables/admin)
const actualizarEstadoPago = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { pagoId } = req.params;
    const { estado, observaciones } = req.body; // estado: 'VAL' o 'RECH'
    const aprobadorId = req.user?.id || req.body.aprobadorId; // Asumiendo que viene del middleware de auth

    if (!estado || !['VAL', 'RECH', 'INV'].includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser VAL, RECH o INV' 
      });
    }

    // Verificar que el pago existe
    const [pago] = await connection.execute(
      'SELECT SECUENCIAL, SECUENCIALINSCRIPCION FROM pago WHERE SECUENCIAL = ?',
      [pagoId]
    );

    if (pago.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Actualizar estado del pago
    const fechaAprobacion = estado === 'VAL' ? new Date() : null;
    
    await connection.execute(
      `UPDATE pago SET 
        CODIGOESTADOPAGO = ?,
        SECUENCIAL_USUARIO_APROBADOR = ?,
        FECHA_APROBACION = ?
       WHERE SECUENCIAL = ?`,
      [estado, aprobadorId, fechaAprobacion, pagoId]
    );

    await connection.commit();
    
    console.log(`✅ Pago ${pagoId} ${estado === 'VAL' ? 'aprobado' : 'rechazado'}`);
    res.json({ 
      success: true, 
      message: `Pago ${estado === 'VAL' ? 'aprobado' : 'rechazado'} correctamente` 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al actualizar estado de pago:', error);
    res.status(500).json({ 
      error: 'Error al actualizar estado de pago', 
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todos los pagos pendientes (para admin/responsable)
const obtenerPagosPendientes = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        p.SECUENCIAL,
        p.SECUENCIALINSCRIPCION,
        p.CODIGOFORMADEPAGO,
        fp.NOMBRE as FORMA_PAGO_NOMBRE,
        p.COMPROBANTE_URL,
        p.CODIGOESTADOPAGO,
        ep.NOMBRE as ESTADO_PAGO_NOMBRE,
        p.MONTO,
        p.FECHA_PAGO,
        p.FECHA_APROBACION,
        i.SECUENCIALUSUARIO,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        e.TITULO as EVENTO_TITULO,
        e.COSTO as EVENTO_COSTO
       FROM pago p
       LEFT JOIN forma_pago fp ON p.CODIGOFORMADEPAGO = fp.CODIGO
       LEFT JOIN estado_pago ep ON p.CODIGOESTADOPAGO = ep.CODIGO
       LEFT JOIN inscripcion i ON p.SECUENCIALINSCRIPCION = i.SECUENCIAL
       LEFT JOIN usuario u ON i.SECUENCIALUSUARIO = u.SECUENCIAL
       LEFT JOIN evento e ON i.SECUENCIALEVENTO = e.SECUENCIAL
       WHERE p.CODIGOESTADOPAGO = 'PEN'
       ORDER BY p.FECHA_PAGO DESC`
    );

    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(p => ({
      ...p,
      COMPROBANTE_URL: p.COMPROBANTE_URL ? `${hostPrefix}/${p.COMPROBANTE_URL}` : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al obtener pagos pendientes:', error);
    res.status(500).json({ 
      error: 'Error al obtener pagos pendientes', 
      details: error.message 
    });
  }
};

// Crear pago con PayPal
const crearPagoPayPal = async (req, res) => {
  let connection;
  // Declarar variables fuera del try para que estén disponibles en el catch
  let codigoFormaPago = 'PAYPAL';
  let codigoEstadoPago = 'PEN';
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { inscripcionId, monto, paypalOrderId, paypalDetails } = req.body;

    if (!inscripcionId || !monto || !paypalOrderId) {
      return res.status(400).json({ 
        error: 'inscripcionId, monto y paypalOrderId son obligatorios' 
      });
    }

    // Verificar que la inscripción existe
    const [inscripcion] = await connection.execute(
      'SELECT SECUENCIAL, SECUENCIALEVENTO FROM inscripcion WHERE SECUENCIAL = ?',
      [inscripcionId]
    );

    if (inscripcion.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    // Verificar que no exista ya un pago para esta inscripción
    const [pagoExistente] = await connection.execute(
      'SELECT SECUENCIAL FROM pago WHERE SECUENCIALINSCRIPCION = ?',
      [inscripcionId]
    );

    if (pagoExistente.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Ya existe un pago registrado para esta inscripción' 
      });
    }

    // Buscar el código de forma de pago de PayPal
    const [formaPagoPayPal] = await connection.execute(
      "SELECT CODIGO FROM forma_pago WHERE NOMBRE LIKE '%PayPal%' OR CODIGO = 'PAYPAL' LIMIT 1"
    );

    if (formaPagoPayPal.length > 0) {
      codigoFormaPago = formaPagoPayPal[0].CODIGO;
    } else {
      // Si no existe PayPal en forma_pago, intentar usar el primer código disponible
      // o usar un código genérico
      const [formasPago] = await connection.execute(
        "SELECT CODIGO FROM forma_pago LIMIT 1"
      );
      if (formasPago.length > 0) {
        codigoFormaPago = formasPago[0].CODIGO;
      }
    }

    // Verificar qué códigos de estado de pago existen
    const [estadosPago] = await connection.execute(
      "SELECT CODIGO FROM estado_pago"
    );
    
    // Buscar un código de estado apropiado (VAL, APR, ACE, etc.)
    const estadosDisponibles = estadosPago.map(e => e.CODIGO);
    
    // Prioridad: VAL > APR > ACE > PEN
    if (estadosDisponibles.includes('VAL')) {
      codigoEstadoPago = 'VAL';
    } else if (estadosDisponibles.includes('APR')) {
      codigoEstadoPago = 'APR';
    } else if (estadosDisponibles.includes('ACE')) {
      codigoEstadoPago = 'ACE';
    } else if (estadosDisponibles.length > 0) {
      codigoEstadoPago = estadosDisponibles[0];
    }

    // Crear el pago con PayPal
    // Guardar solo información esencial de PayPal (no todo el objeto para evitar exceder límite de campo)
    // El campo COMPROBANTE_URL probablemente es VARCHAR con límite pequeño, así que guardamos solo el orderId
    let comprobanteUrl = null;
    if (paypalOrderId) {
      // Guardar solo el ID de la orden de PayPal (sin prefijo para ahorrar espacio)
      // Los IDs de PayPal suelen tener máximo 20 caracteres, así que limitamos a 50 para estar seguros
      comprobanteUrl = paypalOrderId.substring(0, 50);
    }

    const [result] = await connection.execute(
      `INSERT INTO pago (
        SECUENCIALINSCRIPCION,
        CODIGOFORMADEPAGO,
        COMPROBANTE_URL,
        CODIGOESTADOPAGO,
        MONTO,
        FECHA_PAGO,
        FECHA_APROBACION
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        inscripcionId, 
        codigoFormaPago, 
        comprobanteUrl,
        codigoEstadoPago,
        parseFloat(monto)
      ]
    );

    // Actualizar el estado de la inscripción a ACEPTADO si el pago fue aprobado
    // Solo si el estado del pago no es PEN (pendiente)
    if (codigoEstadoPago !== 'PEN') {
      await connection.execute(
        'UPDATE inscripcion SET CODIGOESTADOINSCRIPCION = ? WHERE SECUENCIAL = ?',
        ['ACE', inscripcionId]
      );
    }

    await connection.commit();
    
    console.log('✅ Pago de PayPal creado con ID:', result.insertId);
    res.status(201).json({ 
      success: true, 
      message: 'Pago de PayPal registrado correctamente',
      data: { 
        pagoId: result.insertId,
        paypalOrderId: paypalOrderId
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al crear pago de PayPal:', error);
    console.error('Stack trace:', error.stack);
    console.error('Datos recibidos:', { inscripcionId, monto, paypalOrderId, comprobanteUrlLength: comprobanteUrl?.length });
    
    // Si el error es por tamaño del campo, intentar guardar solo el orderId
    if (error.message && error.message.includes('Data too long')) {
      console.log('⚠️ Campo COMPROBANTE_URL muy largo, intentando guardar solo orderId...');
      try {
        await connection.beginTransaction();
        // Guardar solo el orderId sin prefijo (máximo 30 caracteres para estar seguros)
        const shortComprobante = paypalOrderId ? paypalOrderId.substring(0, 30) : null;
        const [retryResult] = await connection.execute(
          `INSERT INTO pago (
            SECUENCIALINSCRIPCION,
            CODIGOFORMADEPAGO,
            COMPROBANTE_URL,
            CODIGOESTADOPAGO,
            MONTO,
            FECHA_PAGO,
            FECHA_APROBACION
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [inscripcionId, codigoFormaPago, shortComprobante, codigoEstadoPago, parseFloat(monto)]
        );
        
        if (codigoEstadoPago !== 'PEN') {
          await connection.execute(
            'UPDATE inscripcion SET CODIGOESTADOINSCRIPCION = ? WHERE SECUENCIAL = ?',
            ['ACE', inscripcionId]
          );
        }
        
        await connection.commit();
        console.log('✅ Pago de PayPal creado con ID (reintento):', retryResult.insertId);
        return res.status(201).json({ 
          success: true, 
          message: 'Pago de PayPal registrado correctamente',
          data: { pagoId: retryResult.insertId, paypalOrderId: paypalOrderId }
        });
      } catch (retryError) {
        await connection.rollback();
        console.error('❌ Error en reintento:', retryError);
      }
    }
    
    res.status(500).json({ 
      error: 'Error al crear pago de PayPal', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  obtenerFormasPago,
  crearPago,
  crearPagoPayPal,
  obtenerPagosPorInscripcion,
  actualizarEstadoPago,
  obtenerPagosPendientes
};

