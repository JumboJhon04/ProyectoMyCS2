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
router.get('/modulo/:moduloId/estudiante/:estudianteId', tareasController.listarTareasEstudiantePorModulo);
// Ver quién entregó
router.get('/:tareaId/entregas', tareasController.listarEntregasPorTarea);

// Guardar nota
router.put('/calificar/:entregaId', tareasController.calificarEntrega);

module.exports = router;