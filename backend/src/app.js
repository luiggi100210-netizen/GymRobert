// Configuración de la aplicación Express
require('dotenv').config();

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// Rutas
const authRoutes       = require('./routes/auth.routes');
const miembrosRoutes   = require('./routes/miembros.routes');
const membresiaRoutes  = require('./routes/membresias.routes');
const planesRoutes     = require('./routes/planes.routes');
const pagosRoutes      = require('./routes/pagos.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const reportesRoutes   = require('./routes/reportes.routes');
const maquinasRoutes   = require('./routes/maquinas.routes');
const tiendaRoutes     = require('./routes/tienda.routes');

const app = express();

// Necesario para que express-rate-limit identifique IPs correctamente detrás de proxy/Docker
app.set('trust proxy', 1);

// Headers de seguridad (HSTS, nosniff, X-Frame-Options, etc.)
app.use(helmet());

// CORS — en producción el origen es obligatorio (mismo criterio que JWT_SECRET)
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.error('FATAL: CORS_ORIGIN no está definido en producción.');
  process.exit(1);
}
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting para autenticación — máx 20 intentos cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de acceso. Intente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/miembros',    miembrosRoutes);
app.use('/api/membresias',  membresiaRoutes);
app.use('/api/planes',      planesRoutes);
app.use('/api/pagos',       pagosRoutes);
app.use('/api/asistencia',  asistenciaRoutes);
app.use('/api/reportes',    reportesRoutes);
app.use('/api/maquinas',    maquinasRoutes);
app.use('/api/tienda',     tiendaRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Manejador global de errores (debe ir último)
app.use(errorHandler);

module.exports = app;
