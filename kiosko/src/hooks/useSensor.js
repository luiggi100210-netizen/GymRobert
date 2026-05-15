import { useEffect, useRef } from 'react'

const MODO               = import.meta.env.VITE_SENSOR_MODE || 'demo'
const WS_URL             = import.meta.env.VITE_SENSOR_WS_URL || 'ws://localhost:8765'
const HUELLA_ACTIVA      = 'FP-DEMO-001'
const HUELLA_VENCIDA     = 'FP-VENCIDO-999'
const HUELLA_DESCONOCIDA = 'FP-DESCONOCIDO-000'

export function useSensor({ onToque }) {
  // Ref para siempre tener la última versión de onToque sin re-registrar el listener
  const onToqueRef = useRef(onToque)
  useEffect(() => { onToqueRef.current = onToque }, [onToque])

  useEffect(() => {
    if (MODO === 'websocket') {
      const ws = new WebSocket(WS_URL)
      ws.onmessage = (e) => {
        try {
          const { huella_id } = JSON.parse(e.data)
          if (huella_id) onToqueRef.current(huella_id)
        } catch { /* ignorar mensajes malformados */ }
      }
      ws.onerror = () => console.warn('[Sensor] WebSocket: error de conexión')
      return () => ws.close()
    }

    if (MODO === 'demo') {
      const handleKey = (e) => {
        if (e.key === 'Enter')            onToqueRef.current(HUELLA_ACTIVA)
        if (e.key.toLowerCase() === 'd') onToqueRef.current(HUELLA_VENCIDA)
        if (e.key.toLowerCase() === 'x') onToqueRef.current(HUELLA_DESCONOCIDA)
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, []) // se registra una sola vez al montar
}
