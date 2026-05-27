const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { renovarMembresia, vencenProximo, actualizarMembresia, obtenerVencidos } = require('../controllers/membresias.controller');

router.use(verificarToken);

router.post('/',               renovarMembresia);    // POST /api/membresias
router.get('/vencen-pronto',   vencenProximo);       // GET  /api/membresias/vencen-pronto
router.get('/vencidos',        obtenerVencidos);     // GET  /api/membresias/vencidos
router.put('/:id',             actualizarMembresia); // PUT  /api/membresias/:id

module.exports = router;
