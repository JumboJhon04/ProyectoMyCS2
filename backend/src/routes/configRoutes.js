const express = require('express');
const router = express.Router();
const { uploadHome } = require('../config/cloudinary');
const {
  subirImagenCarrusel,
  obtenerImagenesCarrusel,
  eliminarImagenCarrusel,
  guardarColores,
  obtenerColores,
  obtenerHome,
  actualizarHome
} = require('../controllers/configController');

// Rutas para carrusel
router.post('/carrusel', uploadHome.single('imagen'), subirImagenCarrusel);
router.get('/carrusel', obtenerImagenesCarrusel);
router.delete('/carrusel/:id', eliminarImagenCarrusel);

// Rutas para colores
router.post('/colores', guardarColores);
router.get('/colores', obtenerColores);

// Rutas para contenido del home
router.get('/home', obtenerHome);
router.put('/home', uploadHome.any(), actualizarHome);

module.exports = router;