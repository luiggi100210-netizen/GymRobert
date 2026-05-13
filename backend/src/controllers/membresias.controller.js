// Controlador de membresías
const pool = require('../config/database');

// POST /api/membresias
// Renovar membresía de un miembro existente
async function renovarMembresia(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { miembro_id, plan_id, fecha_inicio, metodo_pago, comprobante } = req.body;

    if (!miembro_id || !plan_id || !fecha_inicio) {
      return res.status(400).json({ error: 'Miembro, plan y fecha de inicio son requeridos' });
    }

    // Verificar que el miembro exista
    const { rows: miembroRows } = await client.query(
      'SELECT id, nombres, apellidos FROM miembros WHERE id = $1',
      [miembro_id]
    );
    if (miembroRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    // Obtener plan
    const { rows: planRows } = await client.query(
      'SELECT * FROM planes WHERE id = $1 AND activo = true',
      [plan_id]
    );
    if (planRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Plan no encontrado o inactivo' });
    }
    const plan = planRows[0];

    // Marcar membresía anterior como vencida
    await client.query(
      `UPDATE membresias SET estado = 'vencida'
       WHERE miembro_id = $1 AND estado = 'activa'`,
      [miembro_id]
    );

    // Crear nueva membresía (fecha_fin calculada con parámetros — sin interpolación SQL)
    const { rows: membresiaRows } = await client.query(
      `INSERT INTO membresias (miembro_id, plan_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, ($3::DATE + $4 * INTERVAL '1 day')::DATE) RETURNING *`,
      [miembro_id, plan_id, fecha_inicio, plan.duracion_dias]
    );
    const membresia = membresiaRows[0];

    // Registrar pago
    const { rows: pagoRows } = await client.query(
      `INSERT INTO pagos (membresia_id, monto, metodo_pago, comprobante)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [membresia.id, plan.precio, metodo_pago || 'efectivo', comprobante || null]
    );

    // Actualizar estado del miembro a activo
    await client.query(
      "UPDATE miembros SET estado = 'activo' WHERE id = $1",
      [miembro_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      membresia: membresiaRows[0],
      pago: pagoRows[0],
      plan,
      miembro: miembroRows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/membresias/vencen-pronto
// Membresías que vencen en los próximos 7 días
async function vencenProximo(req, res, next) {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const { rows } = await pool.query(
      `SELECT
        m.id, m.nombres, m.apellidos, m.dni, m.telefono,
        mem.id AS membresia_id,
        mem.fecha_fin,
        mem.fecha_fin - CURRENT_DATE AS dias_restantes,
        p.nombre AS plan_nombre,
        p.precio
       FROM membresias mem
       JOIN miembros m ON mem.miembro_id = m.id
       JOIN planes   p ON mem.plan_id    = p.id
       WHERE mem.estado = 'activa'
         AND mem.fecha_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1::INT)
       ORDER BY mem.fecha_fin ASC`,
      [dias]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { renovarMembresia, vencenProximo };
