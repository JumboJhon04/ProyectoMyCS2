const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPerfil, obtenerDocentes } = require('../controllers/userController');
const { uploadHome } = require('../config/cloudinary');

// Obtener lista de docentes
router.get('/docentes', obtenerDocentes);

// Obtener perfil
router.get('/:id/profile', obtenerPerfil);

// Actualizar perfil (con subida de imagen)
router.put('/:id/profile', uploadHome.single('fotoPerfil'), actualizarPerfil);

module.exports = router;
