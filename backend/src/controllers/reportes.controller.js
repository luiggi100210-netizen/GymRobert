// Controlador de reportes y dashboard
const pool = require('../config/database');

// GET /api/reportes/dashboard
// Estadísticas generales para el panel principal
async function dashboard(req, res, next) {
  try {
    // Miembros activos (membresía vigente)
    const { rows: miembrosActivos } = await pool.query(
      `SELECT COUNT(DISTINCT miembro_id) AS total
       FROM membresias
       WHERE estado = 'activa' AND fecha_fin >= CURRENT_DATE`
    );

    // Ingresos del mes actual
    const { rows: ingresosMes } = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM pagos
       WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR  FROM fecha_pago) = EXTRACT(YEAR  FROM CURRENT_DATE)
         AND estado = 'pagado'`
    );

    // Membresías que vencen en los próximos 7 días
    const { rows: vencenProximo } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM membresias
       WHERE estado = 'activa'
         AND fecha_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7)`
    );

    // Asistencias de hoy
    const { rows: asistenciasHoy } = await pool.query(
      `SELECT COUNT(*) AS total FROM asistencias WHERE fecha = CURRENT_DATE`
    );

    // Asistencias de los últimos 7 días (para gráfico de barras)
    const { rows: asistencias7dias } = await pool.query(
      `SELECT
        fecha,
        TO_CHAR(fecha, 'DD/MM') AS etiqueta,
        COUNT(*)                AS total
       FROM asistencias
       WHERE fecha >= CURRENT_DATE - 6
       GROUP BY fecha
       ORDER BY fecha ASC`
    );

    // Miembros registrados este mes
    const { rows: nuevosMiembros } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM miembros
       WHERE EXTRACT(MONTH FROM fecha_registro) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR  FROM fecha_registro) = EXTRACT(YEAR  FROM CURRENT_DATE)`
    );

    // Proyección siguiente mes (miembros activos × precio de su plan)
    const { rows: proyeccion } = await pool.query(
      `SELECT COALESCE(SUM(p.precio), 0) AS total
       FROM membresias mem
       JOIN planes p ON mem.plan_id = p.id
       WHERE mem.estado = 'activa'
         AND mem.fecha_fin >= CURRENT_DATE`
    );

    // Últimos 5 miembros registrados
    const { rows: ultimosMiembros } = await pool.query(
      `SELECT
        m.id, m.dni, m.nombres, m.apellidos, m.estado, m.fecha_registro,
        mem.fecha_fin, p.nombre AS plan_nombre,
        mem.fecha_fin - CURRENT_DATE AS dias_restantes
       FROM miembros m
       LEFT JOIN LATERAL (
         SELECT * FROM membresias WHERE miembro_id = m.id ORDER BY fecha_fin DESC LIMIT 1
       ) mem ON true
       LEFT JOIN planes p ON mem.plan_id = p.id
       ORDER BY m.fecha_registro DESC
       LIMIT 5`
    );

    res.json({
      miembros_activos:    parseInt(miembrosActivos[0].total),
      ingresos_mes:        parseFloat(ingresosMes[0].total),
      vencen_pronto:       parseInt(vencenProximo[0].total),
      asistencias_hoy:     parseInt(asistenciasHoy[0].total),
      nuevos_mes:          parseInt(nuevosMiembros[0].total),
      proyeccion_mes:      parseFloat(proyeccion[0].total),
      asistencias_7_dias:  asistencias7dias,
      ultimos_miembros:    ultimosMiembros
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reportes/ingresos/:mes/:anio
async function ingresosMes(req, res, next) {
  try {
    const { mes, anio } = req.params;

    // Resumen del mes
    const { rows: resumen } = await pool.query(
      `SELECT
        COUNT(*)               AS total_pagos,
        COALESCE(SUM(monto), 0) AS total_ingresos,
        metodo_pago,
        COALESCE(SUM(monto) FILTER (WHERE metodo_pago = 'efectivo'),    0) AS efectivo,
        COALESCE(SUM(monto) FILTER (WHERE metodo_pago = 'yape'),        0) AS yape,
        COALESCE(SUM(monto) FILTER (WHERE metodo_pago = 'plin'),        0) AS plin,
        COALESCE(SUM(monto) FILTER (WHERE metodo_pago = 'transferencia'), 0) AS transferencia
       FROM pagos
       WHERE EXTRACT(MONTH FROM fecha_pago) = $1
         AND EXTRACT(YEAR  FROM fecha_pago) = $2
         AND estado = 'pagado'`,
      [parseInt(mes), parseInt(anio)]
    );

    // Ingresos por día
    const { rows: porDia } = await pool.query(
      `SELECT
        fecha_pago     AS fecha,
        COUNT(*)       AS pagos,
        SUM(monto)     AS monto
       FROM pagos
       WHERE EXTRACT(MONTH FROM fecha_pago) = $1
         AND EXTRACT(YEAR  FROM fecha_pago) = $2
         AND estado = 'pagado'
       GROUP BY fecha_pago
       ORDER BY fecha_pago ASC`,
      [parseInt(mes), parseInt(anio)]
    );

    // Por plan
    const { rows: porPlan } = await pool.query(
      `SELECT
        p.nombre AS plan,
        COUNT(*) AS cantidad,
        SUM(pa.monto) AS total
       FROM pagos pa
       JOIN membresias mem ON pa.membresia_id = mem.id
       JOIN planes p ON mem.plan_id = p.id
       WHERE EXTRACT(MONTH FROM pa.fecha_pago) = $1
         AND EXTRACT(YEAR  FROM pa.fecha_pago) = $2
         AND pa.estado = 'pagado'
       GROUP BY p.nombre
       ORDER BY total DESC`,
      [parseInt(mes), parseInt(anio)]
    );

    res.json({
      resumen:  resumen[0],
      por_dia:  porDia,
      por_plan: porPlan
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reportes/proyeccion
// Proyección de ingresos del siguiente mes basada en membresías activas
async function proyeccion(req, res, next) {
  try {
    // Membresías que vencen el siguiente mes → candidatas a renovar
    const { rows: vencenSiguiente } = await pool.query(
      `SELECT
        COUNT(*) AS total_vencen,
        COALESCE(SUM(p.precio), 0) AS ingresos_potenciales
       FROM membresias mem
       JOIN planes p ON mem.plan_id = p.id
       WHERE mem.estado = 'activa'
         AND EXTRACT(MONTH FROM mem.fecha_fin) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 month')
         AND EXTRACT(YEAR  FROM mem.fecha_fin) = EXTRACT(YEAR  FROM CURRENT_DATE + INTERVAL '1 month')`
    );

    // Ingresos del mes actual (para comparar)
    const { rows: mesActual } = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM pagos
       WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR  FROM fecha_pago) = EXTRACT(YEAR  FROM CURRENT_DATE)
         AND estado = 'pagado'`
    );

    // Ingresos del mes anterior
    const { rows: mesAnterior } = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM pagos
       WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
         AND EXTRACT(YEAR  FROM fecha_pago) = EXTRACT(YEAR  FROM CURRENT_DATE - INTERVAL '1 month')
         AND estado = 'pagado'`
    );

    res.json({
      mes_actual:        parseFloat(mesActual[0].total),
      mes_anterior:      parseFloat(mesAnterior[0].total),
      vencen_siguiente:  parseInt(vencenSiguiente[0].total_vencen),
      proyeccion:        parseFloat(vencenSiguiente[0].ingresos_potenciales)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, ingresosMes, proyeccion };
