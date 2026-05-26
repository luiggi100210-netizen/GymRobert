/**
 * Robert Gym — Kiosco Biométrico
 *
 * Máquina de estados:
 *  idle  → scan  → entrada / salida / denegado / ignorado → idle
 *
 * La pantalla es fullscreen, sin scroll, sin cursor.
 * La barra lateral izquierda cambia de color según el estado.
 */
import { useState, useCallback, useRef } from 'react'
import { registrarToque } from './api/asistencia'
import { useSensor }       from './hooks/useSensor'
import { RESET_MS, SCAN_DELAY_MS } from './constants/resetTimes'
import PantallaIdle        from './components/PantallaIdle'
import PantallaScanning    from './components/PantallaScanning'
import PantallaEntrada     from './components/PantallaEntrada'
import PantallaSalida      from './components/PantallaSalida'
import PantallaDenegado    from './components/PantallaDenegado'

export default function App() {
  const [estado, setEstado]       = useState('idle')   // 'idle' | 'scan' | 'entrada' | 'salida' | 'denegado' | 'ignorado'
  const [respuesta, setRespuesta] = useState(null)
  const [error, setError]         = useState(null)
  const resetTimerRef             = useRef(null)

  const irAIdle = () => {
    setEstado('idle')
    setRespuesta(null)
    setError(null)
  }

  // Programar el reset automático a IDLE
  const programarReset = useCallback((estadoFinal) => {
    clearTimeout(resetTimerRef.current)
    const ms = RESET_MS[estadoFinal] ?? 4000
    resetTimerRef.current = setTimeout(irAIdle, ms)
  }, [])

  // Callback invocado por useSensor cuando llega un huella_id
  const handleToque = useCallback(async (huellaId) => {
    // Ignorar toques mientras ya se está procesando
    if (estado !== 'idle') return

    setEstado('scan')
    setError(null)

    // Breve delay para que se vea la animación de escaneo
    await new Promise((r) => setTimeout(r, SCAN_DELAY_MS))

    try {
      const datos = await registrarToque(huellaId)
      setRespuesta(datos)

      const estadoFinal = datos.estado // 'entrada' | 'salida' | 'denegado' | 'ignorado'
      setEstado(estadoFinal)
      programarReset(estadoFinal)

    } catch (err) {
      // Error de red o servidor caído
      setError('Error de conexión con el servidor')
      setEstado('denegado')
      setRespuesta({
        estado: 'denegado',
        motivo: 'error_servidor',
        miembro: null,
      })
      programarReset('denegado')
    }
  }, [estado, programarReset])

  // Conectar sensor biométrico (demo con teclado por defecto)
  useSensor({ onToque: handleToque })

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] items-center justify-center overflow-hidden">

      {/* Card del kiosko */}
      <div className="relative w-[500px] rounded-[18px] overflow-hidden border border-[#1f1f1f] text-center shadow-[0_0_60px_rgba(0,0,0,0.8)]">

        {/* Fondo con imagen de gym oscurecida */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/gym-bg.jpg')", filter: 'brightness(0.22) saturate(0.5)' }}
        />

        {/* Contenido */}
        <div className="relative z-10 px-9 pt-8 pb-[22px]">
          {estado === 'idle'     && <PantallaIdle onClickSensor={() => handleToque('FP-DEMO-001')} />}
          {estado === 'scan'     && <PantallaScanning />}
          {estado === 'entrada'  && respuesta && <PantallaEntrada  respuesta={respuesta} />}
          {estado === 'salida'   && respuesta && <PantallaSalida   respuesta={respuesta} />}
          {estado === 'denegado' && respuesta && <PantallaDenegado respuesta={respuesta} />}
          {estado === 'ignorado' && <PantallaIdle onClickSensor={() => handleToque('FP-DEMO-001')} />}
        </div>
      </div>

      {/* Panel de ayuda demo */}
      <DemoHelp />

      {/* Error de red */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 text-xs px-4 py-2 rounded-full backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  )
}

// Panel de ayuda solo visible en modo desarrollo
function DemoHelp() {
  if (import.meta.env.PROD) return null

  return (
    <div className="absolute bottom-4 right-4 bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] text-gray-600 space-y-1 backdrop-blur-sm pointer-events-none">
      <p className="text-gray-500 font-semibold mb-1">MODO DEMO</p>
      <p><kbd className="bg-white/10 px-1 rounded">ENTER</kbd> → Toque de miembro activo</p>
      <p><kbd className="bg-white/10 px-1 rounded">D</kbd> → Membresía vencida</p>
      <p><kbd className="bg-white/10 px-1 rounded">X</kbd> → Huella no registrada</p>
    </div>
  )
}
