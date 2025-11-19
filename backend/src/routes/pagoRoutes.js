const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const uploadPagos = require('../config/multerPagos');

// Obtener formas de pago disponibles
router.get('/formas-pago', pagoController.obtenerFormasPago);

// Crear pago (con upload de comprobante)
router.post('/', uploadPagos.single('comprobante'), pagoController.crearPago);

// Crear pago con PayPal
router.post('/paypal', pagoController.crearPagoPayPal);

// Obtener pagos de una inscripción
router.get('/inscripcion/:inscripcionId', pagoController.obtenerPagosPorInscripcion);

// Obtener todos los pagos pendientes (para admin/responsable)
router.get('/pendientes', pagoController.obtenerPagosPendientes);

// Obtener conteo de pagos pendientes (para notificaciones)
router.get('/pendientes/conteo', pagoController.obtenerConteoPagosPendientes);

// Actualizar estado de pago (aprobar/rechazar)
router.put('/:pagoId/estado', pagoController.actualizarEstadoPago);

module.exports = router;

