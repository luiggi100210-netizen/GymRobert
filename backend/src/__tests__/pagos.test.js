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

const token     = jwt.sign({ id: 1, username: 'admin' }, 'test_secret')
const authHeader = `Bearer ${token}`

afterEach(() => jest.clearAllMocks())

describe('POST /api/pagos', () => {
  it('rechaza petición sin token JWT → 401', async () => {
    const res = await request(app).post('/api/pagos').send({})
    expect(res.status).toBe(401)
  })

  it('rechaza cuando faltan campos requeridos → 400', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', authHeader)
      .send({ monto: 100 }) // falta membresia_id
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/requeridos/)
  })

  it('rechaza monto negativo → 400', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', authHeader)
      .send({ membresia_id: 'abc', monto: -50 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/mayor a 0/)
  })

  it('rechaza monto cero → 400', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', authHeader)
      .send({ membresia_id: 'abc', monto: 0 })
    expect(res.status).toBe(400)
  })

  it('rechaza monto no numérico → 400', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', authHeader)
      .send({ membresia_id: 'abc', monto: 'gratis' })
    expect(res.status).toBe(400)
  })

  it('crea el pago con monto válido → 201', async () => {
    const pago = { id: 'p1', membresia_id: 'abc', monto: '80.00', metodo_pago: 'efectivo', fecha_pago: '2026-05-15' }
    pool.query.mockResolvedValueOnce({ rows: [pago] })

    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', authHeader)
      .send({ membresia_id: 'abc', monto: 80 })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('p1')
  })
})

describe('GET /api/pagos', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/pagos')
    expect(res.status).toBe(401)
  })

  it('retorna lista de pagos con token válido', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'p1', monto: '80.00' }] })
    const res = await request(app)
      .get('/api/pagos')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
