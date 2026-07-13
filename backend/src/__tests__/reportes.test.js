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

describe('GET /api/reportes/dashboard', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/reportes/dashboard')
    expect(res.status).toBe(401)
  })

  it('retorna las 8 métricas del panel con tipos numéricos', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })   // miembros activos
      .mockResolvedValueOnce({ rows: [{ total: '960.50' }] }) // ingresos del mes
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })    // vencen pronto
      .mockResolvedValueOnce({ rows: [{ total: '7' }] })    // asistencias hoy
      .mockResolvedValueOnce({ rows: [{ fecha: '2026-07-13', etiqueta: '13/07', total: '7' }] }) // últimos 7 días
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })    // nuevos del mes
      .mockResolvedValueOnce({ rows: [{ total: '400' }] })  // proyección
      .mockResolvedValueOnce({ rows: [{ id: 'm1', nombres: 'LUIGGI' }] }) // últimos miembros

    const res = await request(app)
      .get('/api/reportes/dashboard')
      .set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body.miembros_activos).toBe(12)
    expect(res.body.ingresos_mes).toBe(960.5)
    expect(res.body.vencen_pronto).toBe(3)
    expect(res.body.asistencias_hoy).toBe(7)
    expect(res.body.nuevos_mes).toBe(4)
    expect(res.body.proyeccion_mes).toBe(400)
    expect(res.body.asistencias_7_dias).toHaveLength(1)
    expect(res.body.ultimos_miembros).toHaveLength(1)
    expect(pool.query).toHaveBeenCalledTimes(8)
  })
})

describe('GET /api/reportes/ingresos/:mes/:anio', () => {
  it('rechaza mes inválido → 400', async () => {
    const res = await request(app)
      .get('/api/reportes/ingresos/13/2026')
      .set('Authorization', authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Mes inválido/)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('rechaza año fuera de rango → 400', async () => {
    const res = await request(app)
      .get('/api/reportes/ingresos/5/1999')
      .set('Authorization', authHeader)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Año inválido/)
  })

  it('retorna resumen, por día y por plan del mes', async () => {
    const resumen = { total_pagos: '4', total_ingresos: '320', efectivo: '240', yape: '80', plin: '0', transferencia: '0' }
    pool.query
      .mockResolvedValueOnce({ rows: [resumen] })
      .mockResolvedValueOnce({ rows: [{ fecha: '2026-07-01', pagos: '2', monto: '160' }] })
      .mockResolvedValueOnce({ rows: [{ plan: 'Mensual', cantidad: '4', total: '320' }] })

    const res = await request(app)
      .get('/api/reportes/ingresos/7/2026')
      .set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body.resumen).toEqual(resumen)
    expect(res.body.por_dia).toHaveLength(1)
    expect(res.body.por_plan[0].plan).toBe('Mensual')
    // Las 3 queries usan mes y año parametrizados
    for (const [, params] of pool.query.mock.calls) {
      expect(params).toEqual([7, 2026])
    }
  })
})

describe('GET /api/reportes/proyeccion', () => {
  it('rechaza sin token → 401', async () => {
    const res = await request(app).get('/api/reportes/proyeccion')
    expect(res.status).toBe(401)
  })

  it('retorna comparativa de meses y proyección numérica', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total_vencen: '5', ingresos_potenciales: '400' }] })
      .mockResolvedValueOnce({ rows: [{ total: '320' }] })
      .mockResolvedValueOnce({ rows: [{ total: '280' }] })

    const res = await request(app)
      .get('/api/reportes/proyeccion')
      .set('Authorization', authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      mes_actual:       320,
      mes_anterior:     280,
      vencen_siguiente: 5,
      proyeccion:       400,
    })
  })
})
