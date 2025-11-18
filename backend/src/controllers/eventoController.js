const { pool } = require('../config/database');

// Crear evento
const crearEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      teacher, objective, topics, startDate, endDate,
      carreras // ✅ NUEVO: Array de IDs de carreras
    } = req.body;
    
    console.log('📝 Creando evento:', title);
    console.log('🎓 Carreras seleccionadas:', carreras);
    
    if (!title || !type) {
      return res.status(400).json({ 
        error: 'El nombre y tipo de evento son obligatorios' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: 'La imagen del evento es obligatoria' 
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

    // Parsear topics
    let topicsArray = [];
    if (topics) {
      if (typeof topics === 'string') {
        try {
          topicsArray = JSON.parse(topics);
        } catch (e) {
          topicsArray = topics.trim() ? [topics] : [];
        }
      } else if (Array.isArray(topics)) {
        topicsArray = topics;
      }
    }

    // ✅ CONTENIDO SIN CAREER (solo teacher y topics)
    const contenidoObject = {
      teacher: teacher || '',
      topics: topicsArray
    };

    const contenidoJSON = JSON.stringify(contenidoObject);

    const [eventoResult] = await connection.execute(
      `INSERT INTO evento (
        TITULO, 
        DESCRIPCION,
        CONTENIDO,
        CODIGOTIPOEVENTO, 
        FECHAINICIO, 
        FECHAFIN, 
        CODIGOMODALIDAD, 
        HORAS,
        CAPACIDAD,
        NOTAAPROBACION, 
        ES_PAGADO, 
        COSTO, 
        ES_SOLO_INTERNOS, 
        ESTADO,
        ASISTENCIAMINIMA
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'CREADO', ?)`,
      [
        title,
        objective || description || '',
        contenidoJSON,
        codigoTipo,
        codigoModalidad,
        startDate || new Date().toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0],
        hours || 0,
        capacity || null,
        passingGrade || null,
        cost && parseFloat(cost) > 0 ? 1 : 0,
        cost || 0,
        attendanceRequired || null
      ]
    );

    const eventoId = eventoResult.insertId;
    console.log('✅ Evento creado con ID:', eventoId);

    // ✅ GUARDAR CARRERAS EN evento_carrera
    if (carreras) {
      let carrerasArray = [];
      if (typeof carreras === 'string') {
        try {
          carrerasArray = JSON.parse(carreras);
        } catch (e) {
          carrerasArray = [carreras];
        }
      } else if (Array.isArray(carreras)) {
        carrerasArray = carreras;
      }

      if (carrerasArray.length > 0) {
        for (const carreraId of carrerasArray) {
          await connection.execute(
            'INSERT INTO evento_carrera (SECUENCIALEVENTO, SECUENCIALCARRERA) VALUES (?, ?)',
            [eventoId, carreraId]
          );
        }
        console.log(`✅ ${carrerasArray.length} carreras asociadas al evento`);
      }
    }

    // Guardar imagen
    const imageUrl = `uploads/eventos/${req.file.filename}`;
    const [imagenResult] = await connection.execute(
      `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
       VALUES (?, ?, 'PORTADA')`,
      [eventoId, imageUrl]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        eventoId,
        imagenId: imagenResult.insertId,
        title,
        type,
        imageUrl
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error al crear evento:', error);
    res.status(500).json({ 
      error: 'Error al guardar el evento',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Actualizar evento
const actualizarEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const eventoId = req.params.id;
    
    console.log('🔍 BACKEND - req.body completo:', req.body);
    console.log('🔍 BACKEND - carreras recibido (raw):', req.body.carreras);
    console.log('🔍 BACKEND - tipo de carreras:', typeof req.body.carreras);
    
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      teacher, objective, topics, isPaid,
      startDate, endDate,
      carreras
    } = req.body;
    
    console.log('📝 BACKEND - carreras extraído:', carreras);
    
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

    // Parsear topics
    let topicsArray = [];
    if (topics) {
      if (typeof topics === 'string') {
        try {
          topicsArray = JSON.parse(topics);
        } catch (e) {
          topicsArray = topics.trim() ? [topics] : [];
        }
      } else if (Array.isArray(topics)) {
        topicsArray = topics;
      }
    }

    const contenidoObject = {
      teacher: teacher || '',
      topics: topicsArray
    };

    const contenidoJSON = JSON.stringify(contenidoObject);

    // ✅ ACTUALIZAR EVENTO
    const [result] = await connection.execute(
      `UPDATE evento SET
        TITULO = ?,
        DESCRIPCION = ?,
        CONTENIDO = ?,
        CODIGOTIPOEVENTO = ?,
        CODIGOMODALIDAD = ?,
        FECHAINICIO = ?,
        FECHAFIN = ?,
        HORAS = ?,
        NOTAAPROBACION = ?,
        CAPACIDAD = ?,
        COSTO = ?,
        ES_PAGADO = ?,
        ASISTENCIAMINIMA = ?
      WHERE SECUENCIAL = ?`,
      [
        title,
        objective || description || '',
        contenidoJSON,
        codigoTipo,
        codigoModalidad,
        startDate || null,
        endDate || null,
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

    console.log('✅ BACKEND - Evento actualizado en BD');

    // ✅ PROCESAR CARRERAS CON LOGS DETALLADOS
    console.log('🎓 BACKEND - Procesando carreras...');
    console.log('🎓 BACKEND - Valor de carreras:', carreras);
    console.log('🎓 BACKEND - Tipo de carreras:', typeof carreras);

    // Primero eliminar carreras antiguas
    const [deleteResult] = await connection.execute(
      'DELETE FROM evento_carrera WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );
    console.log(`🗑️ BACKEND - ${deleteResult.affectedRows} carreras antiguas eliminadas`);

    if (carreras) {
      let carrerasArray = [];
      
      if (typeof carreras === 'string') {
        try {
          carrerasArray = JSON.parse(carreras);
          console.log('✅ BACKEND - Carreras parseadas de string:', carrerasArray);
        } catch (e) {
          console.error('❌ BACKEND - Error parseando carreras:', e);
          if (carreras.trim()) {
            carrerasArray = [carreras];
          }
        }
      } else if (Array.isArray(carreras)) {
        carrerasArray = carreras;
        console.log('✅ BACKEND - Carreras ya es array:', carrerasArray);
      }

      console.log('🎓 BACKEND - Array final de carreras:', carrerasArray);
      console.log('🎓 BACKEND - Cantidad de carreras:', carrerasArray.length);

      if (carrerasArray.length > 0) {
        for (let i = 0; i < carrerasArray.length; i++) {
          const carreraId = carrerasArray[i];
          console.log(`  📌 BACKEND - Insertando carrera ${i + 1}: ID=${carreraId}`);
          
          try {
            const [insertResult] = await connection.execute(
              'INSERT INTO evento_carrera (SECUENCIALEVENTO, SECUENCIALCARRERA) VALUES (?, ?)',
              [eventoId, carreraId]
            );
            console.log(`  ✅ BACKEND - Carrera ${carreraId} insertada con ID: ${insertResult.insertId}`);
          } catch (insertError) {
            console.error(`  ❌ BACKEND - Error insertando carrera ${carreraId}:`, insertError);
            throw insertError;
          }
        }
        console.log(`🎓 BACKEND - ${carrerasArray.length} carreras insertadas exitosamente`);
      } else {
        console.log('⚠️ BACKEND - No hay carreras para insertar');
      }
    } else {
      console.log('⚠️ BACKEND - Carreras es null o undefined');
    }

    // Actualizar imagen si existe
    if (req.file) {
      const imageUrl = `uploads/eventos/${req.file.filename}`;
      
      await connection.execute(
        `DELETE FROM imagen_evento 
         WHERE SECUENCIALEVENTO = ? AND TIPO_IMAGEN = 'PORTADA'`,
        [eventoId]
      );

      await connection.execute(
        `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
         VALUES (?, ?, 'PORTADA')`,
        [eventoId, imageUrl]
      );
      
      console.log('✅ BACKEND - Imagen actualizada');
    }

    await connection.commit();
    console.log('✅ BACKEND - Transaction committed');

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: { 
        eventoId, 
        title, 
        type
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log('🔄 BACKEND - Transaction rolled back');
    }
    console.error('❌ BACKEND - Error al actualizar evento:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el evento',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todos los eventos
const obtenerEventos = async (req, res) => {
  try {
    const [eventos] = await pool.execute(
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
        MAX(ie.URL_IMAGEN) as URL_IMAGEN
       FROM evento e
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       GROUP BY e.SECUENCIAL
       ORDER BY e.SECUENCIAL DESC`
    );

    // ✅ OBTENER CARRERAS DE CADA EVENTO
    for (let evento of eventos) {
      const [carreras] = await pool.execute(
        `SELECT c.SECUENCIAL, c.NOMBRE_CARRERA
         FROM evento_carrera ec
         INNER JOIN carrera c ON ec.SECUENCIALCARRERA = c.SECUENCIAL
         WHERE ec.SECUENCIALEVENTO = ?`,
        [evento.SECUENCIAL]
      );
      evento.CARRERAS = carreras;
    }
    
    res.json({
      success: true,
      data: eventos
    });
  } catch (error) {
    console.error('❌ Error al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message
    });
  }
};

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

    // ✅ OBTENER CARRERAS DEL EVENTO
    const [carreras] = await pool.execute(
      `SELECT c.SECUENCIAL, c.NOMBRE_CARRERA
       FROM evento_carrera ec
       INNER JOIN carrera c ON ec.SECUENCIALCARRERA = c.SECUENCIAL
       WHERE ec.SECUENCIALEVENTO = ?`,
      [eventoId]
    );

    const evento = rows[0];
    evento.CARRERAS = carreras;

    res.json({
      success: true,
      data: evento
    });
  } catch (error) {
    console.error('❌ Error al obtener evento:', error);
    res.status(500).json({ 
      error: 'Error al obtener evento',
      details: error.message
    });
  }
};

// Obtener imágenes (mantener igual)
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

// Eliminar evento
const eliminarEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const eventoId = req.params.id;

    // ✅ ELIMINAR CARRERAS ASOCIADAS
    await connection.execute(
      'DELETE FROM evento_carrera WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );

    // Eliminar imágenes
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