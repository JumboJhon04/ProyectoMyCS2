const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Tu middleware de multer
const {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerImagenes
} = require('../controllers/eventoController');

// Rutas
router.post('/', upload.single('image'), crearEvento);
router.get('/', obtenerEventos);
router.get('/imagenes', obtenerImagenes);
router.get('/:id', obtenerEvento);
router.put('/:id', upload.single('image'), actualizarEvento);
router.delete('/:id', eliminarEvento);

module.exports = router;