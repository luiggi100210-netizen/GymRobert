const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { listarPlanes, crearPlan, editarPlan } = require('../controllers/planes.controller');

router.get('/',     listarPlanes);              // GET  /api/planes — público (kiosco lo usa)
router.post('/',    verificarToken, crearPlan); // POST /api/planes
router.put('/:id',  verificarToken, editarPlan);// PUT  /api/planes/:id

module.exports = router;
