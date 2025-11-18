const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentesController');

router.get('/', docentesController.obtenerDocentes);
router.get('/:id', docentesController.obtenerDocente);
router.put('/:id', docentesController.actualizarDocente);
router.get('/:id/eventos', docentesController.obtenerEventosDictados);

module.exports = router;
