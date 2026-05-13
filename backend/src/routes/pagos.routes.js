const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { listarPagos, registrarPago } = require('../controllers/pagos.controller');

router.use(verificarToken);

router.get('/',  listarPagos);    // GET  /api/pagos?mes=5&anio=2026
router.post('/', registrarPago);  // POST /api/pagos

module.exports = router;
