// routes/facultadCarrera.js
const express = require('express');
const router = express.Router();
const {
  obtenerFacultades,
  obtenerCarreras,
  obtenerCarrerasPorFacultad
} = require('../controllers/facultadCarreraController');

// Rutas públicas (no requieren autenticación)
router.get('/facultades', obtenerFacultades);
router.get('/carreras', obtenerCarreras);
router.get('/carreras/facultad/:facultadId', obtenerCarrerasPorFacultad);

module.exports = router;