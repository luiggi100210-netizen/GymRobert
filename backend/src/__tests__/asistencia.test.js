process.env.JWT_SECRET  = 'test_secret'
process.env.NODE_ENV    = 'test'

jest.mock('../config/database', () => ({
  connect: jest.fn(),
  query:   jest.fn(),
}))

const request = require('supertest')
const jwt     = require('jsonwebtoken')
const app     = require('../app')
const pool    = require('../config/database')

const authHeader = `Bearer ${jwt.sign({ id: 1, username: 'admin' }, 'test_secret')}`

const mkClient = () => ({ query: jest.fn(), release: jest.fn() })

const MIEMBRO   = { id: 'u1', nombres: 'Carlos', apellidos: 'Ramos', dni: '99999999', telefono: null, estado: 'activo' }
const MEMBRESIA = { plan_nombre: 'Mensual', fecha_fin: '2099-12-31', dias_restantes: 200, duracion_dias: 30 }
const ASISTENCIA_ENTRADA = { id: 'a1', miembro_id: 'u1', fecha: '2026-05-15', entrada: '2026-05-15T10:00:00', salida: null, duracion_minutos: null }
const ASISTENCIA_SALIDA  = { ...ASISTENCIA_ENTRADA, salida: '2026-05-15T12:00:00', duracion_minutos: 120 }

afterEach(() => jest.clearAllMocks())

describe('POST /api/asistencia/toque', () => {
  it('retorna 400 sin huella_id y no abre conexión a la DB', async () => {
    const res = await request(app).post('/api/asistencia/toque').send({})
    expect(res.status).toBe(400)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('retorna 404 denegado cuando la huella no está registrada', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})           // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT miembro → vacío
      .mockResolvedValueOnce({})           // ROLLBACK

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-UNKNOWN' })
    expect(res.status).toBe(404)
    expect(res.body.estado).toBe('denegado')
    expect(res.body.motivo).toBe('huella_no_registrada')
  })

  it('retorna denegado cuando el miembro está suspendido', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    const suspendido = { ...MIEMBRO, estado: 'suspendido' }
    client.query
      .mockResolvedValueOnce({})                    // BEGIN
      .mockResolvedValueOnce({ rows: [suspendido] }) // SELECT miembro
      .mockResolvedValueOnce({})                    // ROLLBACK

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-001' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('denegado')
    expect(res.body.motivo).toBe('miembro_suspendido')
  })

  it('retorna denegado cuando la membresía está vencida', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                   // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })  // SELECT miembro
      .mockResolvedValueOnce({ rows: [] })          // SELECT membresia → vencida
      .mockResolvedValueOnce({})                   // ROLLBACK

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-001' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('denegado')
    expect(res.body.motivo).toBe('membresia_vencida')
  })

  it('registra entrada cuando no hay asistencia hoy', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                          // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })         // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })       // SELECT membresia
      .mockResolvedValueOnce({ rows: [] })                 // SELECT asistencias hoy → ninguna
      .mockResolvedValueOnce({ rows: [ASISTENCIA_ENTRADA] }) // INSERT entrada
      .mockResolvedValueOnce({})                          // COMMIT

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-001' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('entrada')
    expect(res.body.miembro.nombres).toBe('Carlos')
    expect(res.body.membresia.plan_nombre).toBe('Mensual')
  })

  it('registra salida cuando ya hay entrada sin salida', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                             // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })            // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })          // SELECT membresia
      .mockResolvedValueOnce({ rows: [ASISTENCIA_ENTRADA] }) // SELECT asistencia → entrada sin salida
      .mockResolvedValueOnce({ rows: [ASISTENCIA_SALIDA] })  // UPDATE salida
      .mockResolvedValueOnce({})                             // COMMIT

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-001' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('salida')
    expect(res.body.asistencia.duracion_minutos).toBe(120)
  })

  it('retorna ignorado cuando la visita del día ya está completa', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    const visitaCompleta = { ...ASISTENCIA_SALIDA } // tiene entrada Y salida
    client.query
      .mockResolvedValueOnce({})                           // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })          // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })        // SELECT membresia
      .mockResolvedValueOnce({ rows: [visitaCompleta] })   // SELECT asistencia → completa
      .mockResolvedValueOnce({})                           // ROLLBACK

    const res = await request(app).post('/api/asistencia/toque').send({ huella_id: 'FP-001' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('ignorado')
  })
})

// ─── GET /api/asistencia/hoy ───────────────────────────────────────────────────

describe('GET /api/asistencia/hoy', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/asistencia/hoy')
    expect(res.status).toBe(401)
  })

  it('retorna lista de asistencias del día con token válido', async () => {
    pool.query.mockResolvedValueOnce({ rows: [ASISTENCIA_ENTRADA] })
    const res = await request(app)
      .get('/api/asistencia/hoy')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

// ─── GET /api/asistencia/dia/:fecha ───────────────────────────────────────────

describe('GET /api/asistencia/dia/:fecha', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/asistencia/dia/2026-05-15')
    expect(res.status).toBe(401)
  })

  it('retorna asistencias de un día específico', async () => {
    pool.query.mockResolvedValueOnce({ rows: [ASISTENCIA_SALIDA] })
    const res = await request(app)
      .get('/api/asistencia/dia/2026-05-15')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

// ─── GET /api/asistencia/reporte/:mes/:anio ───────────────────────────────────

describe('GET /api/asistencia/reporte/:mes/:anio', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/asistencia/reporte/5/2026')
    expect(res.status).toBe(401)
  })

  it('rechaza mes inválido → 400', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte/13/2026')
      .set('Authorization', authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Mes/)
  })

  it('rechaza año inválido → 400', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte/5/2019')
      .set('Authorization', authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Año/)
  })

  it('retorna reporte con datos válidos', async () => {
    const totales = { total_asistencias: '10', miembros_unicos: '5', duracion_promedio: '60', promedio_diario: '2' }
    pool.query
      .mockResolvedValueOnce({ rows: [totales] })  // totales
      .mockResolvedValueOnce({ rows: [] })          // por día
      .mockResolvedValueOnce({ rows: [] })          // por día semana
      .mockResolvedValueOnce({ rows: [] })          // top miembros
    const res = await request(app)
      .get('/api/asistencia/reporte/5/2026')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(res.body.total_asistencias).toBe('10')
  })
})

// ─── POST /api/asistencia/manual ──────────────────────────────────────────────

describe('POST /api/asistencia/manual', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).post('/api/asistencia/manual').send({ miembro_id: 'u1' })
    expect(res.status).toBe(401)
  })

  it('rechaza sin miembro_id → 400', async () => {
    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/miembro_id/)
  })

  it('retorna 404 cuando el miembro no existe', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})           // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT miembro → vacío
      .mockResolvedValueOnce({})           // ROLLBACK

    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({ miembro_id: 'no-existe' })
    expect(res.status).toBe(404)
  })

  it('retorna 400 cuando el miembro no tiene membresía activa', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                    // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })   // SELECT miembro
      .mockResolvedValueOnce({ rows: [] })           // SELECT membresia → ninguna
      .mockResolvedValueOnce({})                    // ROLLBACK

    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({ miembro_id: 'u1' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/membresía/)
  })

  it('registra entrada manual cuando no hay asistencia hoy', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                           // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })          // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })        // SELECT membresia
      .mockResolvedValueOnce({ rows: [] })                  // SELECT asistencia → ninguna
      .mockResolvedValueOnce({ rows: [ASISTENCIA_ENTRADA] }) // INSERT entrada
      .mockResolvedValueOnce({})                           // COMMIT

    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({ miembro_id: 'u1' })
    expect(res.status).toBe(201)
    expect(res.body.estado).toBe('entrada')
  })

  it('registra salida manual cuando ya hay entrada', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                              // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })             // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })           // SELECT membresia
      .mockResolvedValueOnce({ rows: [ASISTENCIA_ENTRADA] })  // SELECT asistencia → entrada sin salida
      .mockResolvedValueOnce({ rows: [ASISTENCIA_SALIDA] })   // UPDATE salida
      .mockResolvedValueOnce({})                              // COMMIT

    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({ miembro_id: 'u1' })
    expect(res.status).toBe(201)
    expect(res.body.estado).toBe('salida')
  })

  it('retorna 400 cuando la visita del día ya está completa', async () => {
    const client = mkClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({})                           // BEGIN
      .mockResolvedValueOnce({ rows: [MIEMBRO] })          // SELECT miembro
      .mockResolvedValueOnce({ rows: [MEMBRESIA] })        // SELECT membresia
      .mockResolvedValueOnce({ rows: [ASISTENCIA_SALIDA] }) // SELECT asistencia → completa
      .mockResolvedValueOnce({})                           // ROLLBACK

    const res = await request(app)
      .post('/api/asistencia/manual')
      .set('Authorization', authHeader)
      .send({ miembro_id: 'u1' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/completó/)
  })
})
