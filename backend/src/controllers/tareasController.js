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

// 4. Calificar Entrega (Profesor)
exports.calificarEntrega = async (req, res) => {
    const { entregaId } = req.params;
    const { calificacion, retroalimentacion } = req.body;
    try {
        await pool.query(
            `UPDATE entrega_tarea SET CALIFICACION = ?, RETROALIMENTACION = ?, ESTADO = 'CALIFICADO' WHERE SECUENCIAL = ?`,
            [calificacion, retroalimentacion, entregaId]
        );
        res.json({ success: true, message: 'Calificación registrada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al calificar' });
    }
};


// 5. Listar entregas de una tarea específica (Para que el profe califique)
exports.listarEntregasPorTarea = async (req, res) => {
    const { tareaId } = req.params;
    try {
        // Hacemos JOIN con la tabla usuario para saber quién es el estudiante
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