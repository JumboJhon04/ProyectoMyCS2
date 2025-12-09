const express = require('express');
const router = express.Router();
const { uploadEventos } = require('../config/cloudinary');
const {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerImagenes,
  actualizarImagenEvento,
  obtenerEventosFiltrados
} = require('../controllers/eventoController');

// Rutas

router.post('/', uploadEventos.single('image'), crearEvento);
router.get('/', obtenerEventos);
router.get('/imagenes', obtenerImagenes);
router.get('/filtrar', obtenerEventosFiltrados);
router.get('/:id', obtenerEvento);
router.put('/:id', uploadEventos.single('image'), actualizarEvento);
router.delete('/:id', eliminarEvento);

// Ruta para actualizar solo la imagen de un evento
router.put('/:id/imagen', uploadEventos.single('image'), actualizarImagenEvento);

module.exports = router;