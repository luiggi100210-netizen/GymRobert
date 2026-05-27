import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// Cliente sin auth — endpoint público
const apiPublica = axios.create({ baseURL: '/api', timeout: 10000 })

const TECLAS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'C', '0', '⌫',
]

export default function KioscoDni() {
  const [dni, setDni]           = useState('')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null) // { estado, mensaje, miembro, membresia }
  const [countdown, setCountdown] = useState(0)

  // Teclado físico
  useEffect(() => {
    const handleKey = (e) => {
      if (resultado) return
      if (e.key >= '0' && e.key <= '9') presionar(e.key)
      if (e.key === 'Backspace') presionar('⌫')
      if (e.key === 'Escape') presionar('C')
      if (e.key === 'Enter' && dni.length === 8) enviar(dni)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dni, resultado])

  // Auto-reset tras mostrar resultado
  useEffect(() => {
    if (!resultado) return
    setCountdown(5)
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(tick); resetear(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [resultado])

  const presionar = useCallback((tecla) => {
    if (tecla === 'C') { setDni(''); return }
    if (tecla === '⌫') { setDni((d) => d.slice(0, -1)); return }
    if (dni.length < 8) setDni((d) => d + tecla)
  }, [dni])

  const enviar = useCallback(async (dniActual) => {
    setCargando(true)
    try {
      const { data } = await apiPublica.post('/asistencia/kiosco-dni', { dni: dniActual })
      setResultado(data)
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.error || 'Error de conexión'
      setResultado({
        estado: 'denegado',
        motivo: 'error',
        mensaje: msg,
        miembro: null,
      })
    } finally {
      setCargando(false)
    }
  }, [])

  // Auto-enviar al completar 8 dígitos
  useEffect(() => {
    if (dni.length === 8 && !cargando && !resultado) {
      enviar(dni)
    }
  }, [dni])

  const resetear = () => {
    setDni('')
    setResultado(null)
    setCountdown(0)
  }

  const colorEstado = {
    entrada:  { bg: 'bg-emerald-500', texto: 'text-white', icono: '✓', label: 'ENTRADA' },
    salida:   { bg: 'bg-blue-500',    texto: 'text-white', icono: '→', label: 'SALIDA'  },
    denegado: { bg: 'bg-red-600',     texto: 'text-white', icono: '✕', label: 'DENEGADO' },
    ignorado: { bg: 'bg-amber-500',   texto: 'text-white', icono: '!', label: 'YA REGISTRADO' },
  }[resultado?.estado] || { bg: 'bg-gray-700', texto: 'text-white', icono: '?', label: '' }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between py-8 px-4 select-none">

      {/* Cabecera */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">Robert Gym</h1>
        <p className="text-gray-500 text-sm mt-1">Ingresa tu DNI para registrar tu asistencia</p>
      </div>

      {/* Panel central */}
      <div className="w-full max-w-sm space-y-6">

        {/* Pantalla de resultado */}
        {resultado ? (
          <div className={`${colorEstado.bg} rounded-3xl p-8 text-center space-y-3 shadow-2xl`}>
            <p className="text-7xl font-black">{colorEstado.icono}</p>
            <p className={`text-2xl font-black uppercase tracking-wide ${colorEstado.texto}`}>
              {colorEstado.label}
            </p>
            {resultado.miembro && (
              <p className={`text-lg font-semibold ${colorEstado.texto} opacity-90`}>
                {resultado.miembro.nombre_completo}
              </p>
            )}
            {resultado.membresia && (
              <p className={`text-sm ${colorEstado.texto} opacity-75`}>
                {resultado.membresia.plan_nombre} — {resultado.membresia.dias_restantes}d restantes
              </p>
            )}
            <p className={`text-base ${colorEstado.texto} opacity-80 font-medium`}>
              {resultado.mensaje}
            </p>
            <p className={`text-xs ${colorEstado.texto} opacity-50 mt-2`}>
              Cerrando en {countdown}s...
            </p>
          </div>
        ) : (
          <>
            {/* Display DNI */}
            <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl px-6 py-5 text-center">
              {cargando ? (
                <p className="text-3xl text-gray-400 animate-pulse font-mono tracking-widest">
                  Verificando...
                </p>
              ) : (
                <>
                  <p className="text-5xl font-black font-mono tracking-[0.3em] text-white min-h-[3rem]">
                    {dni.padEnd(8, '·')}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 uppercase tracking-wider">
                    {dni.length}/8 dígitos
                  </p>
                </>
              )}
            </div>

            {/* Teclado numérico */}
            <div className="grid grid-cols-3 gap-3">
              {TECLAS.map((tecla) => (
                <button
                  key={tecla}
                  onClick={() => presionar(tecla)}
                  disabled={cargando}
                  className={`
                    h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95
                    disabled:opacity-40
                    ${tecla === 'C'
                      ? 'bg-red-900/60 border border-red-800 text-red-400 hover:bg-red-900'
                      : tecla === '⌫'
                      ? 'bg-amber-900/40 border border-amber-800/50 text-amber-400 hover:bg-amber-900/60'
                      : 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
                    }
                  `}
                >
                  {tecla}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pie */}
      <p className="text-gray-700 text-xs text-center">
        Si tienes problemas, acércate a recepción
      </p>
    </div>
  )
}
