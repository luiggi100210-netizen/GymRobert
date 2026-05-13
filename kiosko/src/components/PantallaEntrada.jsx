/**
 * Pantalla ENTRADA: primer toque del día — barra lateral verde.
 * Auto-reset a IDLE en 4 segundos.
 */
import HuellaIcon from './HuellaIcon'
import MiembroCard from './MiembroCard'
import Countdown from './Countdown'
import { RESET_S } from '../constants/resetTimes'

export default function PantallaEntrada({ respuesta }) {
  const nombre = respuesta.miembro?.nombre_completo
    || `${respuesta.miembro?.nombres || ''} ${respuesta.miembro?.apellidos || ''}`

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-10">
      {/* Ícono OK */}
      <HuellaIcon estado="ok" />

      {/* Mensaje principal */}
      <div className="text-center">
        <p className="text-4xl font-black text-emerald-400 leading-tight">
          ¡Bienvenido,
        </p>
        <p className="text-4xl font-black text-white leading-tight mt-1">
          {nombre.split(' ')[0]}!
        </p>
        <p className="text-base text-emerald-300/70 mt-3">
          Entrada registrada · Buen entrenamiento 💪
        </p>
      </div>

      {/* Card con datos del miembro */}
      <MiembroCard
        estado="entrada"
        miembro={respuesta.miembro}
        membresia={respuesta.membresia}
        asistencia={respuesta.asistencia}
      />

      {/* Countdown de auto-reset */}
      <Countdown segundos={RESET_S.entrada} color="#10b981" />
    </div>
  )
}
