/**
 * Pantalla IDLE: esperando toque de huella.
 * Logo real incrustado · Reloj en tiempo real · Sensor rojo pulsante clickeable
 * Barra de estado inferior completa
 */
import { useReloj } from '../hooks/useReloj'
import HuellaIcon from './HuellaIcon'

function LogoRobertGym({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg viewBox="0 0 64 32" className="w-14 h-7 text-red-600" fill="currentColor">
        <rect x="16" y="13" width="32" height="6" rx="3" />
        <rect x="2"  y="8"  width="7"  height="16" rx="3.5" />
        <rect x="9"  y="11" width="7"  height="10" rx="3" />
        <rect x="48" y="11" width="7"  height="10" rx="3" />
        <rect x="55" y="8"  width="7"  height="16" rx="3.5" />
      </svg>
      <div>
        <p className="text-xl font-black text-white leading-none tracking-wider">ROBERT GYM</p>
        <p className="text-[9px] text-red-600/80 uppercase tracking-[5px] mt-0.5">Club Fitness</p>
      </div>
    </div>
  )
}

function BarraEstado() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/60 border-t border-white/5 backdrop-blur-sm flex items-center px-6 gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">En línea</span>
      </div>

      <div className="flex-1" />

      <span className="text-[10px] text-gray-700 uppercase tracking-[4px] font-medium">
        Robert Gym — Arequipa, Perú
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-700 uppercase tracking-widest">
          {import.meta.env.PROD ? 'Producción' : 'Demo'}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full ${import.meta.env.PROD ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`} />
      </div>
    </div>
  )
}

export default function PantallaIdle({ onClickSensor }) {
  const { hora, fecha } = useReloj()

  return (
    <div className="relative flex flex-col items-center justify-between h-full py-14 px-10 pb-16">
      {/* Fondo atmosférico */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Logo */}
      <LogoRobertGym />

      {/* Centro: sensor + instrucción */}
      <div className="flex flex-col items-center gap-12 relative z-10">
        <HuellaIcon estado="idle" onClick={onClickSensor} />
        <div className="text-center space-y-3 mt-4">
          <p className="text-3xl font-black text-white/90 tracking-tight leading-tight">
            Coloque su dedo en el sensor
          </p>
          <p className="text-sm text-gray-600 tracking-wide">
            El sistema registrará su entrada o salida automáticamente
          </p>
        </div>
      </div>

      {/* Reloj */}
      <div className="text-center relative z-10">
        <p className="text-7xl font-black text-white tracking-tight tabular-nums leading-none">
          {hora}
        </p>
        <p className="text-sm text-gray-500 mt-3 capitalize font-medium">{fecha}</p>
      </div>

      {/* Barra de estado inferior */}
      <BarraEstado />
    </div>
  )
}
