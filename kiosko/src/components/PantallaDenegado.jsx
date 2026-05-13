/**
 * Pantalla DENEGADO: membresía vencida o huella no registrada.
 * Barra lateral roja. Auto-reset en 5 segundos.
 */
import HuellaIcon from './HuellaIcon'
import MiembroCard from './MiembroCard'
import Countdown from './Countdown'
import { RESET_S } from '../constants/resetTimes'

export default function PantallaDenegado({ respuesta }) {
  const esHuellaNoRegistrada = respuesta.motivo === 'huella_no_registrada'
  const nombre = respuesta.miembro
    ? (respuesta.miembro.nombre_completo || `${respuesta.miembro.nombres} ${respuesta.miembro.apellidos}`)
    : null

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-10">
      {/* Ícono error */}
      <HuellaIcon estado="error" />

      {/* Mensaje principal */}
      <div className="text-center">
        {esHuellaNoRegistrada ? (
          <>
            <p className="text-4xl font-black text-red-400">Huella no encontrada</p>
            <p className="text-base text-red-300/70 mt-3">
              Acércate a recepción para registrarte.
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl font-black text-red-400 leading-tight">
              Membresía vencida
            </p>
            {nombre && (
              <p className="text-2xl font-bold text-white/60 mt-1">{nombre.split(' ')[0]}</p>
            )}
            <p className="text-base text-red-300/70 mt-3">
              Acércate a recepción para renovar
            </p>
          </>
        )}
      </div>

      {/* Card con datos (si tiene miembro) */}
      {respuesta.miembro && (
        <MiembroCard
          estado="denegado"
          miembro={respuesta.miembro}
          membresia={respuesta.membresia}
          asistencia={null}
        />
      )}

      {/* Countdown de auto-reset */}
      <Countdown segundos={RESET_S.denegado} color="#ef4444" />
    </div>
  )
}
