const express = require('express');
const router = express.Router();
const { obtenerCarreras } = require('../controllers/carrerasController');

router.get('/', obtenerCarreras);

module.exports = router;