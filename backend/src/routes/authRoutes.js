const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  loginUsuario, 
  registrarResponsable, 
  obtenerResponsables 
} = require('../controllers/authController');

// Rutas públicas
router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);

// Rutas para gestión de responsables (deberían estar protegidas)
router.post('/responsables', registrarResponsable);
router.get('/responsables', obtenerResponsables);

module.exports = router;