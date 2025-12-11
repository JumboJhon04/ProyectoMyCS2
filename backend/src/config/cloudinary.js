const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de almacenamiento para eventos
const eventosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

// Configuración de almacenamiento para pagos
const pagosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pagos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

// Configuración de almacenamiento para solicitudes
const solicitudesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'solicitudes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'raw' // PDFs requieren resource_type raw para servirse correctamente
  }
});

// Configuración de almacenamiento para home
const homeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'home',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
  }
});

// Configuración de multer para eventos
const uploadEventos = multer({
  storage: eventosStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Configuración de multer para pagos
const uploadPagos = multer({
  storage: pagosStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Configuración de multer para solicitudes
const uploadSolicitudes = multer({
  storage: solicitudesStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Configuración de multer para home
const uploadHome = multer({
  storage: homeStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- NUEVO: Configuración para TAREAS (Archivos que sube el profesor) ---
// --- NUEVO: Configuración para TAREAS (Archivos que sube el profesor) ---
const tareasStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'material_clase', // Nombre de la carpeta en Cloudinary
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'png'],
    resource_type: 'raw' // 'raw' es más seguro para archivos mixtos y PDFs
  }
});

// --- NUEVO: Configuración para ENTREGAS (Archivos que sube el estudiante) ---
const entregasStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deberes_estudiantes',
    allowed_formats: ['pdf', 'doc', 'docx', 'zip', 'rar', 'jpg', 'png', 'txt'],
    resource_type: 'raw'
  }
});

// ... (MANTÉN TUS UPLOADS EXISTENTES) ...

// --- NUEVO: Multer instances ---
const uploadTareas = multer({
  storage: tareasStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB límite
});

const uploadEntregas = multer({
  storage: entregasStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB límite (los deberes pueden ser pesados)
});

module.exports = {
  cloudinary,
  uploadEventos,
  uploadPagos,
  uploadSolicitudes,
  uploadHome,
  uploadTareas,
  uploadEntregas
};
