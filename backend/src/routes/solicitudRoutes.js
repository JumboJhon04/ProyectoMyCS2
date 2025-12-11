const express = require('express');
const router = express.Router();
const {
  crearSolicitud,
  obtenerTodasSolicitudes,
  obtenerMisSolicitudes,
  cambiarEstadoSolicitud,
  crearPeticionCambio,
  obtenerSolicitudPorId
} = require('../controllers/solicitudController');
const { uploadSolicitudes } = require('../config/cloudinary');

// Ruta para crear solicitud de soporte (usuarios finales)
router.post('/', uploadSolicitudes.single('archivoEvidencia'), crearSolicitud);

// Ruta para obtener todas las solicitudes (admin)
router.get('/', obtenerTodasSolicitudes);

// Ruta para obtener solicitudes del usuario actual
router.get('/usuario/:usuarioId', obtenerMisSolicitudes);

// Ruta para obtener una solicitud por ID
router.get('/:id', obtenerSolicitudPorId);

// Ruta para cambiar estado de solicitud (admin)
router.put('/:id/estado', cambiarEstadoSolicitud);

// Ruta para crear petición de cambio desde una solicitud aprobada (admin)
router.post('/:solicitudId/peticion-cambio', crearPeticionCambio);

module.exports = router;

