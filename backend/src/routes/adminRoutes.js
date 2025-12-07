const express = require('express');
const router = express.Router();
const { obtenerAdmins } = require('../controllers/adminController');

// Ruta para obtener todos los administradores
router.get('/', obtenerAdmins);

module.exports = router;

