// Controlador de planes de membresía
const pool = require('../config/database');

// GET /api/planes
async function listarPlanes(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM planes WHERE activo = true ORDER BY duracion_dias ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/planes
async function crearPlan(req, res, next) {
  try {
    const { nombre, duracion_dias, precio } = req.body;

    if (!nombre || !duracion_dias || !precio) {
      return res.status(400).json({ error: 'Nombre, duración y precio son requeridos' });
    }

    const duracion  = parseInt(duracion_dias);
    const precioNum = parseFloat(precio);
    if (isNaN(duracion) || duracion <= 0) {
      return res.status(400).json({ error: 'La duración debe ser un número mayor a 0' });
    }
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    const { rows } = await pool.query(
      `INSERT INTO planes (nombre, duracion_dias, precio)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, duracion, precioNum]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/planes/:id
async function editarPlan(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, duracion_dias, precio, activo } = req.body;

    if (duracion_dias != null && (isNaN(parseInt(duracion_dias)) || parseInt(duracion_dias) <= 0)) {
      return res.status(400).json({ error: 'La duración debe ser un número mayor a 0' });
    }
    if (precio != null && (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0)) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    const { rows } = await pool.query(
      `UPDATE planes
       SET nombre = COALESCE($1, nombre),
           duracion_dias = COALESCE($2, duracion_dias),
           precio = COALESCE($3, precio),
           activo = COALESCE($4, activo)
       WHERE id = $5 RETURNING *`,
      [nombre, duracion_dias ? parseInt(duracion_dias) : null,
       precio ? parseFloat(precio) : null, activo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPlanes, crearPlan, editarPlan };
