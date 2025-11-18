const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');

// Importar rutas
const eventoRoutes = require('./routes/eventoRoutes');
const authRoutes = require('./routes/authRoutes'); // NUEVA LÍNEA

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log de peticiones en desarrollo
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/eventos', eventoRoutes);
app.use('/api/auth', authRoutes); // NUEVA LÍNEA

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Probar conexión al iniciar
testConnection();

// Manejo de errores de Multer
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      error: 'Error al subir archivo',
      details: err.message 
    });
  }
  next(err);
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;