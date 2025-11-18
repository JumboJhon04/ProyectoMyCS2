const { pool } = require('../config/database');

// Crear nuevo evento completo con imagen
const crearEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { title, type, attendanceRequired, passingGrade } = req.body;
    
    console.log('📝 Datos recibidos:', { title, type, attendanceRequired, passingGrade });
    console.log('📷 Archivo recibido:', req.file);
    
    // Validaciones básicas
    if (!title || !type) {
      return res.status(400).json({ 
        error: 'El nombre y tipo de evento son obligatorios' 
      });
    }

    // Verificar si se subió una imagen
    if (!req.file) {
      return res.status(400).json({ 
        error: 'La imagen del evento es obligatoria' 
      });
    }

    // 1. Mapear tipo de evento a código
    const tipoEventoMap = {
      'Curso': 'CUR',
      'Taller': 'TALL',
      'Seminario': 'SEM',
      'Conferencia': 'CONF'
    };
    const codigoTipo = tipoEventoMap[type] || 'CUR';

    // 2. Crear el evento básico en la tabla 'evento'
    const [eventoResult] = await connection.execute(
      `INSERT INTO evento (
        TITULO, 
        DESCRIPCION, 
        CODIGOTIPOEVENTO, 
        FECHAINICIO, 
        FECHAFIN, 
        CODIGOMODALIDAD, 
        HORAS, 
        NOTAAPROBACION, 
        ES_PAGADO, 
        COSTO, 
        ES_SOLO_INTERNOS, 
        ESTADO,
        ASISTENCIAMINIMA
      ) VALUES (?, NULL, ?, CURDATE(), CURDATE(), 'PRES', 0, ?, 0, 0.00, 0, 'CREADO', ?)`,
      [
        title,
        codigoTipo,
        passingGrade || null,
        attendanceRequired || null
      ]
    );

    const eventoId = eventoResult.insertId;
    console.log('✅ Evento creado con ID:', eventoId);

    // 3. Guardar la imagen asociada al evento
    const imageUrl = `uploads/eventos/${req.file.filename}`;
    
    const [imagenResult] = await connection.execute(
      `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
       VALUES (?, ?, 'PORTADA')`,
      [eventoId, imageUrl]
    );

    console.log('✅ Imagen guardada con ID:', imagenResult.insertId);

    // 4. Commit de la transacción
    await connection.commit();

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        eventoId,
        imagenId: imagenResult.insertId,
        title,
        type,
        attendanceRequired,
        passingGrade: passingGrade ? parseFloat(passingGrade) : null,
        imageUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    // Rollback en caso de error
    if (connection) {
      await connection.rollback();
    }
    
    console.error('❌ Error al crear evento:', error);
    res.status(500).json({ 
      error: 'Error al guardar el evento',
      details: error.message,
      code: error.code
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todas las imágenes de eventos
const obtenerImagenes = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ie.*, e.TITULO 
       FROM imagen_evento ie
       LEFT JOIN evento e ON ie.SECUENCIALEVENTO = e.SECUENCIAL
       ORDER BY ie.SECUENCIAL DESC`
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener imágenes:', error);
    res.status(500).json({ 
      error: 'Error al obtener las imágenes',
      details: error.message
    });
  }
};

// ❌ ELIMINA ESTA FUNCIÓN DUPLICADA - YA NO LA NECESITAS
// const obtenerEventos = async (req, res) => { ... }

// Obtener un evento específico
const obtenerEvento = async (req, res) => {
  try {
    const eventoId = req.params.id;
    
    const [rows] = await pool.execute(
      `SELECT 
        e.*,
        ie.URL_IMAGEN
       FROM evento e
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       WHERE e.SECUENCIAL = ?`,
      [eventoId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ Error al obtener evento:', error);
    res.status(500).json({ 
      error: 'Error al obtener evento',
      details: error.message
    });
  }
};

// Obtener todos los eventos (VERSIÓN ACTUALIZADA - MANTÉN SOLO ESTA)
const obtenerEventos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.SECUENCIAL,
        e.TITULO,
        e.DESCRIPCION,
        e.CONTENIDO,
        e.CODIGOTIPOEVENTO,
        e.CODIGOMODALIDAD,
        e.HORAS,
        e.NOTAAPROBACION,
        e.ASISTENCIAMINIMA,
        e.CAPACIDAD,
        e.COSTO,
        e.ES_PAGADO,
        e.FECHAINICIO,
        e.FECHAFIN,
        e.ESTADO,
        ie.URL_IMAGEN
       FROM evento e
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       ORDER BY e.SECUENCIAL DESC`
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('❌ Error al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message
    });
  }
};


// Actualizar evento completo
const actualizarEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const eventoId = req.params.id;
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      career, teacher, objective, topics, isPaid
    } = req.body;
    
    console.log('📝 Actualizando evento:', eventoId, req.body);
    
    if (!title || !type) {
      return res.status(400).json({ 
        error: 'El nombre y tipo de evento son obligatorios' 
      });
    }

    const tipoEventoMap = {
      'Curso': 'CUR',
      'Taller': 'TALL',
      'Seminario': 'SEM',
      'Conferencia': 'CONF'
    };
    const codigoTipo = tipoEventoMap[type] || 'CUR';

    const modalidadMap = {
      'Presencial': 'PRES',
      'Virtual': 'VIRT',
      'Híbrido': 'HIB',
      'Online': 'VIRT'
    };
    const codigoModalidad = modalidadMap[modality] || 'PRES';

    // ✅ PARSEAR TOPICS SI VIENE COMO STRING
    let topicsArray = [];
    if (topics) {
      if (typeof topics === 'string') {
        try {
          topicsArray = JSON.parse(topics);
        } catch (e) {
          topicsArray = [topics];
        }
      } else if (Array.isArray(topics)) {
        topicsArray = topics;
      }
    }

    const contenidoJSON = JSON.stringify({
      career: career || '',
      teacher: teacher || '',
      topics: topicsArray,
      objective: objective || ''
    });

    const [result] = await connection.execute(
      `UPDATE evento SET
        TITULO = ?,
        DESCRIPCION = ?,
        CONTENIDO = ?,
        CODIGOTIPOEVENTO = ?,
        CODIGOMODALIDAD = ?,
        HORAS = ?,
        NOTAAPROBACION = ?,
        CAPACIDAD = ?,
        COSTO = ?,
        ES_PAGADO = ?,
        ASISTENCIAMINIMA = ?
      WHERE SECUENCIAL = ?`,
      [
        title,
        description || objective || '',
        contenidoJSON,
        codigoTipo,
        codigoModalidad,
        hours || 0,
        passingGrade || null,
        capacity || null,
        cost || 0,
        isPaid ? 1 : 0,
        attendanceRequired || null,
        eventoId
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Evento no encontrado' 
      });
    }

    if (req.file) {
      const imageUrl = `uploads/eventos/${req.file.filename}`;
      
      await connection.execute(
        `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
         VALUES (?, ?, 'PORTADA')
         ON DUPLICATE KEY UPDATE URL_IMAGEN = ?`,
        [eventoId, imageUrl, imageUrl]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: { eventoId, title, type }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al actualizar evento:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el evento',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar evento
const eliminarEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const eventoId = req.params.id;

    // Eliminar imágenes asociadas primero
    await connection.execute(
      'DELETE FROM imagen_evento WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );

    // Eliminar evento
    const [result] = await connection.execute(
      'DELETE FROM evento WHERE SECUENCIAL = ?',
      [eventoId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Evento no encontrado' 
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al eliminar evento:', error);
    res.status(500).json({ 
      error: 'Error al eliminar evento',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  crearEvento,
  obtenerImagenes,
  obtenerEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento
};