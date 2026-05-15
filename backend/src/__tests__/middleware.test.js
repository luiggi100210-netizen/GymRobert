const jwt = require('jsonwebtoken')

const SECRET = 'test_secret_middleware'
process.env.JWT_SECRET = SECRET

const { verificarToken } = require('../middleware/auth')
const { errorHandler }   = require('../middleware/errorHandler')

// ─── verificarToken ───────────────────────────────────────────────────────────

describe('verificarToken', () => {
  let req, res, next

  beforeEach(() => {
    req  = { headers: {} }
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    next = jest.fn()
  })

  it('rechaza petición sin header Authorization → 401', () => {
    verificarToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza token malformado → 403', () => {
    req.headers['authorization'] = 'Bearer token_invalido'
    verificarToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza token firmado con secreto diferente → 403', () => {
    const token = jwt.sign({ id: 1 }, 'otro_secreto')
    req.headers['authorization'] = `Bearer ${token}`
    verificarToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza token expirado → 403', () => {
    const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: -1 })
    req.headers['authorization'] = `Bearer ${token}`
    verificarToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('acepta token válido, adjunta payload en req.admin y llama next()', () => {
    const token = jwt.sign({ id: 1, username: 'admin' }, SECRET)
    req.headers['authorization'] = `Bearer ${token}`
    verificarToken(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.admin).toMatchObject({ id: 1, username: 'admin' })
  })
})

// ─── errorHandler ─────────────────────────────────────────────────────────────

describe('errorHandler', () => {
  let req, res, next

  beforeEach(() => {
    req  = {}
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    next = jest.fn()
    process.env.NODE_ENV = 'test'
  })

  it('retorna 409 para violación de unicidad (código 23505)', () => {
    errorHandler({ code: '23505' }, req, res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('único') })
  })

  it('retorna 400 para violación de clave foránea (código 23503)', () => {
    errorHandler({ code: '23503' }, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('inválida') })
  })

  it('oculta detalles internos en errores 500', () => {
    errorHandler({ message: 'contraseña hasheada interna', stack: 'stack privado' }, req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    const body = res.json.mock.calls[0][0]
    expect(body.error).toBe('Error interno del servidor')
    expect(body.error).not.toContain('contraseña')
  })

  it('expone el mensaje en errores 4xx con status explícito', () => {
    errorHandler({ status: 404, message: 'Miembro no encontrado' }, req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Miembro no encontrado' })
  })
})
