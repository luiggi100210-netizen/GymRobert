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

const PASSWORD = 'clave-segura'
const HASH     = bcrypt.hashSync(PASSWORD, 4)
const ADMIN    = { id: 'ad1', username: 'admin', nombre: 'Administrador', password: HASH }

// Token sin jti: el middleware no consulta admin_sesiones
const authHeader = `Bearer ${jwt.sign({ id: 'ad1', username: 'admin' }, 'test_secret')}`

afterEach(() => jest.clearAllMocks())

describe('POST /api/auth/login', () => {
  it('rechaza cuando faltan credenciales → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' })
    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('rechaza usuario inexistente → 401 sin revelar el motivo', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nadie', password: 'x' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciales incorrectas')
  })

  it('rechaza contraseña incorrecta → 401 con el mismo mensaje genérico', async () => {
    pool.query.mockResolvedValueOnce({ rows: [ADMIN] })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'equivocada' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciales incorrectas')
  })

  it('login correcto → 200 con token JWT válido y sin exponer el hash', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [ADMIN] })  // SELECT admin
      .mockResolvedValueOnce({ rows: [] })       // SELECT sesiones activas
      .mockResolvedValueOnce({ rows: [] })       // INSERT sesión
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.admin).toEqual({ id: 'ad1', username: 'admin', nombre: 'Administrador' })
    expect(res.body.admin.password).toBeUndefined()
    const payload = jwt.verify(res.body.token, 'test_secret')
    expect(payload.username).toBe('admin')
    expect(payload.jti).toBeDefined()
    expect(res.body.sesiones).toBeNull()
  })

  it('con 4 sesiones activas cierra la más antigua y lo informa', async () => {
    const sesiones = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }]
    pool.query
      .mockResolvedValueOnce({ rows: [ADMIN] })   // SELECT admin
      .mockResolvedValueOnce({ rows: sesiones })  // SELECT sesiones
      .mockResolvedValueOnce({ rows: [] })        // DELETE sesión más antigua
      .mockResolvedValueOnce({ rows: [] })        // INSERT sesión nueva
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.sesiones.cerrada).toBe(true)
    const [deleteSql, deleteParams] = pool.query.mock.calls[2]
    expect(deleteSql).toMatch(/DELETE FROM admin_sesiones/)
    expect(deleteParams).toEqual(['s1'])
  })
})

describe('POST /api/auth/logout', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(401)
  })

  it('elimina la sesión (jti) y responde 200', async () => {
    const tokenConJti = jwt.sign({ id: 'ad1', username: 'admin', jti: 'jti-1' }, 'test_secret')
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 's1' }] }) // middleware: SELECT sesión
      .mockResolvedValueOnce({ rows: [] })             // middleware: UPDATE last_used
      .mockResolvedValueOnce({ rows: [] })             // controller: DELETE sesión
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenConJti}`)
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toMatch(/cerrada/)
    const [deleteSql, deleteParams] = pool.query.mock.calls[2]
    expect(deleteSql).toMatch(/DELETE FROM admin_sesiones/)
    expect(deleteParams).toEqual(['jti-1'])
  })

  it('rechaza token cuya sesión ya fue cerrada → 401', async () => {
    const tokenConJti = jwt.sign({ id: 'ad1', username: 'admin', jti: 'jti-x' }, 'test_secret')
    pool.query.mockResolvedValueOnce({ rows: [] }) // middleware: sesión no existe
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenConJti}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Sesión cerrada/)
  })
})

describe('POST /api/auth/cambiar-password', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).post('/api/auth/cambiar-password').send({})
    expect(res.status).toBe(401)
  })

  it('rechaza cuando faltan campos → 400', async () => {
    const res = await request(app)
      .post('/api/auth/cambiar-password')
      .set('Authorization', authHeader)
      .send({ password_actual: PASSWORD })
    expect(res.status).toBe(400)
  })

  it('rechaza contraseña nueva menor a 6 caracteres → 400', async () => {
    const res = await request(app)
      .post('/api/auth/cambiar-password')
      .set('Authorization', authHeader)
      .send({ password_actual: PASSWORD, password_nuevo: '123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/6 caracteres/)
  })

  it('rechaza contraseña actual incorrecta → 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [ADMIN] })
    const res = await request(app)
      .post('/api/auth/cambiar-password')
      .set('Authorization', authHeader)
      .send({ password_actual: 'equivocada', password_nuevo: 'nueva-clave' })
    expect(res.status).toBe(401)
  })

  it('actualiza la contraseña con datos válidos → 200 y guarda un hash', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [ADMIN] }) // SELECT admin
      .mockResolvedValueOnce({ rows: [] })      // UPDATE password
    const res = await request(app)
      .post('/api/auth/cambiar-password')
      .set('Authorization', authHeader)
      .send({ password_actual: PASSWORD, password_nuevo: 'nueva-clave' })
    expect(res.status).toBe(200)
    const [updateSql, updateParams] = pool.query.mock.calls[1]
    expect(updateSql).toMatch(/UPDATE admin SET password/)
    // Nunca se guarda la contraseña en texto plano
    expect(updateParams[0]).not.toBe('nueva-clave')
    expect(updateParams[0]).toMatch(/^\$2[aby]\$/)
  })
})
