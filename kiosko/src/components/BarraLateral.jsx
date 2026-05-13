/**
 * Barra lateral izquierda de color que indica el estado del kiosco.
 * Cambia de color con transición suave y glow animado.
 */
export default function BarraLateral({ estado }) {
  const clases = {
    idle:     'bg-gray-700/40',
    scan:     'bg-amber-500',
    entrada:  'bg-emerald-500 animate-glow_green',
    salida:   'bg-blue-500   animate-glow_blue',
    denegado: 'bg-red-600    animate-glow_red',
    ignorado: 'bg-gray-700/40',
  }[estado] || 'bg-gray-700/40'

  return (
    <div className={`w-2 shrink-0 h-full rounded-r-full transition-all duration-700 ${clases}`} />
  )
}
