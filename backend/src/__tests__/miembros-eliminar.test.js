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

const authHeader = `Bearer ${jwt.sign({ id: 'ad1', username: 'admin' }, 'test_secret')}`
const PASSWORD   = 'clave-segura'
const HASH       = bcrypt.hashSync(PASSWORD, 4)

afterEach(() => jest.clearAllMocks())

describe('DELETE /api/miembros/:id', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).delete('/api/miembros/m1').send({ password: 'x' })
    expect(res.status).toBe(401)
  })

  it('rechaza sin contraseña → 400 y no consulta la DB', async () => {
    const res = await request(app)
      .delete('/api/miembros/m1')
      .set('Authorization', authHeader)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/contraseña/)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('rechaza contraseña incorrecta → 401 y no ejecuta el DELETE', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ password: HASH }] })
    const res = await request(app)
      .delete('/api/miembros/m1')
      .set('Authorization', authHeader)
      .send({ password: 'otra' })
    expect(res.status).toBe(401)
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  it('retorna 404 si el miembro no existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ password: HASH }] })
      .mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .delete('/api/miembros/inexistente')
      .set('Authorization', authHeader)
      .send({ password: PASSWORD })
    expect(res.status).toBe(404)
  })

  it('elimina al miembro con contraseña correcta → 200', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ password: HASH }] })
      .mockResolvedValueOnce({ rows: [{ id: 'm1', nombres: 'LUIGGI', apellidos: 'APARICIO' }] })
    const res = await request(app)
      .delete('/api/miembros/m1')
      .set('Authorization', authHeader)
      .send({ password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/eliminado/)
    const [deleteSql, deleteParams] = pool.query.mock.calls[1]
    expect(deleteSql).toMatch(/DELETE FROM miembros/)
    expect(deleteParams).toEqual(['m1'])
  })
})
