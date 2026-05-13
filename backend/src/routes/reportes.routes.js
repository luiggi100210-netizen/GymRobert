const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { dashboard, ingresosMes, proyeccion } = require('../controllers/reportes.controller');

router.use(verificarToken);

router.get('/dashboard',             dashboard);    // GET /api/reportes/dashboard
router.get('/ingresos/:mes/:anio',   ingresosMes);  // GET /api/reportes/ingresos/5/2026
router.get('/proyeccion',            proyeccion);   // GET /api/reportes/proyeccion

module.exports = router;
