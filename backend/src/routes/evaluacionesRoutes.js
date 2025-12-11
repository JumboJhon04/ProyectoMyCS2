const express = require('express');
const router = express.Router();
const evaluacionesController = require('../controllers/evaluacionesController');

router.post('/crear', evaluacionesController.crearEvaluacion);

module.exports = router;