const { pool } = require('../config/database');

// 1. Crear Tarea (Profesor)
exports.crearTarea = async (req, res) => {
    try {
        const { moduloId, titulo, descripcion, fechaApertura, fechaLimite, puntos } = req.body;

        // Si Cloudinary subió el archivo, req.file tendrá la info
        let urlAdjunto = null;
        if (req.file) {
            urlAdjunto = req.file.path; // URL segura de Cloudinary
        }

        const [result] = await pool.query(
            `INSERT INTO tarea (SECUENCIALMODULO, TITULO, DESCRIPCION, URL_ADJUNTO, FECHA_APERTURA, FECHA_LIMITE, PUNTOS_MAXIMOS) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [moduloId, titulo, descripcion, urlAdjunto, fechaApertura, fechaLimite, puntos]
        );

        res.json({ success: true, message: 'Tarea creada con éxito', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear la tarea' });
    }
};

// 2. Subir Entrega (Estudiante)
exports.subirEntrega = async (req, res) => {
    try {
        const { tareaId, estudianteId, comentario } = req.body;

        // Validar que se haya subido un archivo (obligatorio para la entrega)
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Debes subir un archivo para entregar la tarea' });
        }

        const urlArchivo = req.file.path; // URL de Cloudinary

        // Verificar si ya entregó antes (para actualizar o insertar)
        // En este caso simple, haremos un INSERT directo. 
        const [result] = await pool.query(
            `INSERT INTO entrega_tarea (SECUENCIALTAREA, SECUENCIALESTUDIANTE, URL_ARCHIVO, COMENTARIO_ESTUDIANTE, ESTADO) 
             VALUES (?, ?, ?, ?, 'ENVIADO')`,
            [tareaId, estudianteId, urlArchivo, comentario]
        );

        res.json({ success: true, message: 'Tarea entregada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al subir la entrega' });
    }
};

// 3. Listar Tareas de un Módulo (Público/Estudiante/Profe)
exports.listarTareasPorModulo = async (req, res) => {
    const { moduloId } = req.params;
    try {
        const [tareas] = await pool.query(`SELECT * FROM tarea WHERE SECUENCIALMODULO = ?`, [moduloId]);
        res.json({ success: true, data: tareas });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al listar tareas' });
    }
};

// 3.5 Listar Tareas de un Módulo CON ESTADO DEL ESTUDIANTE
exports.listarTareasEstudiantePorModulo = async (req, res) => {
    const { moduloId, estudianteId } = req.params;
    try {
        const [tareas] = await pool.query(
            `SELECT 
                t.*,
                et.ESTADO as ESTADO_ENTREGA,
                et.CALIFICACION,
                et.RETROALIMENTACION,
                et.FECHA_ENTREGA,
                et.URL_ARCHIVO as ARCHIVO_ENTREGADO
             FROM tarea t
             LEFT JOIN entrega_tarea et ON t.SECUENCIAL = et.SECUENCIALTAREA AND et.SECUENCIALESTUDIANTE = ?
             WHERE t.SECUENCIALMODULO = ?
             ORDER BY t.FECHA_LIMITE ASC`,
            [estudianteId, moduloId]
        );
        res.json({ success: true, data: tareas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al listar tareas del estudiante' });
    }
};


// 5. Listar entregas de una tarea específica (Para calificar)
exports.listarEntregasPorTarea = async (req, res) => {
    const { tareaId } = req.params;
    try {
        // Hacemos JOIN con usuario para mostrar Nombres y Apellidos del alumno
        const [entregas] = await pool.execute(
            `SELECT 
                et.SECUENCIAL as entregaId,
                et.URL_ARCHIVO,
                et.FECHA_ENTREGA,
                et.CALIFICACION,
                et.RETROALIMENTACION,
                et.ESTADO,
                u.NOMBRES,
                u.APELLIDOS,
                u.CORREO
             FROM entrega_tarea et
             INNER JOIN usuario u ON et.SECUENCIALESTUDIANTE = u.SECUENCIAL
             WHERE et.SECUENCIALTAREA = ?
             ORDER BY et.FECHA_ENTREGA DESC`,
            [tareaId]
        );
        res.json({ success: true, data: entregas });
    } catch (error) {
        console.error("❌ Error listando entregas:", error);
        res.status(500).json({ success: false, message: 'Error al listar entregas' });
    }
};

// 6. Guardar Calificación
exports.calificarEntrega = async (req, res) => {
    const { entregaId } = req.params;
    const { calificacion, retroalimentacion } = req.body;

    try {
        await pool.execute(
            `UPDATE entrega_tarea 
             SET CALIFICACION = ?, RETROALIMENTACION = ?, ESTADO = 'CALIFICADO' 
             WHERE SECUENCIAL = ?`,
            [calificacion, retroalimentacion, entregaId]
        );
        res.json({ success: true, message: 'Calificación guardada correctamente' });
    } catch (error) {
        console.error("❌ Error calificando:", error);
        res.status(500).json({ success: false, message: 'Error al calificar' });
    }
};

// 7. Listar entregas de un estudiante en un evento específico
exports.listarEntregasPorEstudiante = async (req, res) => {
    const { estudianteId, eventoId } = req.params;
    try {
        // Obtener todas las entregas del estudiante para tareas de módulos del evento
        const [entregas] = await pool.execute(
            `SELECT 
                et.SECUENCIAL as entregaId,
                et.SECUENCIALTAREA as tareaId,
                et.URL_ARCHIVO,
                et.COMENTARIO_ESTUDIANTE,
                et.FECHA_ENTREGA,
                et.CALIFICACION,
                et.RETROALIMENTACION,
                et.ESTADO,
                t.TITULO as tituloTarea,
                t.PUNTOS_MAXIMOS
             FROM entrega_tarea et
             INNER JOIN tarea t ON et.SECUENCIALTAREA = t.SECUENCIAL
             INNER JOIN modulo m ON t.SECUENCIALMODULO = m.SECUENCIAL
             WHERE et.SECUENCIALESTUDIANTE = ? AND m.SECUENCIALEVENTO = ?`,
            [estudianteId, eventoId]
        );
        res.json({ success: true, data: entregas });
    } catch (error) {
        console.error("❌ Error listando entregas del estudiante:", error);
        res.status(500).json({ success: false, message: 'Error al listar entregas' });
    }
};

// 8. Listar TODAS las tareas de un Evento (para reportes y headers)
exports.listarTareasPorEvento = async (req, res) => {
    const { eventoId } = req.params;
    try {
        const [tareas] = await pool.execute(
            `SELECT 
                t.*
             FROM tarea t
             INNER JOIN modulo m ON t.SECUENCIALMODULO = m.SECUENCIAL
             WHERE m.SECUENCIALEVENTO = ?
             ORDER BY m.SECUENCIAL ASC, t.FECHA_LIMITE ASC`,
            [eventoId]
        );
    } catch (error) {
        console.error("❌ Error listando tareas del evento:", error);
        res.status(500).json({ success: false, message: 'Error al listar tareas del evento' });
    }
};

// 9. Listar TODAS las entregas de un Evento (para el reporte de notas masivo)
exports.listarEntregasPorEvento = async (req, res) => {
    const { eventoId } = req.params;
    try {
        const [entregas] = await pool.execute(
            `SELECT 
                et.SECUENCIALESTUDIANTE,
                et.SECUENCIALTAREA,
                et.CALIFICACION,
                et.ESTADO
             FROM entrega_tarea et
             INNER JOIN tarea t ON et.SECUENCIALTAREA = t.SECUENCIAL
             INNER JOIN modulo m ON t.SECUENCIALMODULO = m.SECUENCIAL
             WHERE m.SECUENCIALEVENTO = ?`,
            [eventoId]
        );
        res.json({ success: true, data: entregas });
    } catch (error) {
        console.error("❌ Error listando entregas del evento:", error);
        res.status(500).json({ success: false, message: 'Error al listar entregas del evento' });
    }
};