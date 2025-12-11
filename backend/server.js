const app = require('./src/app');
require('dotenv').config();
const { initDB } = require('./src/config/initDB'); // Import initDB

// Cargar el servicio de email al inicio para que se ejecute la verificación
console.log('🔄 Cargando servicios...');
require('./src/services/emailService');

const PORT = process.env.PORT || 5000;

// Initialize DB then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});