const { pool } = require('../config/database');
const { cloudinary, uploadHome } = require('../config/cloudinary');
const { buildImageUrl } = require('../utils/imageUrlHelper');

// Subir imagen al carrusel
const subirImagenCarrusel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se recibió ninguna imagen'
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const { titulo, subtitulo, enlace, orden, activo } = req.body;
    const imageUrl = req.file.path; // URL de Cloudinary

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
        imageUrl: imageUrl // Ya es URL de Cloudinary
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
      URL_IMAGEN: buildImageUrl(img.URL_IMAGEN, req)
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

// Obtener contenido del home
const obtenerHome = async (req, res) => {
  console.log('🔔 GET /api/config/home called');
  try {
    const [config] = await pool.execute(
      "SELECT valor FROM configuracion WHERE clave = 'contenido_home'"
    );

    if (config.length === 0) {
      // Retornar contenido por defecto
      const defaultContent = {
        hero: {
          useCourses: true, // Indica que hero usa el carrusel de cursos
          fallbackTitle: 'Fundamentos en python',
          fallbackDescription: 'En este curso aprenderás desde lo básico hasta programación orientada a objetos.',
          fallbackButtonText: 'Saber Más',
          fallbackImageUrl: '/assets/images/hero-code.png'
        },
        sections: [
          {
            id: 'courses',
            type: 'courses',
            enabled: true,
            order: 1,
            title: 'Cursos Populares',
            description: ''
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            enabled: true,
            order: 2,
            title: 'Nuestros estudiantes dicen',
            items: [
              {
                name: 'María López',
                role: 'Estudiante',
                text: 'Este curso me ayudó a entender los conceptos básicos y a ganar confianza para seguir aprendiendo. ¡Lo recomiendo!',
                avatar: 'https://i.pravatar.cc/120?img=32'
              },
              {
                name: 'Carlos Ramírez',
                role: 'Desarrollador',
                text: 'Las clases son prácticas y claras. Pude aplicar lo aprendido en proyectos reales en poco tiempo.',
                avatar: 'https://i.pravatar.cc/120?img=15'
              },
              {
                name: 'Ana Pérez',
                role: 'Analista',
                text: 'Excelente contenido y buen ritmo. El soporte del responsable fue muy útil.',
                avatar: 'https://i.pravatar.cc/120?img=47'
              }
            ]
          }
        ]
      };
      return res.json({
        success: true,
        data: defaultContent
      });
    }

    const content = JSON.parse(config[0].valor);

    // Construir URLs completas para las imágenes en secciones
    if (content.sections && Array.isArray(content.sections)) {
      content.sections = content.sections.map(section => {
        // Procesar imágenes según el tipo de sección
        if (section.type === 'testimonials' && section.items) {
          section.items = section.items.map(item => ({
            ...item,
            avatar: item.avatar && !item.avatar.startsWith('http') ? buildImageUrl(item.avatar, req) : item.avatar
          }));
        } else if (section.type === 'content-image' && section.imageUrl && !section.imageUrl.startsWith('http')) {
          section.imageUrl = buildImageUrl(section.imageUrl, req);
        } else if (section.type === 'gallery' && section.images) {
          section.images = section.images.map(img => ({
            ...img,
            url: img.url && !img.url.startsWith('http') ? buildImageUrl(img.url, req) : img.url
          }));
        } else if (section.type === 'cards' && section.items) {
          section.items = section.items.map(item => ({
            ...item,
            imageUrl: item.imageUrl && !item.imageUrl.startsWith('http') ? buildImageUrl(item.imageUrl, req) : item.imageUrl
          }));
        }
        return section;
      });
    }

    // Construir URLs para hero fallback
    if (content.hero && content.hero.fallbackImageUrl && !content.hero.fallbackImageUrl.startsWith('http')) {
      content.hero.fallbackImageUrl = buildImageUrl(content.hero.fallbackImageUrl, req);
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error al obtener contenido home:', error);
    res.status(500).json({
      error: 'Error al obtener el contenido',
      details: error.message
    });
  }
};

// Actualizar contenido del home
const actualizarHome = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Parsear el contenido enviado
    const content = JSON.parse(req.body.content || '{}');

    // Crear un mapa de archivos subidos por fieldname (URLs de Cloudinary)
    const uploadedFiles = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        uploadedFiles[file.fieldname] = file.path; // URL de Cloudinary
      });
    }

    // Procesar imágenes en el contenido
    if (content.hero && uploadedFiles['heroFallbackImage']) {
      content.hero.fallbackImageUrl = uploadedFiles['heroFallbackImage'];
    }

    // Procesar secciones
    if (content.sections && Array.isArray(content.sections)) {
      content.sections = content.sections.map((section, sectionIndex) => {
        if (section.type === 'testimonials' && section.items) {
          section.items = section.items.map((item, itemIndex) => {
            const fieldName = `section_${sectionIndex}_item_${itemIndex}_avatar`;
            if (uploadedFiles[fieldName]) {
              item.avatar = uploadedFiles[fieldName];
            }
            return item;
          });
        } else if (section.type === 'content-image') {
          const fieldName = `section_${sectionIndex}_image`;
          if (uploadedFiles[fieldName]) {
            section.imageUrl = uploadedFiles[fieldName];
          }
        } else if (section.type === 'gallery' && section.images) {
          section.images = section.images.map((img, imgIndex) => {
            const fieldName = `section_${sectionIndex}_gallery_${imgIndex}`;
            if (uploadedFiles[fieldName]) {
              img.url = uploadedFiles[fieldName];
            }
            return img;
          });
        } else if (section.type === 'cards' && section.items) {
          section.items = section.items.map((item, itemIndex) => {
            const fieldName = `section_${sectionIndex}_card_${itemIndex}_image`;
            if (uploadedFiles[fieldName]) {
              item.imageUrl = uploadedFiles[fieldName];
            }
            return item;
          });
        }
        return section;
      });
    }

    const contentJSON = JSON.stringify(content);

    // Verificar si ya existe configuración
    const [existing] = await connection.execute(
      "SELECT * FROM configuracion WHERE clave = 'contenido_home'"
    );

    if (existing.length > 0) {
      // Actualizar
      await connection.execute(
        "UPDATE configuracion SET valor = ? WHERE clave = 'contenido_home'",
        [contentJSON]
      );
    } else {
      // Insertar
      await connection.execute(
        "INSERT INTO configuracion (clave, valor, descripcion) VALUES ('contenido_home', ?, 'Contenido de la página principal')",
        [contentJSON]
      );
    }

    res.json({
      success: true,
      message: 'Contenido actualizado correctamente',
      data: content
    });
  } catch (error) {
    console.error('Error al actualizar contenido home:', error);
    res.status(500).json({
      error: 'Error al actualizar el contenido',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  subirImagenCarrusel,
  obtenerImagenesCarrusel,
  eliminarImagenCarrusel,
  guardarColores,
  obtenerColores,
  obtenerHome,
  actualizarHome,
};