require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');

// Importar rutas
const eventoRoutes = require('./routes/eventoRoutes');
const authRoutes = require('./routes/authRoutes'); // NUEVA LÍNEA
const carrerasRoutes = require('./routes/carrerasRoutes');
const configRoutes = require('./routes/configRoutes'); // NUEVA LÍNEA
const estudiantesRoutes = require('./routes/estudiantesRoutes');
const docentesRoutes = require('./routes/docentesRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const peticionCambioRoutes = require('./routes/peticionCambioRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultadCarreraRoutes = require('./routes/facultadCarrera'); // NUEVA IMPORTACIÓN
const requisitoRoutes = require('./routes/requisitoRoutes');


const app = express();

// Configurar CORS para producción
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL || 'https://proyectomycs2.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes locales antiguas - solo para migración)
// Nuevos archivos se almacenan en Cloudinary
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log de peticiones en desarrollo
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/eventos', eventoRoutes);
app.use('/api/auth', authRoutes); // NUEVA LÍNEA
app.use('/api/carreras', carrerasRoutes);
app.use('/api/config', configRoutes); // NUEVA LÍNEA
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/peticiones-cambio', peticionCambioRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', require('./routes/userRoutes')); // NUEVA RUTA USUARIOS
app.use('/api', facultadCarreraRoutes); // NUEVA RUTA
app.use('/api', requisitoRoutes);
app.use(cors());
app.use(express.json());

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

// Manejador 404 que devuelve JSON (evita que el frontend intente parsear HTML)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

module.exports = app;
module.exports = app;
