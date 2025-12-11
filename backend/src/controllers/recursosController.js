const { pool } = require('../config/database');

// Crear Recurso (Solo material de lectura/apoyo)
exports.crearRecurso = async (req, res) => {
    try {
        const { moduloId, titulo, descripcion } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'El archivo es obligatorio' });
        }
        
        const urlRecurso = req.file.path; // URL de Cloudinary

        const [result] = await pool.execute(
            `INSERT INTO recurso (SECUENCIALMODULO, TITULO, DESCRIPCION, URL_RECURSO) VALUES (?, ?, ?, ?)`,
            [moduloId, titulo, descripcion, urlRecurso]
        );

        res.json({ success: true, message: 'Material subido correctamente', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error subiendo material' });
    }
};

// Listar Recursos de un módulo
exports.listarRecursosPorModulo = async (req, res) => {
    const { moduloId } = req.params;
    try {
        const [recursos] = await pool.execute(`SELECT * FROM recurso WHERE SECUENCIALMODULO = ?`, [moduloId]);
        res.json({ success: true, data: recursos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error listando recursos' });
    }
};