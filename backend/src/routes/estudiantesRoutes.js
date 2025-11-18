const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantesController');

router.get('/', estudiantesController.obtenerEstudiantes);
router.get('/:id', estudiantesController.obtenerEstudiante);
router.put('/:id', estudiantesController.actualizarEstudiante);
router.get('/:id/eventos', estudiantesController.obtenerEventosDeUsuario);
router.post('/:id/inscribir', estudiantesController.crearInscripcion);

module.exports = router;
