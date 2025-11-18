const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para imágenes del carrusel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/carrusel');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `carrusel-${uniqueSuffix}${ext}`);
  }
});

const uploadCarrusel = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// Subir imagen al carrusel
const subirImagenCarrusel = async (req, res) => {
  uploadCarrusel(req, res, async (err) => {
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

    let connection;
    try {
      connection = await pool.getConnection();

      const { titulo, subtitulo, enlace, orden, activo } = req.body;
      const imageUrl = `uploads/carrusel/${req.file.filename}`;

      const [result] = await connection.execute(
        `INSERT INTO carrusel (
          TITULO,
          SUBTITULO,
          URL_IMAGEN,
          ENLACE,
          ORDEN,
          ACTIVO
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          titulo || null,
          subtitulo || null,
          imageUrl,
          enlace || null,
          orden || 0,
          activo !== undefined ? activo : 1
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Imagen agregada al carrusel',
        data: {
          id: result.insertId,
          imageUrl: `http://localhost:5000/${imageUrl}`
        }
      });
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      res.status(500).json({
        error: 'Error al guardar la imagen',
        details: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  });
};

// Obtener todas las imágenes del carrusel
const obtenerImagenesCarrusel = async (req, res) => {
  try {
    const [imagenes] = await pool.execute(
      `SELECT 
        SECUENCIAL as id,
        TITULO,
        SUBTITULO,
        URL_IMAGEN,
        ENLACE,
        ORDEN,
        ACTIVO,
        FECHACREACION
       FROM carrusel
       WHERE ACTIVO = 1
       ORDER BY ORDEN ASC, SECUENCIAL DESC`
    );

    const imagenesConUrl = imagenes.map(img => ({
      ...img,
      URL_IMAGEN: `http://localhost:5000/${img.URL_IMAGEN}`
    }));

    res.json({
      success: true,
      data: imagenesConUrl
    });
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({
      error: 'Error al obtener las imágenes',
      details: error.message
    });
  }
};

// Eliminar imagen del carrusel
const eliminarImagenCarrusel = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();

    // Obtener la URL de la imagen antes de eliminar
    const [imagen] = await connection.execute(
      'SELECT URL_IMAGEN FROM carrusel WHERE SECUENCIAL = ?',
      [id]
    );

    if (imagen.length === 0) {
      return res.status(404).json({
        error: 'Imagen no encontrada'
      });
    }

    // Marcar como inactivo en lugar de eliminar
    await connection.execute(
      'UPDATE carrusel SET ACTIVO = 0 WHERE SECUENCIAL = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Imagen eliminada del carrusel'
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      error: 'Error al eliminar la imagen',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Guardar colores de la página
const guardarColores = async (req, res) => {
  const { colorPrimario, colorSecundario, colorTerciario } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();

    // Verificar si ya existe configuración de colores
    const [existing] = await connection.execute(
      "SELECT * FROM configuracion WHERE clave = 'colores_pagina'"
    );

    const coloresJSON = JSON.stringify({
      primario: colorPrimario || '#667eea',
      secundario: colorSecundario || '#51cf66',
      terciario: colorTerciario || '#845ef7'
    });

    if (existing.length > 0) {
      // Actualizar
      await connection.execute(
        "UPDATE configuracion SET valor = ? WHERE clave = 'colores_pagina'",
        [coloresJSON]
      );
    } else {
      // Insertar
      await connection.execute(
        "INSERT INTO configuracion (clave, valor) VALUES ('colores_pagina', ?)",
        [coloresJSON]
      );
    }

    res.json({
      success: true,
      message: 'Colores guardados correctamente',
      data: JSON.parse(coloresJSON)
    });
  } catch (error) {
    console.error('Error al guardar colores:', error);
    res.status(500).json({
      error: 'Error al guardar los colores',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener colores de la página
const obtenerColores = async (req, res) => {
  console.log('🔔 GET /api/config/colores called');
  try {
    const [config] = await pool.execute(
      "SELECT valor FROM configuracion WHERE clave = 'colores_pagina'"
    );

    if (config.length === 0) {
      // Retornar colores por defecto
      return res.json({
        success: true,
        data: {
          primario: '#667eea',
          secundario: '#51cf66',
          terciario: '#845ef7'
        }
      });
    }

    res.json({
      success: true,
      data: JSON.parse(config[0].valor)
    });
  } catch (error) {
    console.error('Error al obtener colores:', error);
    res.status(500).json({
      error: 'Error al obtener los colores',
      details: error.message
    });
  }
};

module.exports = {
  subirImagenCarrusel,
  obtenerImagenesCarrusel,
  eliminarImagenCarrusel,
  guardarColores,
  obtenerColores,
};