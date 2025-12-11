const { pool } = require('../config/database');

exports.crearEvaluacion = async (req, res) => {
    const { moduloId, titulo, duracion, fechaInicio, fechaFin } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO evaluacion (SECUENCIALMODULO, TITULO, DURACION_MINUTOS, FECHA_INICIO, FECHA_FIN) VALUES (?, ?, ?, ?, ?)`,
            [moduloId, titulo, duracion, fechaInicio, fechaFin]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creando evaluación' });
    }
};

exports.agregarPregunta = async (req, res) => {
    const { evaluacionId, enunciado, puntaje } = req.body;
    try {
        await db.query(
            `INSERT INTO pregunta (SECUENCIALEVALUACION, ENUNCIADO, PUNTAJE) VALUES (?, ?, ?)`,
            [evaluacionId, enunciado, puntaje]
        );
        res.json({ success: true, message: 'Pregunta agregada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error agregando pregunta' });
    }
};