const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { 
  crearEvento, 
  obtenerImagenes, 
  obtenerEventos,
  actualizarImagenEvento 
} = require('../controllers/eventoController');
// Ruta para crear evento completo con imagen
router.post('/', upload.single('image'), crearEvento);

// Ruta para obtener todas las imágenes
router.get('/imagenes', obtenerImagenes);

// Ruta para obtener todos los eventos
router.get('/', obtenerEventos);

// Ruta para actualizar imagen de un evento específico
router.put('/:id/imagen', actualizarImagenEvento);

module.exports = router;