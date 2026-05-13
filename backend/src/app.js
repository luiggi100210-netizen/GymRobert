// Configuración de la aplicación Express
require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

// Rutas
const authRoutes       = require('./routes/auth.routes');
const miembrosRoutes   = require('./routes/miembros.routes');
const membresiaRoutes  = require('./routes/membresias.routes');
const planesRoutes     = require('./routes/planes.routes');
const pagosRoutes      = require('./routes/pagos.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const reportesRoutes   = require('./routes/reportes.routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta raíz para verificar que el servidor está activo
app.get('/', (req, res) => {
  res.json({
    sistema: 'Robert Gym — Club Fitness',
    version: '1.0.0',
    estado:  'activo',
    zona:    'America/Lima'
  });
});

// Registro de rutas API
app.use('/api/auth',        authRoutes);
app.use('/api/miembros',    miembrosRoutes);
app.use('/api/membresias',  membresiaRoutes);
app.use('/api/planes',      planesRoutes);
app.use('/api/pagos',       pagosRoutes);
app.use('/api/asistencia',  asistenciaRoutes);
app.use('/api/reportes',    reportesRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Manejador global de errores (debe ir último)
app.use(errorHandler);

module.exports = app;
