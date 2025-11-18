const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio de uploads (ruta determinista basada en este archivo)
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'eventos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evento-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceptar solo imágenes
const allowedTypes = /jpeg|jpg|png|gif|webp/;
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

module.exports = upload;