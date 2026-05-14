const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  registrarToque,
  registrarManual,
  asistenciasHoy,
  asistenciasDia,
  reporteMensual
} = require('../controllers/asistencia.controller');

// POST /api/asistencia/toque — NO requiere auth (lo llama el kiosco directamente)
router.post('/toque', registrarToque);

// Los siguientes endpoints requieren autenticación
router.post('/manual',           verificarToken, registrarManual);
router.get('/hoy',               verificarToken, asistenciasHoy);
router.get('/dia/:fecha',        verificarToken, asistenciasDia);
router.get('/reporte/:mes/:anio',verificarToken, reporteMensual);

module.exports = router;
