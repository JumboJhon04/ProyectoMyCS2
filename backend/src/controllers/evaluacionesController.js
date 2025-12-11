const { pool } = require('../config/database');

// 1. Crear la cabecera de la evaluación
exports.crearEvaluacion = async (req, res) => {
    const { moduloId, titulo, duracion, fechaInicio, fechaFin } = req.body;
    try {
        const [result] = await pool.execute(
            `INSERT INTO evaluacion (SECUENCIALMODULO, TITULO, DURACION_MINUTOS, FECHA_INICIO, FECHA_FIN) VALUES (?, ?, ?, ?, ?)`,
            [moduloId, titulo, duracion, fechaInicio, fechaFin]
        );
        res.json({ success: true, message: 'Prueba creada', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creando evaluación' });
    }
};

// 2. Agregar una Pregunta con sus Opciones
exports.agregarPregunta = async (req, res) => {
    const { evaluacionId, enunciado, puntaje, opciones } = req.body;
    // opciones es un array: [{texto: "Opción A", esCorrecta: true}, ...]

    try {
        // Insertar la pregunta
        const [pregResult] = await pool.execute(
            `INSERT INTO pregunta (SECUENCIALEVALUACION, ENUNCIADO, PUNTAJE) VALUES (?, ?, ?)`,
            [evaluacionId, enunciado, puntaje]
        );
        const preguntaId = pregResult.insertId;

        // Insertar las opciones (Loop)
        if (opciones && opciones.length > 0) {
            for (const opcion of opciones) {
                await pool.execute(
                    `INSERT INTO opcion_pregunta (SECUENCIALPREGUNTA, TEXTO_OPCION, ES_CORRECTA) VALUES (?, ?, ?)`,
                    [preguntaId, opcion.texto, opcion.esCorrecta ? 1 : 0]
                );
            }
        }

        res.json({ success: true, message: 'Pregunta agregada correctamente' });
    } catch (error) {
        console.error("Error agregando pregunta:", error);
        res.status(500).json({ success: false, message: 'Error al guardar pregunta' });
    }
};

// 3. Listar Evaluaciones de un Módulo
exports.listarEvaluacionesPorModulo = async (req, res) => {
    const { moduloId } = req.params;
    try {
        const [evaluaciones] = await pool.execute(
            `SELECT * FROM evaluacion WHERE SECUENCIALMODULO = ?`,
            [moduloId]
        );
        res.json({ success: true, data: evaluaciones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error listando evaluaciones' });
    }
};

// 4. Obtener Evaluación Completa (Para editar o rendir)
exports.obtenerEvaluacionCompleta = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener datos básicos
        const [evaluacion] = await pool.execute(`SELECT * FROM evaluacion WHERE SECUENCIAL = ?`, [id]);
        if (evaluacion.length === 0) return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });

        // Obtener preguntas
        const [preguntas] = await pool.execute(`SELECT * FROM pregunta WHERE SECUENCIALEVALUACION = ?`, [id]);

        // Para cada pregunta, obtener opciones
        const preguntasCompletas = await Promise.all(preguntas.map(async (preg) => {
            const [opciones] = await pool.execute(`SELECT * FROM opcion_pregunta WHERE SECUENCIALPREGUNTA = ?`, [preg.SECUENCIAL]);
            return { ...preg, opciones };
        }));

        res.json({ success: true, data: { ...evaluacion[0], preguntas: preguntasCompletas } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error obteniendo evaluación' });
    }
};

// 5. Entregar Evaluación (Calificar y Guardar)
exports.entregarEvaluacion = async (req, res) => {
    const { estudianteId, evaluacionId, respuestas } = req.body;
    // respuestas: [{ preguntaId: 1, opcionId: 5 }, ...]

    try {
        // 0. Validar si ya existe intento
        const [existente] = await pool.execute(
            `SELECT * FROM intento_evaluacion WHERE SECUENCIALEVALUACION = ? AND SECUENCIALESTUDIANTE = ?`,
            [evaluacionId, estudianteId]
        );
        if (existente.length > 0) {
            return res.status(400).json({ success: false, message: 'Ya has realizado este examen.' });
        }

        // 1. Iniciar Intento
        const [intento] = await pool.execute(
            `INSERT INTO intento_evaluacion (SECUENCIALEVALUACION, SECUENCIALESTUDIANTE, FECHA_INICIO, ESTADO) VALUES (?, ?, NOW(), 'EN_PROGRESO')`,
            [evaluacionId, estudianteId]
        );
        const intentoId = intento.insertId;

        // 2. Calcular Calificación
        let calificacionTotal = 0;

        // Obtener todas las preguntas y sus opciones correctas de esta evaluación
        const [preguntas] = await pool.execute(
            `SELECT p.SECUENCIAL as preguntaId, p.PUNTAJE, op.SECUENCIAL as opcionCorrectaId 
             FROM pregunta p
             JOIN opcion_pregunta op ON p.SECUENCIAL = op.SECUENCIALPREGUNTA
             WHERE p.SECUENCIALEVALUACION = ? AND op.ES_CORRECTA = 1`,
            [evaluacionId]
        );

        // Crear mapa para verificación rápida: { preguntaId: opcionCorrectaId }
        const solucionario = {};
        const puntajes = {};
        preguntas.forEach(p => {
            solucionario[p.preguntaId] = p.opcionCorrectaId;
            puntajes[p.preguntaId] = parseFloat(p.PUNTAJE);
        });

        // Verificar respuestas del estudiante
        respuestas.forEach(r => {
            // Si la opción seleccionada coincide con la correcta
            if (solucionario[r.preguntaId] === r.opcionId) {
                calificacionTotal += puntajes[r.preguntaId] || 0;
            }

            // Opcional: Aquí se podría guardar cada respuesta individual si existiera una tabla 'respuesta_intento'
            // await pool.execute('INSERT INTO respuesta_intento (SECUENCIALINTENTO, SECUENCIALPREGUNTA, SECUENCIALOPCION) VALUES (?, ?, ?)', [intentoId, r.preguntaId, r.opcionId]);
        });

        // 3. Finalizar Intento
        await pool.execute(
            `UPDATE intento_evaluacion SET CALIFICACION_FINAL = ?, FECHA_FIN = NOW(), ESTADO = 'FINALIZADO' WHERE SECUENCIAL = ?`,
            [calificacionTotal, intentoId]
        );

        res.json({ success: true, message: 'Examen entregado', calificacion: calificacionTotal });

    } catch (error) {
        console.error("Error entregando evaluación:", error);
        res.status(500).json({ success: false, message: 'Error al calificar evaluación' });
    }
};

// 6. Obtener intentos del estudiante (Para saber qué exámenes ya rindió)
exports.obtenerIntentosEstudiante = async (req, res) => {
    const { estudianteId } = req.params;
    try {
        const [intentos] = await pool.execute(
            `SELECT i.*, e.TITULO 
             FROM intento_evaluacion i
             JOIN evaluacion e ON i.SECUENCIALEVALUACION = e.SECUENCIAL
             WHERE i.SECUENCIALESTUDIANTE = ?`,
            [estudianteId]
        );
        res.json({ success: true, data: intentos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error obteniendo intentos' });
    }
};

// 7. Listar evaluaciones creadas por un profesor (Todas)
exports.listarEvaluacionesPorProfesor = async (req, res) => {
    const { profesorId } = req.params;
    try {
        const [evaluaciones] = await pool.execute(
            `SELECT 
                e.*, 
                m.TITULO as ModuloNombre, 
                ev.TITULO as CursoNombre,
                (SELECT COUNT(*) FROM pregunta p WHERE p.SECUENCIALEVALUACION = e.SECUENCIAL) as questionsCount,
                (SELECT COUNT(*) FROM intento_evaluacion i WHERE i.SECUENCIALEVALUACION = e.SECUENCIAL) as attemptsCount
             FROM evaluacion e
             INNER JOIN modulo m ON e.SECUENCIALMODULO = m.SECUENCIAL
             INNER JOIN evento ev ON m.SECUENCIALEVENTO = ev.SECUENCIAL
             WHERE ev.Docente = ?
             ORDER BY e.FECHA_INICIO DESC`,
            [profesorId]
        );
        res.json({ success: true, data: evaluaciones });
    } catch (error) {
        console.error("Error listando evaluaciones profesor:", error);
        res.status(500).json({ success: false, message: 'Error listando evaluaciones' });
    }
};

// 8. Listar TODAS las evaluaciones disponibles para un estudiante (Inscrito)
exports.obtenerEvaluacionesPorEstudiante = async (req, res) => {
    const { estudianteId } = req.params;
    try {
        const [evaluaciones] = await pool.execute(
            `SELECT 
                e.*, 
                m.TITULO as ModuloNombre,
                ev.TITULO as CursoNombre,
                i.SECUENCIAL as IntentoId,
                i.CALIFICACION_FINAL,
                i.ESTADO as EstadoIntento,
                i.FECHA_INICIO as FechaIntento,
                (SELECT COUNT(*) FROM pregunta p WHERE p.SECUENCIALEVALUACION = e.SECUENCIAL) as questionsCount
            FROM evaluacion e
            INNER JOIN modulo m ON e.SECUENCIALMODULO = m.SECUENCIAL
            INNER JOIN evento ev ON m.SECUENCIALEVENTO = ev.SECUENCIAL
            INNER JOIN inscripcion ins ON ev.SECUENCIAL = ins.SECUENCIALEVENTO
            LEFT JOIN intento_evaluacion i ON e.SECUENCIAL = i.SECUENCIALEVALUACION AND i.SECUENCIALESTUDIANTE = ?
            WHERE ins.SECUENCIALUSUARIO = ? AND ins.CODIGOESTADOINSCRIPCION = 'ACE'
            ORDER BY e.FECHA_INICIO ASC`,
            [estudianteId, estudianteId]
        );
        res.json({ success: true, data: evaluaciones });
    } catch (error) {
        console.error("Error obteniendo evaluaciones estudiante:", error);
        res.status(500).json({ success: false, message: 'Error obteniendo evaluaciones' });
    }
};