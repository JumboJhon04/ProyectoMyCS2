const express = require('express');
const router = express.Router();
const requisitoController = require('../controllers/requisitoController');

// 1. IMPORTA LA CONFIGURACIÓN DE CLOUDINARY
// Asegúrate de que la ruta '../config/cloudinary' sea correcta
// Usaremos 'uploadSolicitudes' porque en tu config anterior vi que acepta PDFs
const { uploadSolicitudes } = require('../config/cloudinary');

// Obtener requisitos de un evento
router.get('/eventos/:id/requisitos', requisitoController.getRequisitosEvento);

// 2. USA EL MIDDLEWARE DE CLOUDINARY
// Cambiamos 'upload.any()' por 'uploadSolicitudes.any()'
// Esto subirá todos los archivos directamente a la nube
router.post('/inscripciones/requisitos', uploadSolicitudes.any(), requisitoController.subirArchivosRequisitos);

module.exports = router;