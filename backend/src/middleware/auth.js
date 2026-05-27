// Middleware de autenticación JWT
const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

async function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que la sesión sigue activa en DB
    if (payload.jti) {
      const { rows } = await pool.query(
        'SELECT id FROM admin_sesiones WHERE jti = $1',
        [payload.jti]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Sesión cerrada — inicia sesión nuevamente' });
      }
      // Actualizar last_used
      pool.query('UPDATE admin_sesiones SET last_used = NOW() WHERE jti = $1', [payload.jti]);
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken };
