const { pool } = require('../config/database');
const { cloudinary } = require('../config/cloudinary');
const { buildImageUrl } = require('../utils/imageUrlHelper');

// Crear evento
const crearEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { 
      title, type, attendanceRequired, passingGrade,
      capacity, hours, modality, cost, description,
      docente, objective, topics, modules, startDate, endDate, carreras,

      responsableId, categoriaId, requirements, codigoTipoEvento // NEW
    } = req.body;
    
    // Log request body and file for debugging
    console.log('📝 Creando evento:', title);
    
    if (!title) {
      return res.status(400).json({ 
        error: 'El nombre del evento es obligatorio' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: 'La imagen del evento es obligatoria' 
      });
    }

    // Try to derive generic type code for legacy compatibility
    const tipoEventoMap = {
      'Curso': 'CUR',
      'Taller': 'TALL',
      'Seminario': 'SEM',
      'Conferencia': 'CONF'
    };
    // Default to CUR if not found or if type is just descriptive ID
    // If specific code is provided, use it (e.g. from dropdown with DB codes)
    const codigoTipo = codigoTipoEvento || tipoEventoMap[type] || 'CUR';

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
      topics: topicsArray,
      modules: modules ? (typeof modules === 'string' ? JSON.parse(modules) : modules) : []
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
        Docente,
        SECUENCIALCATEGORIA
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'CREADO', ?, ?, ?)`,
      [
        title,
        objective || description || '',
        contenidoJSON,
        codigoTipo,
        startDate || new Date().toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0],
        codigoModalidad,
        hours || 0,
        capacity || null,
        passingGrade || null,
        parseFloat(cost || 0) > 0 ? 1 : 0,
        cost || 0,
        attendanceRequired || null,
        docente || '',
        categoriaId || null
      ]
    );

    const eventoId = eventoResult.insertId;
    console.log('✅ Evento creado con ID:', eventoId);

    // Guardar requirements en tabla requisito_evento
    if (requirements) {
      let requirementsArray = [];
      if (typeof requirements === 'string') {
        try {
          requirementsArray = JSON.parse(requirements);
        } catch (e) {
          requirementsArray = [requirements]; // fallback
        }
      } else if (Array.isArray(requirements)) {
        requirementsArray = requirements;
      }

      for (const reqItem of requirementsArray) {
        // reqItem puede ser string ("Cédula") u objeto ({description: "Cédula", required: true})
        const desc = typeof reqItem === 'object' ? (reqItem.description || reqItem.nombre) : reqItem;
        const oblig = typeof reqItem === 'object' ? (reqItem.required !== false ? 1 : 0) : 1; // Default true
        
        if (desc) {
          await connection.execute(
            'INSERT INTO requisito_evento (SECUENCIALEVENTO, DESCRIPCION, ES_OBLIGATORIO) VALUES (?, ?, ?)',
            [eventoId, desc, oblig]
          );
        }
      }
      console.log(`✅ ${requirementsArray.length} requisitos asociados`);
    }

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

    // Asociar responsable en tabla puente (si existe la tabla)
    if (responsableId) {
      await connection.execute(
        'INSERT INTO organizador_evento (SECUENCIALUSUARIO, SECUENCIALEVENTO, ROL_ORGANIZADOR) VALUES (?, ?, ?)',
        [responsableId, eventoId, 'RESPONSABLE']
      );
      console.log('✅ Responsable asociado en organizador_evento:', responsableId);
    }

    // Guardar imagen (Cloudinary ya subió el archivo)
    const imageUrl = req.file.path; // URL de Cloudinary
    const [imagenResult] = await connection.execute(
      `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
       VALUES (?, ?, 'PORTADA')`,
      [eventoId, imageUrl]
    );

    await connection.commit();

    // La URL ya es absoluta desde Cloudinary
    const absoluteImageUrl = imageUrl;

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        eventoId,
        imagenId: imagenResult.insertId,
        title,
        type,
        imageUrl: absoluteImageUrl
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

    // Eliminar imágenes anteriores de Cloudinary
    for (const img of previousImages) {
      try {
        if (img.URL_IMAGEN && img.URL_IMAGEN.includes('cloudinary')) {
          const publicId = img.URL_IMAGEN.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.warn('No se pudo borrar imagen anterior de Cloudinary:', e.message);
      }
    }

    // Insertar nueva imagen (Cloudinary ya subió el archivo)
    const imageUrl = req.file.path; // URL de Cloudinary
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
        imageUrl: imageUrl
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

    // Aceptar formato plano o con `meta` (frontend usa `meta`) y aceptar aliases en español/inglés
    const source = req.body && req.body.meta ? { ...req.body, ...req.body.meta } : req.body || {};

    // Aceptar tanto `title` como `nombre`, y `type` como `tipo`
    const title = source.title || source.nombre;
    const type = source.type || source.tipo;
    const attendanceRequired = source.attendanceRequired;
    const passingGrade = source.passingGrade;
    const capacity = source.capacity;
    const hours = source.hours;
    const modality = source.modality;
    // El frontend usa `price`; el backend espera `cost`
    const cost = source.cost ?? source.price ?? 0;
    const description = source.description || source.objective || '';
    const docente = source.docente;
    const responsableId = source.responsableId; // para asignar/actualizar responsable
    const objective = source.objective;
    const topics = source.topics;
    const isPaid = source.isPaid;
    const startDate = source.startDate;
    const endDate = source.endDate;
    const carreras = source.carreras;
    const categoriaId = source.categoriaId; // NEW
    const requirements = source.requirements; // NEW
    const modules = source.modules; // NEW: Modules support

    console.log('📝 Actualizando evento ID:', eventoId);
    console.log('👨‍🏫 Docente:', docente);
    
    // if (!title || !type) {
    if (!title) {
      return res.status(400).json({ 
        error: 'El nombre del evento es obligatorio' 
      });
    }

    const tipoEventoMap = {
      'Curso': 'CUR',
      'Taller': 'TALL',
      'Seminario': 'SEM',
      'Conferencia': 'CONF'
    };
    
    // Use explicit code if provided (e.g. from frontend edit), else map from description
    const codigoTipo = source.codigoTipoEvento || tipoEventoMap[type] || 'CUR';

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

    // ✅ CONTENIDO: Priorizar Módulos. Solo guardar topics legacy si existen.
    const contenidoObject = {
      modules: modules ? (typeof modules === 'string' ? JSON.parse(modules) : modules) : []
    };

    if (topicsArray && topicsArray.length > 0) {
      contenidoObject.topics = topicsArray;
    }

    const contenidoJSON = JSON.stringify(contenidoObject);

    // ✅ ACTUALIZAR EVENTO CON CAMPO DOCENTE Y CATEGORIA
    const updateValues = [
        title,
        objective || description || '',
        contenidoJSON,
        codigoTipo,
        startDate || new Date().toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0],
        codigoModalidad,
        hours || 0,
        capacity || null,
        passingGrade || null,
        parseFloat(cost || 0) > 0 ? 1 : 0,
        cost || 0,
        attendanceRequired || null,
        docente || null,
        categoriaId || null,
        eventoId
    ];

    console.log('📝 Update Values:', updateValues);

    const [result] = await connection.execute(
      `UPDATE evento SET
        TITULO = ?,
        DESCRIPCION = ?,
        CONTENIDO = ?,
        CODIGOTIPOEVENTO = ?,
        FECHAINICIO = ?,
        FECHAFIN = ?,
        CODIGOMODALIDAD = ?,
        HORAS = ?,
        CAPACIDAD = ?,
        NOTAAPROBACION = ?,
        ES_PAGADO = ?,
        COSTO = ?,
        ASISTENCIAMINIMA = ?,
        Docente = ?,
        SECUENCIALCATEGORIA = COALESCE(?, SECUENCIALCATEGORIA)
      WHERE SECUENCIAL = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Evento no encontrado' 
      });
    }

    console.log('✅ Evento actualizado');

    // Actualizar responsable en tabla puente
    await connection.execute(
      'DELETE FROM organizador_evento WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );

    if (responsableId) {
      await connection.execute(
        'INSERT INTO organizador_evento (SECUENCIALUSUARIO, SECUENCIALEVENTO, ROL_ORGANIZADOR) VALUES (?, ?, ?)',
        [responsableId, eventoId, 'RESPONSABLE']
      );
      console.log('✅ Responsable actualizado en organizador_evento:', responsableId);
    }

    // Actualizar carreras (borrar y crear)
    await connection.execute('DELETE FROM evento_carrera WHERE SECUENCIALEVENTO = ?', [eventoId]);
    
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

      for (const carreraId of carrerasArray) {
        await connection.execute(
          'INSERT INTO evento_carrera (SECUENCIALEVENTO, SECUENCIALCARRERA) VALUES (?, ?)',
          [eventoId, carreraId]
        );
      }
    }

    // Actualizar requisitos (borrar y crear)
    if (requirements) {
      // Borrar anteriores
      await connection.execute('DELETE FROM requisito_evento WHERE SECUENCIALEVENTO = ?', [eventoId]);

      let requirementsArray = [];
      if (typeof requirements === 'string') {
        try {
          requirementsArray = JSON.parse(requirements);
        } catch (e) {
          requirementsArray = [requirements];
        }
      } else if (Array.isArray(requirements)) {
        requirementsArray = requirements;
      }

      for (const reqItem of requirementsArray) {
        const desc = typeof reqItem === 'object' ? (reqItem.description || reqItem.nombre) : reqItem;
        const oblig = typeof reqItem === 'object' ? (reqItem.required !== false ? 1 : 0) : 1; 

        if (desc) {
          await connection.execute(
            'INSERT INTO requisito_evento (SECUENCIALEVENTO, DESCRIPCION, ES_OBLIGATORIO) VALUES (?, ?, ?)',
            [eventoId, desc, oblig]
          );
        }
      }
      console.log('✅ Requisitos actualizados');
    }

    // Actualizar imagen si existe
    if (req.file) {
      const imageUrl = req.file.path; // URL de Cloudinary
      
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

    // Usar URL de Cloudinary directamente si se actualizó/insertó imagen
    let responseData = { eventoId, title, type };
    if (req.file) {
      responseData.imageUrl = req.file.path; // URL de Cloudinary
    }

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: responseData
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

// Actualizar solo responsable del evento
const actualizarResponsableEvento = async (req, res) => {
  let connection;
  const eventoId = req.params.id;
  const { responsableId } = req.body;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar que el evento exista
    const [eventoRows] = await connection.execute(
      'SELECT SECUENCIAL FROM evento WHERE SECUENCIAL = ?',
      [eventoId]
    );

    if (eventoRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Limpiar responsable previo
    await connection.execute(
      'DELETE FROM organizador_evento WHERE SECUENCIALEVENTO = ?',
      [eventoId]
    );

    // Insertar nuevo responsable si se envió
    if (responsableId) {
      await connection.execute(
        'INSERT INTO organizador_evento (SECUENCIALUSUARIO, SECUENCIALEVENTO, ROL_ORGANIZADOR) VALUES (?, ?, ?)',
        [responsableId, eventoId, 'RESPONSABLE']
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Responsable actualizado'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al actualizar responsable del evento:', error);
    res.status(500).json({ error: 'Error al actualizar el responsable', details: error.message });
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
        e.SECUENCIALCATEGORIA,
        ce.NOMBRE as NOMBRE_CATEGORIA,
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
        MAX(ie.URL_IMAGEN) as URL_IMAGEN,
        te.NOMBRE as NOMBRE_TIPO_EVENTO
       FROM evento e
       LEFT JOIN categoria_evento ce ON e.SECUENCIALCATEGORIA = ce.SECUENCIAL
       LEFT JOIN tipo_evento te ON e.CODIGOTIPOEVENTO = te.CODIGO
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       GROUP BY e.SECUENCIAL, te.NOMBRE
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
    
    // Convertir URL_IMAGEN relativo a URL absoluta
    const mapped = eventos.map(ev => ({
      ...ev,
      URL_IMAGEN: buildImageUrl(ev.URL_IMAGEN, req)
    }));

    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('❌ Error al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message
    });
  }
};

// Obtener eventos asignados a un responsable
const obtenerEventosResponsable = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT 
        e.SECUENCIAL,
        e.TITULO,
        e.DESCRIPCION,
        e.CONTENIDO,
        e.CODIGOTIPOEVENTO,
        e.SECUENCIALCATEGORIA,
         ce.NOMBRE as NOMBRE_CATEGORIA,
        te.NOMBRE as NOMBRE_TIPO_EVENTO,
        e.CODIGOMODALIDAD,
        e.HORAS,
        e.NOTAAPROBACION,
        e.CAPACIDAD,
        e.COSTO,
        e.ES_PAGADO,
        e.ASISTENCIAMINIMA,
        e.FECHAINICIO,
        e.FECHAFIN,
        e.Docente,
        e.Docente,
        MAX(ie.URL_IMAGEN) as URL_IMAGEN
       FROM organizador_evento oe
       INNER JOIN evento e ON oe.SECUENCIALEVENTO = e.SECUENCIAL
       LEFT JOIN categoria_evento ce ON e.SECUENCIALCATEGORIA = ce.SECUENCIAL
       LEFT JOIN tipo_evento te ON e.CODIGOTIPOEVENTO = te.CODIGO
       LEFT JOIN imagen_evento ie ON ie.SECUENCIALEVENTO = e.SECUENCIAL AND ie.TIPO_IMAGEN = 'PORTADA'
       WHERE oe.SECUENCIALUSUARIO = ?
       GROUP BY e.SECUENCIAL, te.NOMBRE
       ORDER BY e.SECUENCIAL DESC`,
      [id]
    );

      const eventosConCarreras = [];

      for (const evento of rows) {
        const [carreras] = await pool.execute(
          `SELECT c.SECUENCIAL, c.NOMBRE_CARRERA
           FROM evento_carrera ec
           INNER JOIN carrera c ON ec.SECUENCIALCARRERA = c.SECUENCIAL
           WHERE ec.SECUENCIALEVENTO = ?`,
          [evento.SECUENCIAL]
        );

        // Fetch requirements
        const [requisitos] = await pool.execute(
          `SELECT SECUENCIAL, DESCRIPCION, ES_OBLIGATORIO
           FROM requisito_evento
           WHERE SECUENCIALEVENTO = ?`,
          [evento.SECUENCIAL]
        );

        eventosConCarreras.push({
          ...evento,
          CARRERAS: carreras,
          REQUISITOS: requisitos
        });
      }

      const mapped = eventosConCarreras.map(ev => ({
        ...ev,
        URL_IMAGEN: buildImageUrl(ev.URL_IMAGEN, req)
      }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('❌ Error al obtener eventos del responsable:', error);
    res.status(500).json({ error: 'Error al obtener eventos del responsable', details: error.message });
  }
};

// Obtener un evento específico
const obtenerEvento = async (req, res) => {
  try {
    const eventoId = req.params.id;
    
    const [rows] = await pool.execute(
      `SELECT 
        e.*,
        ce.NOMBRE as NOMBRE_CATEGORIA,
        te.NOMBRE as NOMBRE_TIPO_EVENTO,
        ie.URL_IMAGEN,
        CONCAT(u.NOMBRES, ' ', u.APELLIDOS) as NOMBRE_DOCENTE
       FROM evento e
       LEFT JOIN categoria_evento ce ON e.SECUENCIALCATEGORIA = ce.SECUENCIAL
       LEFT JOIN tipo_evento te ON e.CODIGOTIPOEVENTO = te.CODIGO
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       LEFT JOIN usuario u ON e.Docente = u.SECUENCIAL
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

    // ✅ OBTENER REQUISITOS DEL EVENTO (NUEVO)
    const [requisitos] = await pool.execute(
      `SELECT SECUENCIAL, DESCRIPCION, ES_OBLIGATORIO
       FROM requisito_evento
       WHERE SECUENCIALEVENTO = ?`,
      [eventoId]
    );

    const evento = rows[0];
    evento.CARRERAS = carreras;
    evento.REQUISITOS = requisitos; // Enviar al frontend

    // Convertir URL_IMAGEN a URL absoluta
    evento.URL_IMAGEN = buildImageUrl(evento.URL_IMAGEN, req);

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
      data: rows.map(img => ({
        ...img,
        URL_IMAGEN: buildImageUrl(img.URL_IMAGEN, req)
      }))
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


// Nuevo endpoint para filtrar eventos/cursos
const obtenerEventosFiltrados = async (req, res) => {
  try {
    const { tipo, pagado } = req.query;
    let filtros = [];
    let params = [];
    if (tipo) {
      filtros.push('e.CODIGOTIPOEVENTO = ?');
      params.push(tipo);
    }
    if (pagado !== undefined) {
      filtros.push('e.ES_PAGADO = ?');
      params.push(Number(pagado));
    }
    let where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
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
        MAX(ie.URL_IMAGEN) as URL_IMAGEN,
        te.NOMBRE as NOMBRE_TIPO_EVENTO
       FROM evento e
       LEFT JOIN tipo_evento te ON e.CODIGOTIPOEVENTO = te.CODIGO
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       ${where}
       GROUP BY e.SECUENCIAL
       ORDER BY e.SECUENCIAL DESC`,
      params
    );

    const mapped = eventos.map(ev => ({
      ...ev,
      URL_IMAGEN: buildImageUrl(ev.URL_IMAGEN, req)
    }));

    res.json({
      success: true,
      data: mapped
    });
  } catch (error) {
    console.error('❌ Error al filtrar eventos:', error);
    res.status(500).json({ error: 'Error al filtrar eventos', details: error.message });
  }
};

// Obtener categorías de evento
const obtenerCategoriasEvento = async (req, res) => {
  try {
    const [categorias] = await pool.execute(
      'SELECT SECUENCIAL, NOMBRE, DESCRIPCION FROM categoria_evento ORDER BY NOMBRE ASC'
    );
    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: error.message });
  }
};


// Obtener tipos de evento
const obtenerTiposEvento = async (req, res) => {
  try {
    const [tipos] = await pool.execute(
      'SELECT CODIGO, NOMBRE, DESCRIPCION FROM tipo_evento ORDER BY NOMBRE ASC'
    );
    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error al obtener tipos de evento:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  obtenerEventosResponsable,
  actualizarEvento,
  actualizarResponsableEvento,
  eliminarEvento,
  obtenerImagenes,
  actualizarImagenEvento,
  obtenerEventosFiltrados,
  obtenerCategoriasEvento,
  obtenerTiposEvento
};
