const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Crear evento
const crearEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      docente, objective, topics, startDate, endDate, carreras
    } = req.body;
    
    console.log('📝 Creando evento:', title);
    
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

    const contenidoObject = {
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
        ASISTENCIAMINIMA,
        Docente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'CREADO', ?, ?)`,
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
        attendanceRequired || null,
        docente || null
      ]
    );

    const eventoId = eventoResult.insertId;
    console.log('✅ Evento creado con ID:', eventoId);

    // Guardar carreras
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
        console.log(`✅ ${carrerasArray.length} carreras asociadas`);
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

// Actualizar solo la imagen de un evento
const actualizarImagenEvento = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const eventoId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere un archivo de imagen' });
    }

    // Obtener imágenes anteriores
    const [previousImages] = await connection.execute(
      `SELECT URL_IMAGEN FROM imagen_evento WHERE SECUENCIALEVENTO = ? AND TIPO_IMAGEN = 'PORTADA'`,
      [eventoId]
    );

    // Eliminar registros anteriores de portada
    await connection.execute(
      `DELETE FROM imagen_evento WHERE SECUENCIALEVENTO = ? AND TIPO_IMAGEN = 'PORTADA'`,
      [eventoId]
    );

    // Intentar eliminar archivos físicos anteriores (no bloquear si falla)
    for (const img of previousImages) {
      try {
        const filePath = path.join(process.cwd(), img.URL_IMAGEN);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('No se pudo borrar archivo anterior:', e.message);
      }
    }

    // Insertar nueva imagen
    const imageUrl = `uploads/eventos/${req.file.filename}`;
    const [insertResult] = await connection.execute(
      `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) VALUES (?, ?, 'PORTADA')`,
      [eventoId, imageUrl]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Imagen del evento actualizada',
      data: {
        imagenId: insertResult.insertId,
        imageUrl
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al actualizar imagen del evento:', error);
    res.status(500).json({ error: 'Error al actualizar la imagen', details: error.message });
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
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      docente, 
      objective, topics, isPaid,
      startDate, endDate, carreras
    } = req.body;
    
    console.log('📝 Actualizando evento ID:', eventoId);
    console.log('👨‍🏫 Docente:', docente);
    
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

    // ✅ CONTENIDO SOLO CON TOPICS (sin teacher)
    const contenidoObject = {
      topics: topicsArray
    };

    const contenidoJSON = JSON.stringify(contenidoObject);

    // ✅ ACTUALIZAR EVENTO CON CAMPO DOCENTE
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
        ASISTENCIAMINIMA = ?,
        Docente = ?
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
        docente || null, // ✅ AGREGAR DOCENTE
        eventoId
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Evento no encontrado' 
      });
    }

    console.log('✅ Evento actualizado');

    // Actualizar carreras
    console.log('🎓 Procesando carreras...');
    await connection.execute(
      'DELETE FROM evento_carrera WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );

    if (carreras) {
      let carrerasArray = [];
      
      if (typeof carreras === 'string') {
        try {
          carrerasArray = JSON.parse(carreras);
        } catch (e) {
          carrerasArray = [];
        }
      } else if (Array.isArray(carreras)) {
        carrerasArray = carreras;
      }

      if (carrerasArray.length > 0) {
        for (const carreraId of carrerasArray) {
          await connection.execute(
            'INSERT INTO evento_carrera (SECUENCIALEVENTO, SECUENCIALCARRERA) VALUES (?, ?)',
            [parseInt(eventoId), parseInt(carreraId)]
          );
        }
        console.log(`✅ ${carrerasArray.length} carreras asociadas`);
      }
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
    }

    await connection.commit();

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
        e.Docente,
        MAX(ie.URL_IMAGEN) as URL_IMAGEN
       FROM evento e
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       GROUP BY e.SECUENCIAL
       ORDER BY e.SECUENCIAL DESC`
    );

    // Obtener carreras de cada evento
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
  eliminarEvento,
  actualizarImagenEvento
};
