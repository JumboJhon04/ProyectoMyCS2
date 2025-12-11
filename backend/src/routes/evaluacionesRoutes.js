const express = require('express');
const router = express.Router();
const evaluacionesController = require('../controllers/evaluacionesController');

// Crear Examen (Cabecera)
router.post('/crear', evaluacionesController.crearEvaluacion);

// Agregar Preguntas
router.post('/pregunta', evaluacionesController.agregarPregunta);

// Listar exámenes de un módulo
router.get('/modulo/:moduloId', evaluacionesController.listarEvaluacionesPorModulo);

// Ver examen completo (con preguntas)
router.get('/:id', evaluacionesController.obtenerEvaluacionCompleta);

// Entregar Examen
router.post('/entregar', evaluacionesController.entregarEvaluacion);

// Obtener intentos del estudiante
router.get('/intentos/:estudianteId', evaluacionesController.obtenerIntentosEstudiante);

module.exports = router;