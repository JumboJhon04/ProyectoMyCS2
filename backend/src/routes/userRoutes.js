const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPerfil } = require('../controllers/userController');
const { uploadHome } = require('../config/cloudinary');

// Obtener perfil
router.get('/:id/profile', obtenerPerfil);

// Actualizar perfil (con subida de imagen)
router.put('/:id/profile', uploadHome.single('fotoPerfil'), actualizarPerfil);

module.exports = router;
