// Controlador de asistencia — lógica crítica del kiosco biométrico
const pool = require('../config/database');

// POST /api/asistencia/toque
// Endpoint principal del kiosco: registra entrada o salida automáticamente
async function registrarToque(req, res, next) {
  const { huella_id } = req.body;

  if (!huella_id) {
    return res.status(400).json({ error: 'huella_id es requerido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar miembro por huella_id
    const { rows: miembroRows } = await client.query(
      `SELECT id, nombres, apellidos, dni, telefono, estado
       FROM miembros WHERE huella_id = $1`,
      [huella_id]
    );

    if (miembroRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        estado: 'denegado',
        motivo: 'huella_no_registrada',
        mensaje: 'Huella no registrada en el sistema'
      });
    }

    const miembro = miembroRows[0];

    // Si el miembro está suspendido
    if (miembro.estado === 'suspendido') {
      await client.query('ROLLBACK');
      return res.json({
        estado: 'denegado',
        motivo: 'miembro_suspendido',
        mensaje: 'Membresía suspendida. Acércate a recepción.',
        miembro: formatearMiembro(miembro)
      });
    }

    // 2. Verificar membresía activa (fecha_fin >= hoy)
    const { rows: membresiaRows } = await client.query(
      `SELECT mem.*, p.nombre AS plan_nombre, p.duracion_dias,
              mem.fecha_fin - CURRENT_DATE AS dias_restantes
       FROM membresias mem
       JOIN planes p ON mem.plan_id = p.id
       WHERE mem.miembro_id = $1
         AND mem.estado = 'activa'
         AND mem.fecha_fin >= CURRENT_DATE
       ORDER BY mem.fecha_fin DESC
       LIMIT 1`,
      [miembro.id]
    );

    if (membresiaRows.length === 0) {
      // Membresía vencida o inexistente
      await client.query('ROLLBACK');
      return res.json({
        estado: 'denegado',
        motivo: 'membresia_vencida',
        mensaje: 'Membresía vencida. Acércate a recepción para renovar.',
        miembro: formatearMiembro(miembro)
      });
    }

    const membresia = membresiaRows[0];

    // 3. Buscar registro de asistencia de hoy (UNIQUE miembro_id + fecha)
    const { rows: asistenciaRows } = await client.query(
      `SELECT * FROM asistencias
       WHERE miembro_id = $1
         AND fecha = CURRENT_DATE`,
      [miembro.id]
    );

    let asistencia;
    let estadoRespuesta;

    if (asistenciaRows.length === 0) {
      // NO existe registro hoy → ENTRADA
      const { rows } = await client.query(
        `INSERT INTO asistencias (miembro_id, fecha, entrada, membresia_valida)
         VALUES ($1, CURRENT_DATE, NOW() AT TIME ZONE 'America/Lima', true)
         RETURNING *`,
        [miembro.id]
      );
      asistencia = rows[0];
      estadoRespuesta = 'entrada';

    } else {
      const registro = asistenciaRows[0];

      if (registro.salida === null) {
        // Existe registro pero sin salida → SALIDA
        const { rows } = await client.query(
          `UPDATE asistencias
           SET salida = NOW() AT TIME ZONE 'America/Lima',
               duracion_minutos = ROUND(
                 EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'America/Lima' - entrada)) / 60
               )
           WHERE id = $1 RETURNING *`,
          [registro.id]
        );
        asistencia = rows[0];
        estadoRespuesta = 'salida';

      } else {
        // Ya tiene entrada y salida → IGNORADO (visita completa del día)
        await client.query('ROLLBACK');
        return res.json({
          estado: 'ignorado',
          mensaje: 'Visita del día ya completada',
          miembro: formatearMiembro(miembro),
          asistencia: registro
        });
      }
    }

    await client.query('COMMIT');

    // Respuesta completa para el kiosco
    res.json({
      estado: estadoRespuesta,
      miembro: formatearMiembro(miembro),
      membresia: {
        plan_nombre:    membresia.plan_nombre,
        fecha_fin:      membresia.fecha_fin,
        dias_restantes: membresia.dias_restantes,
        duracion_dias:  membresia.duracion_dias
      },
      asistencia: {
        fecha:            asistencia.fecha,
        entrada:          asistencia.entrada,
        salida:           asistencia.salida,
        duracion_minutos: asistencia.duracion_minutos
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/asistencia/hoy
// Lista de asistencias del día actual
async function asistenciasHoy(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
        a.*,
        m.nombres, m.apellidos, m.dni,
        mem.id AS membresia_id,
        p.nombre AS plan_nombre
       FROM asistencias a
       JOIN miembros m    ON a.miembro_id    = m.id
       LEFT JOIN membresias mem ON mem.miembro_id = m.id
         AND mem.estado = 'activa'
         AND mem.fecha_fin >= CURRENT_DATE
       LEFT JOIN planes p ON mem.plan_id = p.id
       WHERE a.fecha = CURRENT_DATE
       ORDER BY a.entrada DESC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/asistencia/dia/:fecha
// Asistencias de un día específico (formato: YYYY-MM-DD)
async function asistenciasDia(req, res, next) {
  try {
    const { fecha } = req.params;

    const { rows } = await pool.query(
      `SELECT
        a.*,
        m.nombres, m.apellidos, m.dni,
        mem.plan_nombre
       FROM asistencias a
       JOIN miembros m ON a.miembro_id = m.id
       LEFT JOIN LATERAL (
         SELECT p2.nombre AS plan_nombre
         FROM membresias mem2
         JOIN planes p2 ON mem2.plan_id = p2.id
         WHERE mem2.miembro_id = m.id
         ORDER BY mem2.fecha_fin DESC LIMIT 1
       ) mem ON true
       WHERE a.fecha = $1
       ORDER BY a.entrada ASC`,
      [fecha]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/asistencia/reporte/:mes/:anio
// Reporte mensual de asistencias
async function reporteMensual(req, res, next) {
  try {
    const mes  = parseInt(req.params.mes);
    const anio = parseInt(req.params.anio);

    if (isNaN(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mes inválido (debe ser 1-12)' });
    }
    if (isNaN(anio) || anio < 2020 || anio > 2100) {
      return res.status(400).json({ error: 'Año inválido' });
    }

    // Total de asistencias del mes
    const { rows: totales } = await pool.query(
      `SELECT
        COUNT(*)                                   AS total_asistencias,
        COUNT(DISTINCT miembro_id)                 AS miembros_unicos,
        ROUND(AVG(duracion_minutos))               AS duracion_promedio,
        COUNT(*)::FLOAT / COUNT(DISTINCT fecha)    AS promedio_diario
       FROM asistencias
       WHERE EXTRACT(MONTH FROM fecha) = $1
         AND EXTRACT(YEAR  FROM fecha) = $2`,
      [mes, anio]
    );

    // Asistencias por día
    const { rows: porDia } = await pool.query(
      `SELECT
        fecha,
        COUNT(*) AS total,
        COUNT(CASE WHEN salida IS NOT NULL THEN 1 END) AS completadas
       FROM asistencias
       WHERE EXTRACT(MONTH FROM fecha) = $1
         AND EXTRACT(YEAR  FROM fecha) = $2
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [mes, anio]
    );

    // Asistencias por día de semana
    const { rows: porDiaSemana } = await pool.query(
      `SELECT
        TO_CHAR(fecha, 'Day') AS dia_semana,
        EXTRACT(DOW FROM fecha) AS numero_dia,
        COUNT(*) AS total
       FROM asistencias
       WHERE EXTRACT(MONTH FROM fecha) = $1
         AND EXTRACT(YEAR  FROM fecha) = $2
       GROUP BY dia_semana, numero_dia
       ORDER BY numero_dia`,
      [mes, anio]
    );

    // Top 5 miembros más asistentes
    const { rows: topMiembros } = await pool.query(
      `SELECT
        m.nombres, m.apellidos, m.dni,
        COUNT(a.id) AS total_asistencias
       FROM asistencias a
       JOIN miembros m ON a.miembro_id = m.id
       WHERE EXTRACT(MONTH FROM a.fecha) = $1
         AND EXTRACT(YEAR  FROM a.fecha) = $2
       GROUP BY m.id, m.nombres, m.apellidos, m.dni
       ORDER BY total_asistencias DESC
       LIMIT 5`,
      [mes, anio]
    );

    res.json({
      ...totales[0],
      por_dia:        porDia,
      por_dia_semana: porDiaSemana,
      top_miembros:   topMiembros
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/asistencia/manual
// Registro manual de entrada/salida desde el panel admin (requiere auth)
async function registrarManual(req, res, next) {
  const { miembro_id } = req.body;

  if (!miembro_id) {
    return res.status(400).json({ error: 'miembro_id es requerido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que el miembro exista
    const { rows: miembroRows } = await client.query(
      `SELECT id, nombres, apellidos, dni, estado
       FROM miembros WHERE id = $1`,
      [miembro_id]
    );

    if (miembroRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    const miembro = miembroRows[0];

    // Verificar membresía activa
    const { rows: membresiaRows } = await client.query(
      `SELECT mem.*, p.nombre AS plan_nombre
       FROM membresias mem
       JOIN planes p ON mem.plan_id = p.id
       WHERE mem.miembro_id = $1
         AND mem.estado = 'activa'
         AND mem.fecha_fin >= CURRENT_DATE
       ORDER BY mem.fecha_fin DESC
       LIMIT 1`,
      [miembro.id]
    );

    if (membresiaRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El miembro no tiene membresía activa' });
    }

    // Buscar registro de asistencia de hoy
    const { rows: asistenciaRows } = await client.query(
      `SELECT * FROM asistencias
       WHERE miembro_id = $1 AND fecha = CURRENT_DATE`,
      [miembro.id]
    );

    let asistencia;
    let estadoRespuesta;

    if (asistenciaRows.length === 0) {
      // Registrar entrada
      const { rows } = await client.query(
        `INSERT INTO asistencias (miembro_id, fecha, entrada, membresia_valida)
         VALUES ($1, CURRENT_DATE, NOW() AT TIME ZONE 'America/Lima', true)
         RETURNING *`,
        [miembro.id]
      );
      asistencia = rows[0];
      estadoRespuesta = 'entrada';
    } else {
      const registro = asistenciaRows[0];

      if (registro.salida === null) {
        // Registrar salida
        const { rows } = await client.query(
          `UPDATE asistencias
           SET salida = NOW() AT TIME ZONE 'America/Lima',
               duracion_minutos = ROUND(
                 EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'America/Lima' - entrada)) / 60
               )
           WHERE id = $1 RETURNING *`,
          [registro.id]
        );
        asistencia = rows[0];
        estadoRespuesta = 'salida';
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El miembro ya completó su visita del día' });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      estado: estadoRespuesta,
      miembro: formatearMiembro(miembro),
      asistencia
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// Función auxiliar: formatear datos del miembro para el kiosco
function formatearMiembro(miembro) {
  return {
    id:       miembro.id,
    nombres:  miembro.nombres,
    apellidos: miembro.apellidos,
    dni:      miembro.dni,
    nombre_completo: `${miembro.nombres} ${miembro.apellidos}`
  };
}

module.exports = { registrarToque, registrarManual, asistenciasHoy, asistenciasDia, reporteMensual };
