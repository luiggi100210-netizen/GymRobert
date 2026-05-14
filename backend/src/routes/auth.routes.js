const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../middleware/auth');
const { login, cambiarPassword } = require('../controllers/auth.controller');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/cambiar-password
router.post('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;
