process.env.JWT_SECRET = 'test_secret'
process.env.NODE_ENV   = 'test'

jest.mock('../config/database', () => ({
  connect: jest.fn(),
  query:   jest.fn(),
}))

const request = require('supertest')
const jwt     = require('jsonwebtoken')
const app     = require('../app')
const pool    = require('../config/database')

const authHeader = `Bearer ${jwt.sign({ id: 'ad1', username: 'admin' }, 'test_secret')}`

afterEach(() => jest.clearAllMocks())

describe('POST /api/miembros/:id/medidas', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).post('/api/miembros/m1/medidas').send({ peso_kg: 80 })
    expect(res.status).toBe(401)
  })

  it('rechaza cuando no viene ni peso ni estatura → 400', async () => {
    const res = await request(app)
      .post('/api/miembros/m1/medidas')
      .set('Authorization', authHeader)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/peso o estatura/)
  })

  it('rechaza peso fuera de rango → 400', async () => {
    const res = await request(app)
      .post('/api/miembros/m1/medidas')
      .set('Authorization', authHeader)
      .send({ peso_kg: 900 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/peso_kg inválida/)
  })

  it('rechaza estatura no numérica → 400', async () => {
    const res = await request(app)
      .post('/api/miembros/m1/medidas')
      .set('Authorization', authHeader)
      .send({ estatura_cm: 'alto' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/estatura_cm inválida/)
  })

  it('retorna 404 si el miembro no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }) // SELECT miembro
    const res = await request(app)
      .post('/api/miembros/inexistente/medidas')
      .set('Authorization', authHeader)
      .send({ peso_kg: 80 })
    expect(res.status).toBe(404)
  })

  it('registra medida con solo peso → 201', async () => {
    const medida = { id: 'md1', miembro_id: 'm1', fecha: '2026-07-13', peso_kg: '80.50', estatura_cm: null }
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'm1' }] }) // miembro existe
      .mockResolvedValueOnce({ rows: [medida] })       // INSERT
    const res = await request(app)
      .post('/api/miembros/m1/medidas')
      .set('Authorization', authHeader)
      .send({ peso_kg: 80.5 })
    expect(res.status).toBe(201)
    expect(res.body.peso_kg).toBe('80.50')
    const [, insertParams] = pool.query.mock.calls[1]
    expect(insertParams).toEqual(['m1', 80.5, null])
  })
})

describe('GET /api/miembros/:id/medidas', () => {
  it('retorna el historial ordenado para graficar', async () => {
    pool.query.mockResolvedValueOnce({ rows: [
      { id: 'md1', fecha: '2026-06-01', peso_kg: '84.00', estatura_cm: '175.0' },
      { id: 'md2', fecha: '2026-07-01', peso_kg: '81.50', estatura_cm: null },
    ] })
    const res = await request(app)
      .get('/api/miembros/m1/medidas')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const [sql] = pool.query.mock.calls[0]
    expect(sql).toMatch(/ORDER BY fecha ASC/)
  })
})

describe('GET /api/miembros/frecuentes', () => {
  it('retorna miembros constantes del mes con mínimo por defecto de 6', async () => {
    pool.query.mockResolvedValueOnce({ rows: [
      { id: 'm1', nombres: 'CARLOS', apellidos: 'RAMOS', dni: '11111111', telefono: '999888777', asistencias_mes: 12, plan_nombre: 'Mensual' },
    ] })
    const res = await request(app)
      .get('/api/miembros/frecuentes')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(res.body[0].asistencias_mes).toBe(12)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toMatch(/HAVING COUNT\(a\.id\) >= \$1/)
    expect(params).toEqual([6])
  })

  it('acepta un mínimo personalizado por query', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .get('/api/miembros/frecuentes?minimo=10')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(pool.query.mock.calls[0][1]).toEqual([10])
  })
})

describe('POST /api/miembros con medidas opcionales', () => {
  it('rechaza peso inválido al crear miembro → 400 sin abrir transacción', async () => {
    const res = await request(app)
      .post('/api/miembros')
      .set('Authorization', authHeader)
      .send({
        dni: '12345678', nombres: 'ANA', apellidos: 'QUISPE',
        plan_id: 'p1', fecha_inicio: '2026-07-13', peso_kg: 5,
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/peso_kg inválida/)
    expect(pool.connect).not.toHaveBeenCalled()
  })
})
