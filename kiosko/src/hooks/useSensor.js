/**
 * Hook que simula/conecta el sensor biométrico.
 *
 * MODOS DE CONEXIÓN (configurar según hardware):
 *
 * 1. WebSocket (recomendado para sensores en red local):
 *    El sensor envía: { huella_id: "FP-001" }
 *
 * 2. HTTP Polling (para sensores con API REST propia):
 *    El kiosco consulta al SDK local cada N ms.
 *
 * 3. Modo DEMO (activado por defecto):
 *    Simula toques con el teclado — tecla ENTER dispara un toque de prueba.
 *    Útil para desarrollo sin hardware.
 *
 * Para activar WebSocket real: cambia MODO a 'websocket' y ajusta WS_URL.
 */
import { useEffect, useRef } from 'react'

const MODO    = 'demo'          // 'demo' | 'websocket' | 'polling'
const WS_URL  = 'ws://localhost:8765'  // URL del WebSocket del sensor
const DEMO_HUELLAS = ['FP-DEMO-001', 'FP-DEMO-002', 'FP-VENCIDO-999']

export function useSensor({ onToque, habilitado = true }) {
  const wsRef     = useRef(null)
  const demoIdx   = useRef(0)

  useEffect(() => {
    if (!habilitado) return

    if (MODO === 'websocket') {
      // ── Conexión WebSocket al SDK del sensor ──
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const { huella_id } = JSON.parse(e.data)
          if (huella_id) onToque(huella_id)
        } catch { /* ignorar mensajes malformados */ }
      }

      ws.onerror = () => console.warn('[Sensor] WebSocket: error de conexión')

      return () => ws.close()
    }

    if (MODO === 'demo') {
      // ── Modo demo: ENTER simula una huella, D simula huella denegada ──
      const handleKey = (e) => {
        if (e.key === 'Enter') {
          // Cicla entre las huellas demo registradas (las primeras 2)
          const huella = DEMO_HUELLAS[demoIdx.current % 2]
          demoIdx.current++
          onToque(huella)
        }
        if (e.key.toLowerCase() === 'd') {
          // Simula huella de miembro con membresía vencida
          onToque(DEMO_HUELLAS[2])
        }
        if (e.key.toLowerCase() === 'x') {
          // Simula huella no registrada
          onToque('FP-DESCONOCIDO-000')
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [habilitado, onToque])
}
