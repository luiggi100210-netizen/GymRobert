/**
 * Pantalla SALIDA: segundo toque del día — barra lateral azul.
 * Auto-reset a IDLE en 4 segundos.
 */
import HuellaIcon from './HuellaIcon'
import MiembroCard from './MiembroCard'
import Countdown from './Countdown'
import { RESET_S } from '../constants/resetTimes'

export default function PantallaSalida({ respuesta }) {
  const nombre = respuesta.miembro?.nombre_completo
    || `${respuesta.miembro?.nombres || ''} ${respuesta.miembro?.apellidos || ''}`

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-10">
      {/* Ícono OK en azul */}
      <div className="relative">
        <HuellaIcon estado="ok" />
        {/* Sobreescribir color a azul mediante overlay */}
        <div className="absolute inset-0 rounded-full pointer-events-none" />
      </div>

      {/* Mensaje principal */}
      <div className="text-center">
        <p className="text-4xl font-black text-blue-400 leading-tight">
          ¡Hasta pronto,
        </p>
        <p className="text-4xl font-black text-white leading-tight mt-1">
          {nombre.split(' ')[0]}!
        </p>
        <p className="text-base text-blue-300/70 mt-3">
          Salida registrada · Esperamos tu pronto regreso 🙌
        </p>
      </div>

      {/* Card con datos de la visita */}
      <MiembroCard
        estado="salida"
        miembro={respuesta.miembro}
        membresia={respuesta.membresia}
        asistencia={respuesta.asistencia}
      />

      {/* Countdown de auto-reset */}
      <Countdown segundos={RESET_S.salida} color="#3b82f6" />
    </div>
  )
}
