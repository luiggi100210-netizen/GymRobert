/**
 * Pantalla ENTRADA: primer toque del día — ACCESO CONCEDIDO.
 * Nombre del socio, plan, barra de progreso de membresía.
 * Auto-reset en 3 segundos.
 */
import HuellaIcon from './HuellaIcon'
import Countdown from './Countdown'
import { RESET_S } from '../constants/resetTimes'

function hora(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function BarraMembresia({ diasRestantes, duracionTotal }) {
  const total = duracionTotal || 30
  const pct   = Math.min(100, Math.max(0, ((total - diasRestantes) / total) * 100))
  const color = diasRestantes <= 7 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-white/40">
        <span>Membresía</span>
        <span className={diasRestantes <= 7 ? 'text-amber-400' : 'text-emerald-400'}>
          {diasRestantes} días restantes
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function PantallaEntrada({ respuesta }) {
  const nombre       = respuesta.miembro?.nombre_completo
    || `${respuesta.miembro?.nombres || ''} ${respuesta.miembro?.apellidos || ''}`
  const primerNombre = nombre.trim().split(' ')[0]
  const mem          = respuesta.membresia

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-10">
      <HuellaIcon estado="ok" />

      {/* Cabecera */}
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[6px] text-emerald-500/70 mb-1">
          Acceso concedido
        </p>
        <p className="text-5xl font-black text-white leading-tight">
          ¡Bienvenido, {primerNombre}!
        </p>
        <p className="text-base text-emerald-400/70 mt-2">
          Entrada registrada · {hora(respuesta.asistencia?.entrada)} · Buen entrenamiento 💪
        </p>
      </div>

      {/* Card del socio */}
      <div className="animate-slide_up w-full max-w-sm border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl font-black text-emerald-300 shrink-0">
            {primerNombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-white truncate">{nombre}</p>
            {mem?.plan_nombre && (
              <p className="text-xs text-white/40 mt-0.5">Plan {mem.plan_nombre}</p>
            )}
          </div>
        </div>

        {mem?.dias_restantes != null && (
          <BarraMembresia
            diasRestantes={mem.dias_restantes}
            duracionTotal={mem.duracion_dias || 30}
          />
        )}
      </div>

      <Countdown segundos={RESET_S.entrada} color="#10b981" />
    </div>
  )
}
