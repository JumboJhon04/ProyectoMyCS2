const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentesController');

router.get('/', docentesController.obtenerDocentes);
// IMPORTANTE: Rutas específicas (/:id/eventos, /:id/mis-cursos) DEBEN ir ANTES de /:id
// De lo contrario Express piensa que "eventos" o "mis-cursos" es un ID
router.get('/:id/eventos', docentesController.obtenerEventosDictados);
router.get('/:id/mis-cursos', docentesController.obtenerCursosAsignados);
router.get('/:id', docentesController.obtenerDocente);
router.put('/:id', docentesController.actualizarDocente);
module.exports = router;
