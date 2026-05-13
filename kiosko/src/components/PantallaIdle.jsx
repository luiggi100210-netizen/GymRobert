/**
 * Pantalla IDLE: esperando toque de huella.
 * Muestra reloj en tiempo real + ícono animado.
 */
import { useReloj } from '../hooks/useReloj'
import HuellaIcon from './HuellaIcon'

export default function PantallaIdle() {
  const { hora, fecha } = useReloj()

  return (
    <div className="flex flex-col items-center justify-between h-full py-16 px-10">
      {/* Logo + nombre gym */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-red-900/50">
          R
        </div>
        <div>
          <p className="text-base font-bold text-white tracking-wide">ROBERT GYM</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-[4px]">Club Fitness</p>
        </div>
      </div>

      {/* Centro: ícono + instrucción */}
      <div className="flex flex-col items-center gap-8">
        <HuellaIcon estado="idle" />
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-white/80 tracking-tight">
            Coloque su dedo en el sensor
          </p>
          <p className="text-sm text-gray-600">
            El sistema registrará su entrada o salida automáticamente
          </p>
        </div>
      </div>

      {/* Reloj */}
      <div className="text-center">
        <p className="text-6xl font-black text-white tracking-tight tabular-nums">
          {hora}
        </p>
        <p className="text-sm text-gray-500 mt-2 capitalize">{fecha}</p>
      </div>
    </div>
  )
}
