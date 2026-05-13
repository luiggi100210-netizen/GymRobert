const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { renovarMembresia, vencenProximo } = require('../controllers/membresias.controller');

router.use(verificarToken);

router.post('/',               renovarMembresia);  // POST /api/membresias
router.get('/vencen-pronto',   vencenProximo);     // GET  /api/membresias/vencen-pronto

module.exports = router;
