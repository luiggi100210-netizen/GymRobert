const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  listarMiembros,
  obtenerMiembro,
  crearMiembro,
  editarMiembro,
  buscarPorDni,
  buscarReniec,
} = require('../controllers/miembros.controller');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// IMPORTANTE: rutas con segmentos fijos van ANTES de /:id
router.get('/reniec/:dni', buscarReniec);   // GET /api/miembros/reniec/:dni
router.get('/dni/:dni',    buscarPorDni);   // GET /api/miembros/dni/:dni
router.get('/',         listarMiembros);    // GET /api/miembros
router.get('/:id',      obtenerMiembro);   // GET /api/miembros/:id
router.post('/',        crearMiembro);     // POST /api/miembros
router.put('/:id',      editarMiembro);    // PUT /api/miembros/:id

module.exports = router;
