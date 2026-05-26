const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  listarMaquinas,
  obtenerMaquina,
  crearMaquina,
  editarMaquina,
  eliminarMaquina,
} = require('../controllers/maquinas.controller');

// Públicas — el cliente las accede al escanear el QR
router.get('/',     listarMaquinas);  // GET  /api/maquinas
router.get('/:id',  obtenerMaquina);  // GET  /api/maquinas/:id

// Protegidas — solo el admin
router.post('/',        verificarToken, crearMaquina);    // POST   /api/maquinas
router.put('/:id',      verificarToken, editarMaquina);   // PUT    /api/maquinas/:id
router.delete('/:id',   verificarToken, eliminarMaquina); // DELETE /api/maquinas/:id

module.exports = router;
