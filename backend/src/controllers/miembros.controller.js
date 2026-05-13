// Controlador de miembros del gimnasio
const pool = require('../config/database');

// GET /api/miembros
// Lista todos los miembros con estado de membresía activa
async function listarMiembros(req, res, next) {
  try {
    const { estado, plan_id, buscar } = req.query;

    let query = `
      SELECT
        m.id, m.dni, m.nombres, m.apellidos, m.telefono,
        m.huella_id, m.estado, m.fecha_registro,
        mem.id          AS membresia_id,
        mem.fecha_inicio, mem.fecha_fin,
        mem.estado      AS membresia_estado,
        p.nombre        AS plan_nombre,
        p.precio        AS plan_precio,
        p.duracion_dias,
        -- Días restantes de membresía
        GREATEST(0, mem.fecha_fin - CURRENT_DATE) AS dias_restantes
      FROM miembros m
      LEFT JOIN LATERAL (
        SELECT * FROM membresias
        WHERE miembro_id = m.id
        ORDER BY fecha_fin DESC
        LIMIT 1
      ) mem ON true
      LEFT JOIN planes p ON mem.plan_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    if (estado) {
      query += ` AND m.estado = $${idx++}`;
      params.push(estado);
    }

    if (plan_id) {
      query += ` AND mem.plan_id = $${idx++}`;
      params.push(plan_id);
    }

    if (buscar) {
      query += ` AND (
        LOWER(m.nombres)   LIKE $${idx}   OR
        LOWER(m.apellidos) LIKE $${idx}   OR
        m.dni              LIKE $${idx}
      )`;
      params.push(`%${buscar.toLowerCase()}%`);
      idx++;
    }

    query += ' ORDER BY m.fecha_registro DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/miembros/:id
// Detalle de un miembro con historial de pagos
async function obtenerMiembro(req, res, next) {
  try {
    const { id } = req.params;

    // Datos del miembro
    const { rows: miembro } = await pool.query(
      `SELECT
        m.*,
        mem.id          AS membresia_id,
        mem.fecha_inicio, mem.fecha_fin,
        mem.estado      AS membresia_estado,
        p.nombre        AS plan_nombre,
        p.precio        AS plan_precio,
        GREATEST(0, mem.fecha_fin - CURRENT_DATE) AS dias_restantes
       FROM miembros m
       LEFT JOIN LATERAL (
         SELECT * FROM membresias WHERE miembro_id = m.id ORDER BY fecha_fin DESC LIMIT 1
       ) mem ON true
       LEFT JOIN planes p ON mem.plan_id = p.id
       WHERE m.id = $1`,
      [id]
    );

    if (miembro.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    // Historial de pagos
    const { rows: pagos } = await pool.query(
      `SELECT pa.*, p.nombre AS plan_nombre, mem.fecha_inicio, mem.fecha_fin
       FROM pagos pa
       JOIN membresias mem ON pa.membresia_id = mem.id
       JOIN planes p ON mem.plan_id = p.id
       WHERE mem.miembro_id = $1
       ORDER BY pa.fecha_pago DESC`,
      [id]
    );

    // Conteo de asistencias del mes actual
    const { rows: asistenciaMes } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM asistencias
       WHERE miembro_id = $1
         AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)`,
      [id]
    );

    res.json({
      ...miembro[0],
      historial_pagos: pagos,
      asistencias_mes: parseInt(asistenciaMes[0].total)
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/miembros
// Crear miembro + membresía + pago en una sola operación
async function crearMiembro(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      dni, nombres, apellidos, telefono, fecha_nacimiento, huella_id,
      plan_id, fecha_inicio,
      metodo_pago, comprobante
    } = req.body;

    // Validaciones básicas
    if (!dni || !nombres || !apellidos || !plan_id || !fecha_inicio) {
      return res.status(400).json({
        error: 'DNI, nombres, apellidos, plan y fecha de inicio son requeridos'
      });
    }

    // Crear miembro
    const { rows: miembroRows } = await client.query(
      `INSERT INTO miembros (dni, nombres, apellidos, telefono, fecha_nacimiento, huella_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dni, nombres.toUpperCase(), apellidos.toUpperCase(),
       telefono || null, fecha_nacimiento || null, huella_id || null]
    );
    const miembro = miembroRows[0];

    // Obtener duración del plan
    const { rows: planRows } = await client.query(
      'SELECT * FROM planes WHERE id = $1 AND activo = true',
      [plan_id]
    );
    if (planRows.length === 0) {
      throw { status: 404, message: 'Plan no encontrado o inactivo' };
    }
    const plan = planRows[0];

    // Calcular fecha fin
    const fechaFin = `(DATE '${fecha_inicio}' + INTERVAL '${plan.duracion_dias} days')::DATE`;

    // Crear membresía
    const { rows: membresiaRows } = await client.query(
      `INSERT INTO membresias (miembro_id, plan_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, ${fechaFin}) RETURNING *`,
      [miembro.id, plan_id, fecha_inicio]
    );
    const membresia = membresiaRows[0];

    // Registrar pago
    const { rows: pagoRows } = await client.query(
      `INSERT INTO pagos (membresia_id, monto, metodo_pago, comprobante)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [membresia.id, plan.precio, metodo_pago || 'efectivo', comprobante || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      miembro,
      membresia: membresiaRows[0],
      pago: pagoRows[0],
      plan
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PUT /api/miembros/:id
async function editarMiembro(req, res, next) {
  try {
    const { id } = req.params;
    const { nombres, apellidos, telefono, fecha_nacimiento, huella_id, estado } = req.body;

    const { rows } = await pool.query(
      `UPDATE miembros SET
        nombres          = COALESCE($1, nombres),
        apellidos        = COALESCE($2, apellidos),
        telefono         = COALESCE($3, telefono),
        fecha_nacimiento = COALESCE($4, fecha_nacimiento),
        huella_id        = COALESCE($5, huella_id),
        estado           = COALESCE($6, estado)
       WHERE id = $7 RETURNING *`,
      [
        nombres   ? nombres.toUpperCase()   : null,
        apellidos ? apellidos.toUpperCase() : null,
        telefono, fecha_nacimiento, huella_id, estado, id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/miembros/dni/:dni
// Buscar por DNI para autollenado de formulario
async function buscarPorDni(req, res, next) {
  try {
    const { dni } = req.params;

    const { rows } = await pool.query(
      `SELECT id, dni, nombres, apellidos, telefono, fecha_nacimiento, huella_id, estado
       FROM miembros WHERE dni = $1`,
      [dni]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado con ese DNI' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarMiembros, obtenerMiembro, crearMiembro, editarMiembro, buscarPorDni };
