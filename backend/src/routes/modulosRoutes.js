const express = require('express');
const router = express.Router();
const modulosController = require('../controllers/modulosController');

router.get('/evento/:eventoId', modulosController.listarModulosPorEvento);
router.post('/crear', modulosController.crearModulo);
router.delete('/:id', modulosController.eliminarModulo);

module.exports = router;