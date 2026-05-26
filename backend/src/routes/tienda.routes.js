const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  listarProductos,
  crearProducto,
  editarProducto,
  eliminarProducto,
  registrarVenta,
  reporteVentas,
} = require('../controllers/tienda.controller');

// Productos
router.get('/productos',      verificarToken, listarProductos);
router.post('/productos',     verificarToken, crearProducto);
router.put('/productos/:id',  verificarToken, editarProducto);
router.delete('/productos/:id', verificarToken, eliminarProducto);

// Ventas
router.post('/ventas',    verificarToken, registrarVenta);
router.get('/reportes',   verificarToken, reporteVentas);

module.exports = router;
