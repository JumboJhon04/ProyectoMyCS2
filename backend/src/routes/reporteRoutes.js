const express = require('express');
const router = express.Router();
const {
  reporteInscripciones,
  reportePagos,
  reporteAsistencias,
  detalleCertificado
} = require('../controllers/reporteController');

router.get('/inscripciones', reporteInscripciones);
router.get('/pagos', reportePagos);
router.get('/asistencias', reporteAsistencias);
router.get('/certificados/:eventoId/estudiante/:estudianteId', detalleCertificado);

module.exports = router;
