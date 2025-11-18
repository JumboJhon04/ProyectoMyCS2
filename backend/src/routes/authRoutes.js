const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/authController');

// Ruta para registrar nuevo usuario
router.post('/register', registrarUsuario);

// Ruta para login
router.post('/login', loginUsuario);

module.exports = router;