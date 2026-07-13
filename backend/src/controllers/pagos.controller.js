// Controlador de pagos
const pool   = require('../config/database');
const bcrypt = require('bcryptjs');

// GET /api/pagos
// Historial de pagos paginado con filtro opcional por mes/año.
// Devuelve { data, total, page, limit, resumen } — el resumen se calcula
// sobre TODO el período (no solo la página) para las tarjetas del panel.
async function listarPagos(req, res, next) {
  try {
    const { mes, anio } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    let where = '';
    const filtros = [];
    let idx = 1;

    if (mes && anio) {
      where = ` AND EXTRACT(MONTH FROM pa.fecha_pago) = $${idx++}
                AND EXTRACT(YEAR  FROM pa.fecha_pago) = $${idx++}`;
      filtros.push(parseInt(mes), parseInt(anio));
    } else if (anio) {
      where = ` AND EXTRACT(YEAR FROM pa.fecha_pago) = $${idx++}`;
      filtros.push(parseInt(anio));
    }

    const [{ rows: data }, { rows: porMetodo }] = await Promise.all([
      pool.query(
        `SELECT
          pa.*,
          m.nombres, m.apellidos, m.dni,
          p.nombre AS plan_nombre,
          mem.fecha_inicio, mem.fecha_fin
         FROM pagos pa
         JOIN membresias mem ON pa.membresia_id = mem.id
         JOIN miembros   m   ON mem.miembro_id  = m.id
         JOIN planes     p   ON mem.plan_id     = p.id
         WHERE 1=1 ${where}
         ORDER BY pa.fecha_pago DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...filtros, limit, offset]
      ),
      pool.query(
        `SELECT
          metodo_pago,
          COUNT(*)                 AS pagos,
          COALESCE(SUM(monto), 0)  AS monto
         FROM pagos pa
         WHERE 1=1 ${where}
         GROUP BY metodo_pago`,
        filtros
      ),
    ]);

    const total       = porMetodo.reduce((acc, r) => acc + parseInt(r.pagos), 0);
    const totalMonto  = porMetodo.reduce((acc, r) => acc + parseFloat(r.monto), 0);

    res.json({
      data,
      total,
      page,
      limit,
      resumen: { total_monto: totalMonto, por_metodo: porMetodo },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/pagos
// Registrar un pago adicional (abono, pago pendiente, etc.)
async function registrarPago(req, res, next) {
  try {
    const { membresia_id, monto, metodo_pago, fecha_pago, comprobante } = req.body;

    if (!membresia_id || !monto) {
      return res.status(400).json({ error: 'Membresía y monto son requeridos' });
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }

    const { rows } = await pool.query(
      `INSERT INTO pagos (membresia_id, monto, metodo_pago, fecha_pago, comprobante)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        membresia_id,
        montoNum,
        metodo_pago || 'efectivo',
        fecha_pago  || null,
        comprobante || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/pagos/:id
// Eliminar un pago del historial — requiere contraseña del admin
async function eliminarPago(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Se requiere la contraseña para eliminar' });
    }

    // Verificar contraseña del admin autenticado
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
      'DELETE FROM pagos WHERE id = $1 RETURNING id',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ mensaje: 'Pago eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPagos, registrarPago, eliminarPago };
