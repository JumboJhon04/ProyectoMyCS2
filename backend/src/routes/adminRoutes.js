const express = require('express');
const router = express.Router();
const { 
  obtenerAdmins,
  obtenerTodosUsuarios,
  actualizarRolUsuario,
  actualizarEstadoUsuario,
  obtenerRolesDisponibles
} = require('../controllers/adminController');

// Ruta para obtener todos los administradores
router.get('/', obtenerAdmins);

// Rutas para gestión de usuarios
router.get('/usuarios/todos', obtenerTodosUsuarios);
router.get('/roles/disponibles', obtenerRolesDisponibles);
router.put('/usuarios/rol', actualizarRolUsuario);
router.put('/usuarios/estado', actualizarEstadoUsuario);

module.exports = router;

