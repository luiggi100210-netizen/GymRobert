// Controlador de miembros del gimnasio
const pool   = require('../config/database');
const bcrypt = require('bcryptjs');
const { esFechaValida } = require('../utils/validaciones');

// Valida una medida corporal opcional; devuelve mensaje de error o null
function validarMedida(valor, min, max, etiqueta) {
  if (valor == null || valor === '') return null;
  const num = parseFloat(valor);
  if (isNaN(num) || num <= min || num >= max) {
    return `${etiqueta} inválida (debe estar entre ${min} y ${max})`;
  }
  return null;
}

// GET /api/miembros
// Lista todos los miembros con estado de membresía activa
async function listarMiembros(req, res, next) {
  try {
    const { estado, plan_id, buscar } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        m.id, m.dni, m.nombres, m.apellidos, m.telefono,
        m.huella_id, m.estado, m.fecha_registro,
        mem.id          AS membresia_id,
        mem.plan_id,
        mem.fecha_inicio, mem.fecha_fin,
        CASE
          WHEN mem.fecha_fin IS NULL     THEN mem.estado
          WHEN mem.fecha_fin < CURRENT_DATE THEN 'vencida'
          ELSE mem.estado
        END             AS membresia_estado,
        p.nombre        AS plan_nombre,
        p.precio        AS plan_precio,
        p.duracion_dias,
        mem.fecha_fin - CURRENT_DATE    AS dias_restantes,
        COUNT(*) OVER()                 AS total_count
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

    if (estado === 'activo') {
      query += ` AND mem.estado = 'activa' AND mem.fecha_fin >= CURRENT_DATE`;
    } else if (estado === 'vencido') {
      query += ` AND (mem.estado IS DISTINCT FROM 'activa' OR mem.fecha_fin < CURRENT_DATE OR mem.id IS NULL)`;
    }

    if (plan_id) {
      query += ` AND mem.plan_id = $${idx++}`;
      params.push(plan_id);
    }

    if (buscar) {
      query += ` AND (
        LOWER(m.nombres)   LIKE $${idx}   OR
        LOWER(m.apellidos) LIKE $${idx}   OR
        LOWER(m.dni)       LIKE $${idx}
      )`;
      params.push(`%${buscar.toLowerCase()}%`);
      idx++;
    }

    query += ` ORDER BY m.fecha_registro DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const data  = rows.map(({ total_count, ...r }) => r);

    res.json({ data, total, page, limit });
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
        mem.plan_id,
        mem.fecha_inicio, mem.fecha_fin,
        CASE
          WHEN mem.fecha_fin IS NULL        THEN mem.estado
          WHEN mem.fecha_fin < CURRENT_DATE THEN 'vencida'
          ELSE mem.estado
        END             AS membresia_estado,
        p.nombre        AS plan_nombre,
        p.precio        AS plan_precio,
        mem.fecha_fin - CURRENT_DATE AS dias_restantes
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
  const {
    dni, nombres, apellidos, telefono, fecha_nacimiento, huella_id,
    plan_id, fecha_inicio,
    metodo_pago, comprobante,
    peso_kg, estatura_cm
  } = req.body;

  if (!dni || !nombres || !apellidos || !plan_id || !fecha_inicio) {
    return res.status(400).json({
      error: 'DNI, nombres, apellidos, plan y fecha de inicio son requeridos'
    });
  }

  if (!/^\d{8}$/.test(dni)) {
    return res.status(400).json({ error: 'DNI debe tener exactamente 8 dígitos' });
  }

  if (!esFechaValida(fecha_inicio)) {
    return res.status(400).json({ error: 'fecha_inicio inválida. Formato esperado: YYYY-MM-DD' });
  }

  // Medidas corporales opcionales — solo se validan si vienen
  const errorMedida =
    validarMedida(peso_kg, 20, 400, 'peso_kg') ||
    validarMedida(estatura_cm, 80, 260, 'estatura_cm');
  if (errorMedida) {
    return res.status(400).json({ error: errorMedida });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    // Crear membresía (fecha_fin calculada con parámetros — sin interpolación SQL)
    const { rows: membresiaRows } = await client.query(
      `INSERT INTO membresias (miembro_id, plan_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, ($3::DATE + $4 * INTERVAL '1 day')::DATE) RETURNING *`,
      [miembro.id, plan_id, fecha_inicio, plan.duracion_dias]
    );
    const membresia = membresiaRows[0];

    // Registrar pago
    const { rows: pagoRows } = await client.query(
      `INSERT INTO pagos (membresia_id, monto, metodo_pago, comprobante)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [membresia.id, plan.precio, metodo_pago || 'efectivo', comprobante || null]
    );

    // Medida inicial (solo si el miembro aceptó darla)
    if (peso_kg || estatura_cm) {
      await client.query(
        `INSERT INTO medidas (miembro_id, peso_kg, estatura_cm)
         VALUES ($1, $2, $3)`,
        [miembro.id, peso_kg || null, estatura_cm || null]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      miembro,
      membresia: membresiaRows[0],
      pago: pagoRows[0],
      plan
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // DNI duplicado — constraint UNIQUE en tabla miembros
    if (err.code === '23505' && err.constraint?.includes('dni')) {
      return res.status(409).json({ error: 'Ya existe un miembro con ese DNI' });
    }
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

    // telefono: distinguir "no enviado" (conservar) de null/'' (borrar intencionalmente)
    const telefonoEnviado = Object.prototype.hasOwnProperty.call(req.body, 'telefono');

    const { rows } = await pool.query(
      `UPDATE miembros SET
        nombres          = CASE WHEN $1 IS NOT NULL THEN $1 ELSE nombres END,
        apellidos        = CASE WHEN $2 IS NOT NULL THEN $2 ELSE apellidos END,
        telefono         = CASE WHEN $8 THEN $3 ELSE telefono END,
        fecha_nacimiento = CASE WHEN $4 IS NOT NULL THEN $4 ELSE fecha_nacimiento END,
        huella_id        = CASE WHEN $5 IS NOT NULL THEN $5 ELSE huella_id END,
        estado           = CASE WHEN $6 IS NOT NULL THEN $6 ELSE estado END
       WHERE id = $7 RETURNING *`,
      [
        nombres   ? nombres.toUpperCase()   : null,
        apellidos ? apellidos.toUpperCase() : null,
        telefono || null, fecha_nacimiento || null, huella_id || null, estado || null, id,
        telefonoEnviado
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

// GET /api/miembros/reniec/:dni
// Proxy hacia apis.net.pe para autocompletar nombre/apellidos desde RENIEC
async function buscarReniec(req, res, next) {
  try {
    const { dni } = req.params;
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ error: 'DNI debe tener exactamente 8 dígitos' });
    }
    if (!process.env.RENIEC_TOKEN) {
      return res.status(503).json({ error: 'Servicio RENIEC no configurado' });
    }
    const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${dni}`, {
      headers: { Authorization: `Bearer ${process.env.RENIEC_TOKEN}` },
    });
    if (!response.ok) {
      return res.status(404).json({ error: 'DNI no encontrado en RENIEC' });
    }
    const data = await response.json();
    if (data.message) {
      return res.status(404).json({ error: 'DNI no encontrado en RENIEC' });
    }
    res.json({
      nombres:   data.first_name,
      apellidos: `${data.first_last_name} ${data.second_last_name}`.trim(),
    });
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

// DELETE /api/miembros/:id
// Elimina al miembro y TODO su historial (membresías, pagos, asistencias,
// medidas — por cascada). Acción irreversible: requiere contraseña del admin.
async function eliminarMiembro(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Se requiere la contraseña para eliminar' });
    }

    const { rows: adminRows } = await pool.query(
      'SELECT password FROM admin WHERE id = $1',
      [req.admin.id]
    );
    if (adminRows.length === 0) {
      return res.status(401).json({ error: 'Administrador no encontrado' });
    }
    const valido = await bcrypt.compare(password, adminRows[0].password);
    if (!valido) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const { rows } = await pool.query(
      'DELETE FROM miembros WHERE id = $1 RETURNING id, nombres, apellidos',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    res.json({ mensaje: `Miembro ${rows[0].nombres} ${rows[0].apellidos} eliminado junto con todo su historial` });
  } catch (err) {
    next(err);
  }
}

// GET /api/miembros/:id/medidas
// Historial de medidas del miembro (ascendente para graficar progreso)
async function listarMedidas(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, fecha, peso_kg, estatura_cm
       FROM medidas WHERE miembro_id = $1
       ORDER BY fecha ASC, id ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/miembros/:id/medidas
// Registrar una nueva medida (peso y/o estatura)
async function registrarMedida(req, res, next) {
  try {
    const { id } = req.params;
    const { peso_kg, estatura_cm } = req.body;

    if (!peso_kg && !estatura_cm) {
      return res.status(400).json({ error: 'Debe indicar al menos peso o estatura' });
    }
    const errorMedida =
      validarMedida(peso_kg, 20, 400, 'peso_kg') ||
      validarMedida(estatura_cm, 80, 260, 'estatura_cm');
    if (errorMedida) {
      return res.status(400).json({ error: errorMedida });
    }

    const { rows: miembro } = await pool.query(
      'SELECT id FROM miembros WHERE id = $1', [id]
    );
    if (miembro.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    const { rows } = await pool.query(
      `INSERT INTO medidas (miembro_id, peso_kg, estatura_cm)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, peso_kg || null, estatura_cm || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/miembros/frecuentes
// Miembros constantes del mes actual (para mensajes de motivación por WhatsApp)
async function miembrosFrecuentes(req, res, next) {
  try {
    const minimo = Math.max(1, parseInt(req.query.minimo) || 6);

    const { rows } = await pool.query(
      `SELECT
        m.id, m.nombres, m.apellidos, m.dni, m.telefono,
        COUNT(a.id)::int AS asistencias_mes,
        p.nombre AS plan_nombre
       FROM miembros m
       JOIN asistencias a ON a.miembro_id = m.id
         AND DATE_TRUNC('month', a.fecha) = DATE_TRUNC('month', CURRENT_DATE)
       LEFT JOIN LATERAL (
         SELECT * FROM membresias WHERE miembro_id = m.id ORDER BY fecha_fin DESC LIMIT 1
       ) mem ON true
       LEFT JOIN planes p ON mem.plan_id = p.id
       GROUP BY m.id, m.nombres, m.apellidos, m.dni, m.telefono, p.nombre
       HAVING COUNT(a.id) >= $1
       ORDER BY asistencias_mes DESC
       LIMIT 200`,
      [minimo]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarMiembros, obtenerMiembro, crearMiembro, editarMiembro, eliminarMiembro,
  buscarPorDni, buscarReniec,
  listarMedidas, registrarMedida, miembrosFrecuentes,
};
