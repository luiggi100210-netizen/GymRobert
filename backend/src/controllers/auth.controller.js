// Controlador de autenticación
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/database');

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar admin en la base de datos
    const { rows } = await pool.query(
      'SELECT * FROM admin WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const admin = rows[0];
    const passwordValida = await bcrypt.compare(password, admin.password);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      admin: { id: admin.id, username: admin.username, nombre: admin.nombre }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
