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

// Obtener todas las evaluaciones del profesor
router.get('/profesor/:profesorId', evaluacionesController.listarEvaluacionesPorProfesor);

// Obtener todas las evaluaciones disponibles para un estudiante
router.get('/estudiante/:estudianteId', evaluacionesController.obtenerEvaluacionesPorEstudiante);

module.exports = router;