const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const { verificarToken } = require('../middleware/auth');
const {
  registrarToque,
  registrarManual,
  asistenciasHoy,
  asistenciasDia,
  reporteMensual
} = require('../controllers/asistencia.controller');

// Limitar el endpoint público del kiosco: 30 toques por minuto por IP
const toqueLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas solicitudes. Intente en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/asistencia/toque — NO requiere auth (lo llama el kiosco directamente)
router.post('/toque', toqueLimiter, registrarToque);

// Los siguientes endpoints requieren autenticación
router.post('/manual',           verificarToken, registrarManual);
router.get('/hoy',               verificarToken, asistenciasHoy);
router.get('/dia/:fecha',        verificarToken, asistenciasDia);
router.get('/reporte/:mes/:anio',verificarToken, reporteMensual);

module.exports = router;
