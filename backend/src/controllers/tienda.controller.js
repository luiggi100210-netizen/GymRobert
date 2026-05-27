// Controlador de tienda — productos y ventas
const pool = require('../config/database');

// GET /api/tienda/productos
async function listarProductos(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM productos_tienda WHERE activo = true ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/tienda/productos
async function crearProducto(req, res, next) {
  try {
    const { nombre, precio, stock, foto_url } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    if (precio == null || isNaN(precio) || precio < 0)
      return res.status(400).json({ error: 'Precio inválido' });
    if (stock == null || isNaN(stock) || stock < 0)
      return res.status(400).json({ error: 'Stock inválido' });

    const { rows } = await pool.query(
      `INSERT INTO productos_tienda (nombre, precio, stock, foto_url, activo)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [nombre, precio, parseInt(stock), foto_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tienda/productos/:id
async function editarProducto(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, precio, stock, foto_url } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const { rows } = await pool.query(
      `UPDATE productos_tienda
       SET nombre = $1, precio = $2, stock = $3, foto_url = $4
       WHERE id = $5 AND activo = true RETURNING *`,
      [nombre, precio, parseInt(stock), foto_url || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tienda/productos/:id — soft delete
async function eliminarProducto(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE productos_tienda SET activo = false WHERE id = $1 RETURNING id`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
}

// POST /api/tienda/ventas — registra venta y descuenta stock
async function registrarVenta(req, res, next) {
  const client = await pool.connect();
  try {
    const { producto_id, cantidad } = req.body;
    const cant = parseInt(cantidad);
    if (!producto_id || !cant || cant < 1)
      return res.status(400).json({ error: 'Datos de venta inválidos' });

    await client.query('BEGIN');

    // Verificar stock disponible
    const { rows: prod } = await client.query(
      `SELECT id, nombre, precio, stock FROM productos_tienda WHERE id = $1 AND activo = true FOR UPDATE`,
      [producto_id]
    );
    if (prod.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (prod[0].stock < cant) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${prod[0].stock}` });
    }

    const precio_unitario = parseFloat(prod[0].precio);
    const total = precio_unitario * cant;

    // Descontar stock
    await client.query(
      `UPDATE productos_tienda SET stock = stock - $1 WHERE id = $2`,
      [cant, producto_id]
    );

    // Registrar venta
    const { rows: venta } = await client.query(
      `INSERT INTO ventas_tienda (producto_id, cantidad, precio_unitario, total, admin_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [producto_id, cant, precio_unitario, total, req.admin?.id || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      venta: venta[0],
      producto: { ...prod[0], stock: prod[0].stock - cant },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/tienda/reportes?vista=dia|semana|mes&mes=N&anio=N
async function reporteVentas(req, res, next) {
  try {
    const { vista = 'dia', mes, anio } = req.query;
    const ahora = new Date();
    const mesNum  = parseInt(mes)  || (ahora.getMonth() + 1);
    const anioNum = parseInt(anio) || ahora.getFullYear();

    let whereClause = '';
    let params = [];

    if (vista === 'dia') {
      // Solo hoy (Lima UTC-5)
      whereClause = `DATE(v.fecha AT TIME ZONE 'America/Lima') = CURRENT_DATE AT TIME ZONE 'America/Lima'`;
    } else if (vista === 'semana') {
      // Últimos 7 días
      whereClause = `v.fecha >= NOW() - INTERVAL '7 days'`;
    } else {
      // Mes específico
      whereClause = `EXTRACT(MONTH FROM v.fecha AT TIME ZONE 'America/Lima') = $1
                 AND EXTRACT(YEAR  FROM v.fecha AT TIME ZONE 'America/Lima') = $2`;
      params = [mesNum, anioNum];
    }

    // Ventas detalladas
    const { rows: ventas } = await pool.query(
      `SELECT
         v.id,
         v.cantidad,
         v.precio_unitario,
         v.total,
         v.fecha,
         p.nombre AS producto_nombre,
         p.foto_url
       FROM ventas_tienda v
       JOIN productos_tienda p ON p.id = v.producto_id
       WHERE ${whereClause}
       ORDER BY v.fecha DESC`,
      params
    );

    // Resumen por producto
    const { rows: porProducto } = await pool.query(
      `SELECT
         p.nombre,
         p.foto_url,
         SUM(v.cantidad)::int AS unidades,
         SUM(v.total)         AS ingresos
       FROM ventas_tienda v
       JOIN productos_tienda p ON p.id = v.producto_id
       WHERE ${whereClause}
       GROUP BY p.id, p.nombre, p.foto_url
       ORDER BY ingresos DESC`,
      params
    );

    // Totales generales
    const { rows: totales } = await pool.query(
      `SELECT
         COUNT(*)::int       AS total_transacciones,
         SUM(v.cantidad)::int AS total_unidades,
         COALESCE(SUM(v.total), 0) AS total_ingresos
       FROM ventas_tienda v
       WHERE ${whereClause}`,
      params
    );

    res.json({
      ventas,
      por_producto: porProducto,
      resumen: totales[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarProductos,
  crearProducto,
  editarProducto,
  eliminarProducto,
  registrarVenta,
  reporteVentas,
};
