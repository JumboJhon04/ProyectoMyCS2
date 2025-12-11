const express = require('express');
const router = express.Router();
const recursosController = require('../controllers/recursosController');
const { uploadTareas } = require('../config/cloudinary'); // Reusamos la config de "material_clase"

router.post('/crear', uploadTareas.single('archivoRecurso'), recursosController.crearRecurso);
router.get('/modulo/:moduloId', recursosController.listarRecursosPorModulo);

module.exports = router;