const { esFechaValida } = require('../utils/validaciones')

describe('esFechaValida', () => {
  it('acepta fechas válidas en formato YYYY-MM-DD', () => {
    expect(esFechaValida('2026-01-15')).toBe(true)
    expect(esFechaValida('2024-02-29')).toBe(true) // año bisiesto
    expect(esFechaValida('2025-12-31')).toBe(true)
  })

  it('rechaza fechas con formato incorrecto', () => {
    expect(esFechaValida('15-01-2026')).toBe(false) // DD-MM-YYYY
    expect(esFechaValida('2026/01/15')).toBe(false) // slashes
    expect(esFechaValida('20260115')).toBe(false)   // sin separadores
    expect(esFechaValida('2026-1-5')).toBe(false)   // sin padding
  })

  it('rechaza fechas imposibles', () => {
    expect(esFechaValida('2026-13-01')).toBe(false) // mes 13
    expect(esFechaValida('2026-00-01')).toBe(false) // mes 0
    expect(esFechaValida('2026-02-30')).toBe(false) // 30 de febrero
    expect(esFechaValida('2023-02-29')).toBe(false) // año no bisiesto
  })

  it('rechaza valores no string', () => {
    expect(esFechaValida(null)).toBe(false)
    expect(esFechaValida(undefined)).toBe(false)
    expect(esFechaValida('')).toBe(false)
    expect(esFechaValida(20260115)).toBe(false)
  })
})
