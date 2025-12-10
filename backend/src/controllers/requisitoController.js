const { pool } = require('../config/database');

// Obtener requisitos (ESTO SE QUEDA IGUAL)
exports.getRequisitosEvento = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM requisito_evento WHERE SECUENCIALEVENTO = ?', [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener requisitos' });
  }
};

// Guardar archivos (PEQUEÑOS AJUSTES)
exports.subirArchivosRequisitos = async (req, res) => {
  const { inscripcionId } = req.body;
  
  // Validación básica
  if (!inscripcionId) return res.status(400).json({ error: 'Falta inscripcionId' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se enviaron archivos' });

  try {
    // 1. Obtener ID del evento
    const [insc] = await pool.query('SELECT SECUENCIALEVENTO FROM inscripcion WHERE SECUENCIAL = ?', [inscripcionId]);
    if (!insc.length) return res.status(404).json({ error: 'Inscripción no encontrada' });
    
    const eventoId = insc[0].SECUENCIALEVENTO;
    const [requisitos] = await pool.query('SELECT * FROM requisito_evento WHERE SECUENCIALEVENTO = ?', [eventoId]);

    // 2. Validar obligatorios
    // Esto funciona igual porque Multer (Cloudinary) sigue llenando req.files
    const faltantes = requisitos.filter(r => r.ES_OBLIGATORIO && !req.files.find(f => f.fieldname === `requisito_${r.SECUENCIAL}`));
    
    if (faltantes.length) {
      return res.status(400).json({ error: 'Faltan requisitos obligatorios', faltantes });
    }

    // 3. Guardar en Base de Datos
    for (const file of req.files) {
      const secuencialReq = file.fieldname.split('_')[1];
      
      // AQUÍ ESTÁ LA MAGIA: 
      // file.path ahora contiene la URL de Cloudinary (ej: https://res.cloudinary.com/...)
      // No tienes que cambiar nada aquí, solo asegurarte de que tu columna URLARCHIVO sea lo suficientemente larga (TEXT o VARCHAR 255+)
      
      await pool.query(
        'INSERT INTO archivo_requisito (SECUENCIALINSCRIPCION, SECUENCIALREQUISITO, URLARCHIVO, CODIGOESTADOVALIDACION) VALUES (?, ?, ?, ?)',
        [inscripcionId, secuencialReq, file.path, 'PEN']
      );
    }

    res.json({ success: true, message: 'Requisitos subidos correctamente' });

  } catch (err) {
    console.error("Error en subirArchivosRequisitos:", err); // Agrega console.error para ver errores en Render/Heroku
    res.status(500).json({ error: 'Error al subir archivos de requisitos' });
  }
};