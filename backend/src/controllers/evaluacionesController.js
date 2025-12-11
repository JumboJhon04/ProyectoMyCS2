const { pool } = require('../config/database');

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

// (Más adelante agregaremos agregarPregunta)