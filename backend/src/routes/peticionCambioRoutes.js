const express = require('express');
const router = express.Router();
const {
  obtenerTodasPeticiones,
  aprobarPeticionCambio,
  rechazarPeticionCambio,
  obtenerPeticionPorId,
  crearPeticionCambioDirecta
} = require('../controllers/peticionCambioController');

// Ruta para obtener todas las peticiones de cambio (admin)
router.get('/', obtenerTodasPeticiones);

// Ruta para crear una petición de cambio directamente (admin)
router.post('/', crearPeticionCambioDirecta);

// Ruta para obtener una petición por ID
router.get('/:id', obtenerPeticionPorId);

// Ruta para aprobar una petición de cambio (admin)
router.post('/:id/aprobar', aprobarPeticionCambio);

// Ruta para rechazar una petición de cambio (admin aprobador)
router.post('/:id/rechazar', rechazarPeticionCambio);

module.exports = router;

