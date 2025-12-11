const express = require('express');
const router = express.Router();
const { uploadEventos } = require('../config/cloudinary');
const {
  crearEvento,
  obtenerEventos,
  obtenerEvento,
  obtenerEventosResponsable,
  actualizarEvento,
  actualizarResponsableEvento,
  eliminarEvento,
  obtenerImagenes,
  actualizarImagenEvento,
  obtenerEventosFiltrados,
  obtenerCategoriasEvento,
  obtenerTiposEvento,
  obtenerInscritosEvento, // New
  actualizarNotas,        // New
  finalizarEvento         // New
} = require('../controllers/eventoController');

// Rutas

router.post('/', uploadEventos.single('image'), crearEvento);
router.get('/', obtenerEventos);
router.get('/responsable/:id', obtenerEventosResponsable);
router.get('/imagenes', obtenerImagenes);
router.get('/tipos', obtenerTiposEvento);
router.get('/categorias', obtenerCategoriasEvento);
router.get('/filtrar', obtenerEventosFiltrados);
router.get('/:id', obtenerEvento);
router.put('/:id', uploadEventos.single('image'), actualizarEvento);
router.put('/:id/responsable', actualizarResponsableEvento);
router.delete('/:id', eliminarEvento);

// Ruta para actualizar solo la imagen de un evento
router.put('/:id/imagen', uploadEventos.single('image'), actualizarImagenEvento);

// Rutas de Calificaciones y Finalización (Close Course)
router.get('/:id/inscritos', obtenerInscritosEvento);
router.put('/:id/notas', actualizarNotas); // Sin upload middleware
router.put('/:id/finalizar', finalizarEvento);

module.exports = router;