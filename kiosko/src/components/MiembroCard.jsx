/**
 * Card que muestra los datos del miembro tras el toque.
 * Usada en estados: entrada, salida, denegado.
 */
function InfoRow({ label, valor, grande = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-widest text-white/40">{label}</span>
      <span className={`font-bold text-white ${grande ? 'text-2xl' : 'text-lg'}`}>{valor}</span>
    </div>
  )
}

function hora(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function duracion(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export default function MiembroCard({ estado, miembro, membresia, asistencia }) {
  const nombre = miembro?.nombre_completo || `${miembro?.nombres || ''} ${miembro?.apellidos || ''}`

  // Colores según estado
  const borderColor = {
    entrada:  'border-emerald-500/40',
    salida:   'border-blue-500/40',
    denegado: 'border-red-500/40',
  }[estado] || 'border-white/10'

  return (
    <div className={`animate-slide_up w-full max-w-md border ${borderColor} bg-white/5 backdrop-blur-sm rounded-2xl p-6 flex flex-col gap-5`}>

      {/* Avatar inicial + nombre */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 ${
          estado === 'entrada'  ? 'bg-emerald-500/20 text-emerald-300' :
          estado === 'salida'   ? 'bg-blue-500/20 text-blue-300' :
          'bg-red-500/20 text-red-300'
        }`}>
          {nombre.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-extrabold text-white leading-tight truncate">{nombre}</p>
          {membresia?.plan_nombre && (
            <p className="text-sm text-white/50 mt-0.5">Plan {membresia.plan_nombre}</p>
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="w-full h-px bg-white/10" />

      {/* Datos según estado */}
      {estado === 'entrada' && (
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Hora de entrada" valor={hora(asistencia?.entrada)} grande />
          <InfoRow
            label="Días restantes"
            valor={membresia?.dias_restantes != null ? `${membresia.dias_restantes} días` : '—'}
            grande
          />
        </div>
      )}

      {estado === 'salida' && (
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Hora de salida"  valor={hora(asistencia?.salida)} grande />
          <InfoRow label="Tiempo en gym"   valor={duracion(asistencia?.duracion_minutos)} grande />
          <InfoRow label="Entrada"         valor={hora(asistencia?.entrada)} />
        </div>
      )}

      {estado === 'denegado' && (
        <div className="space-y-2">
          <InfoRow label="Último plan" valor={membresia?.plan_nombre || '—'} />
          <p className="text-sm text-red-300/80 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            Acércate a recepción para renovar tu membresía.
          </p>
        </div>
      )}
    </div>
  )
}
