const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio de uploads para comprobantes de pago
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'pagos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `comprobante-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceptar PDFs e imágenes
const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/;
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF o imágenes (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

module.exports = upload;

