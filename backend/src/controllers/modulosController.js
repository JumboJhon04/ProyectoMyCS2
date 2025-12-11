const { pool } = require('../config/database'); // Asegúrate que apunta a tu conexión MySQL

// Listar módulos de un evento específico
exports.listarModulosPorEvento = async (req, res) => {
    const { eventoId } = req.params;
    try {
        // Obtenemos los módulos ordenados
        const [modulos] = await pool.query(
            `SELECT * FROM modulo WHERE SECUENCIALEVENTO = ? ORDER BY ORDEN ASC`, 
            [eventoId]
        );
        res.json({ success: true, data: modulos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener módulos' });
    }
};

// Crear un nuevo módulo
exports.crearModulo = async (req, res) => {
    const { eventoId, titulo, descripcion, orden } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO modulo (SECUENCIALEVENTO, TITULO, DESCRIPCION, ORDEN, ESTADO) VALUES (?, ?, ?, ?, 'ACTIVO')`,
            [eventoId, titulo, descripcion, orden || 1]
        );
        res.json({ success: true, message: 'Módulo creado', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear módulo' });
    }
};

// Eliminar módulo
exports.eliminarModulo = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM modulo WHERE SECUENCIAL = ?`, [id]);
        res.json({ success: true, message: 'Módulo eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar módulo' });
    }
};