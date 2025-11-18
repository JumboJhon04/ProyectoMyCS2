const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerImagenes,
  actualizarImagenEvento
} = require('../controllers/eventoController');

// Rutas
router.post('/', upload.single('image'), crearEvento);
router.get('/', obtenerEventos);
router.get('/imagenes', obtenerImagenes);
router.get('/:id', obtenerEvento);
router.put('/:id', upload.single('image'), actualizarEvento);
router.delete('/:id', eliminarEvento);

// Ruta para actualizar solo la imagen de un evento
router.put('/:id/imagen', upload.single('image'), actualizarImagenEvento);

module.exports = router;