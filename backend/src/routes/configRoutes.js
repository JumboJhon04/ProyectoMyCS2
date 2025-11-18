const express = require('express');
const router = express.Router();
const {
  subirImagenCarrusel,
  obtenerImagenesCarrusel,
  eliminarImagenCarrusel,
  guardarColores,
  obtenerColores
} = require('../controllers/configController');

// Rutas para carrusel
router.post('/carrusel', subirImagenCarrusel);
router.get('/carrusel', obtenerImagenesCarrusel);
router.delete('/carrusel/:id', eliminarImagenCarrusel);

// Rutas para colores
router.post('/colores', guardarColores);
router.get('/colores', obtenerColores);

module.exports = router;