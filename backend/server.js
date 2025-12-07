const app = require('./src/app');
require('dotenv').config();

// Cargar el servicio de email al inicio para que se ejecute la verificación
console.log('🔄 Cargando servicios...');
require('./src/services/emailService');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});