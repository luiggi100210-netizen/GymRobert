// Controlador de máquinas del gimnasio
const pool = require('../config/database');

// GET /api/maquinas — público
async function listarMaquinas(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM maquinas WHERE activo = true ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/maquinas/:id — público (página escaneada por QR)
async function obtenerMaquina(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM maquinas WHERE id = $1 AND activo = true',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/maquinas — requiere auth
async function crearMaquina(req, res, next) {
  try {
    const { nombre, descripcion, foto_url, pdf_url, video_url } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const { rows } = await pool.query(
      `INSERT INTO maquinas (nombre, descripcion, foto_url, pdf_url, video_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, descripcion || null, foto_url || null, pdf_url || null, video_url || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/maquinas/:id — requiere auth
async function editarMaquina(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, foto_url, pdf_url, video_url, activo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const { rows } = await pool.query(
      `UPDATE maquinas SET
        nombre      = $1,
        descripcion = $2,
        foto_url    = $3,
        pdf_url     = $4,
        video_url   = $5,
        activo      = COALESCE($6, activo)
       WHERE id = $7 RETURNING *`,
      [nombre, descripcion || null, foto_url || null, pdf_url || null, video_url || null, activo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/maquinas/:id — soft delete, requiere auth
async function eliminarMaquina(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE maquinas SET activo = false WHERE id = $1 RETURNING id',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    res.json({ mensaje: 'Máquina eliminada correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarMaquinas, obtenerMaquina, crearMaquina, editarMaquina, eliminarMaquina };
