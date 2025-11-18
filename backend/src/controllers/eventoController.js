const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configuración de multer para actualizar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/eventos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `portada_${uniqueSuffix}${ext}`);
  }
});

const uploadActualizarImagen = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
}).single('imagen');

// Actualizar imagen de evento
const actualizarImagenEvento = async (req, res) => {
  uploadActualizarImagen(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: 'Error al subir imagen',
        details: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No se recibió ninguna imagen'
      });
    }

    const { id } = req.params;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Verificar que el evento existe
      const [evento] = await connection.execute(
        'SELECT SECUENCIAL FROM evento WHERE SECUENCIAL = ?',
        [id]
      );

      if (evento.length === 0) {
        return res.status(404).json({
          error: 'Evento no encontrado'
        });
      }

      // Obtener la imagen actual para eliminarla (opcional)
      const [imagenActual] = await connection.execute(
        `SELECT URL_IMAGEN FROM imagen_evento 
         WHERE SECUENCIALEVENTO = ? AND TIPO_IMAGEN = 'PORTADA'`,
        [id]
      );

      const nuevaImagenUrl = `uploads/eventos/${req.file.filename}`;

      if (imagenActual.length > 0) {
        // Actualizar imagen existente
        await connection.execute(
          `UPDATE imagen_evento 
           SET URL_IMAGEN = ? 
           WHERE SECUENCIALEVENTO = ? AND TIPO_IMAGEN = 'PORTADA'`,
          [nuevaImagenUrl, id]
        );
      } else {
        // Insertar nueva imagen
        await connection.execute(
          `INSERT INTO imagen_evento (SECUENCIALEVENTO, URL_IMAGEN, TIPO_IMAGEN) 
           VALUES (?, ?, 'PORTADA')`,
          [id, nuevaImagenUrl]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Imagen actualizada exitosamente',
        data: {
          imageUrl: `http://localhost:5000/${nuevaImagenUrl}`
        }
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al actualizar imagen:', error);
      res.status(500).json({
        error: 'Error al actualizar la imagen',
        details: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  });
};

// Crear nuevo evento completo con imagen
const crearEvento = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Iniciar transacción
    
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
    
    // Convertir URLs relativas a URLs absolutas
    const imagenesConUrls = rows.map(imagen => ({
      ...imagen,
      URL_IMAGEN: imagen.URL_IMAGEN ? `http://localhost:5000/${imagen.URL_IMAGEN}` : null
    }));
    
    res.json({
      success: true,
      data: imagenesConUrls
    });
  } catch (error) {
    console.error('❌ Error al obtener imágenes:', error);
    res.status(500).json({ 
      error: 'Error al obtener las imágenes',
      details: error.message
    });
  }
};

// Obtener todos los eventos
const obtenerEventos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        e.SECUENCIAL,
        e.TITULO,
        e.DESCRIPCION,
        e.CODIGOTIPOEVENTO,
        e.NOTAAPROBACION,
        e.ASISTENCIAMINIMA,
        e.COSTO,
        e.ES_PAGADO,
        ie.URL_IMAGEN
       FROM evento e
       LEFT JOIN imagen_evento ie ON e.SECUENCIAL = ie.SECUENCIALEVENTO 
       AND ie.TIPO_IMAGEN = 'PORTADA'
       ORDER BY e.SECUENCIAL DESC`
    );
    
    // Convertir URLs relativas a URLs absolutas
    const eventosConUrls = rows.map(evento => ({
      ...evento,
      URL_IMAGEN: evento.URL_IMAGEN ? `http://localhost:5000/${evento.URL_IMAGEN}` : null
    }));
    
    res.json({
      success: true,
      data: eventosConUrls
    });
  } catch (error) {
    console.error('❌ Error al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message
    });
  }
};

module.exports = {
  crearEvento,
  obtenerImagenes,
  obtenerEventos,
  actualizarImagenEvento
};