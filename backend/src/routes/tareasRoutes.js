const express = require('express');
const router = express.Router();
const tareasController = require('../controllers/tareasController');
const { uploadTareas, uploadEntregas } = require('../config/cloudinary'); // Importamos Multer Config

// Ruta para crear tarea (Profesor) -> Usa uploadTareas
router.post('/crear', uploadTareas.single('archivoAdjunto'), tareasController.crearTarea);

// Ruta para subir deber (Estudiante) -> Usa uploadEntregas
router.post('/entregar', uploadEntregas.single('archivoDeber'), tareasController.subirEntrega);

// Otras rutas
router.get('/modulo/:moduloId', tareasController.listarTareasPorModulo);
router.put('/calificar/:entregaId', tareasController.calificarEntrega);
router.get('/:tareaId/entregas', tareasController.listarEntregasPorTarea);

// Nueva ruta: Obtener entregas de un estudiante en un evento específico
router.get('/estudiante/:estudianteId/evento/:eventoId', tareasController.listarEntregasPorEstudiante);

module.exports = router;