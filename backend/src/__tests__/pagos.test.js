process.env.JWT_SECRET = 'test_secret'
process.env.NODE_ENV   = 'test'

jest.mock('../config/database', () => ({
  connect: jest.fn(),
  query:   jest.fn(),
}))

const request = require('supertest')
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcryptjs')
const app     = require('../app')
const pool    = require('../config/database')

const token     = jwt.sign({ id: 1, username: 'admin' }, 'test_secret')
const authHeader = `Bearer ${token}`

const PASSWORD_ADMIN = 'clave-segura'
const HASH_ADMIN     = bcrypt.hashSync(PASSWORD_ADMIN, 4)

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

  it('filtra por mes y año cuando ambos vienen en el query', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .get('/api/pagos?mes=5&anio=2026')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toMatch(/EXTRACT\(MONTH/)
    expect(params).toEqual([5, 2026])
  })

  it('filtra solo por año cuando no viene mes', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .get('/api/pagos?anio=2026')
      .set('Authorization', authHeader)
    expect(res.status).toBe(200)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toMatch(/EXTRACT\(YEAR/)
    expect(params).toEqual([2026])
  })
})

describe('DELETE /api/pagos/:id', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).delete('/api/pagos/p1').send({ password: 'x' })
    expect(res.status).toBe(401)
  })

  it('rechaza sin contraseña → 400 y no consulta la DB', async () => {
    const res = await request(app)
      .delete('/api/pagos/p1')
      .set('Authorization', authHeader)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/contraseña/)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('rechaza cuando el admin autenticado no existe → 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }) // SELECT password FROM admin
    const res = await request(app)
      .delete('/api/pagos/p1')
      .set('Authorization', authHeader)
      .send({ password: PASSWORD_ADMIN })
    expect(res.status).toBe(401)
  })

  it('rechaza contraseña incorrecta → 401 y no ejecuta el DELETE', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ password: HASH_ADMIN }] })
    const res = await request(app)
      .delete('/api/pagos/p1')
      .set('Authorization', authHeader)
      .send({ password: 'otra-clave' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/incorrecta/)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  it('retorna 404 cuando el pago no existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ password: HASH_ADMIN }] })
      .mockResolvedValueOnce({ rows: [] }) // DELETE sin filas
    const res = await request(app)
      .delete('/api/pagos/inexistente')
      .set('Authorization', authHeader)
      .send({ password: PASSWORD_ADMIN })
    expect(res.status).toBe(404)
  })

  it('elimina el pago con contraseña correcta → 200', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ password: HASH_ADMIN }] })
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] })
    const res = await request(app)
      .delete('/api/pagos/p1')
      .set('Authorization', authHeader)
      .send({ password: PASSWORD_ADMIN })
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/eliminado/)
    const [deleteSql, deleteParams] = pool.query.mock.calls[1]
    expect(deleteSql).toMatch(/DELETE FROM pagos/)
    expect(deleteParams).toEqual(['p1'])
  })
})
