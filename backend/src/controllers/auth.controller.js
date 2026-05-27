// Controlador de autenticación
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../config/database');

const MAX_SESIONES = 4;

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

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

    // Si ya hay MAX_SESIONES activas, cerrar la más antigua
    const { rows: sesiones } = await pool.query(
      'SELECT id FROM admin_sesiones WHERE admin_id = $1 ORDER BY created_at ASC',
      [admin.id]
    );
    if (sesiones.length >= MAX_SESIONES) {
      await pool.query(
        'DELETE FROM admin_sesiones WHERE id = $1',
        [sesiones[0].id]
      );
    }

    // Generar token con jti único para identificar esta sesión
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { id: admin.id, username: admin.username, jti },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await pool.query(
      'INSERT INTO admin_sesiones (admin_id, jti) VALUES ($1, $2)',
      [admin.id, jti]
    );

    res.json({
      token,
      admin:     { id: admin.id, username: admin.username, nombre: admin.nombre },
      sesiones:  sesiones.length >= MAX_SESIONES
                   ? { cerrada: true, mensaje: 'Se cerró la sesión más antigua' }
                   : null,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const { jti } = req.admin;
    if (jti) {
      await pool.query('DELETE FROM admin_sesiones WHERE jti = $1', [jti]);
    }
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/cambiar-password
async function cambiarPassword(req, res, next) {
  try {
    const { password_actual, password_nuevo } = req.body;
    const adminId = req.admin.id;

    if (!password_actual || !password_nuevo) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (password_nuevo.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const { rows } = await pool.query('SELECT * FROM admin WHERE id = $1', [adminId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin no encontrado' });
    }

    const valida = await bcrypt.compare(password_actual, rows[0].password);
    if (!valida) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hash = await bcrypt.hash(password_nuevo, 10);
    await pool.query('UPDATE admin SET password = $1 WHERE id = $2', [hash, adminId]);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, cambiarPassword };
