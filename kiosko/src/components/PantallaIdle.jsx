/**
 * Pantalla IDLE — diseño kiosko card.
 * Logo · Reloj Bebas Neue · Sensor anillo pulsante · Footer con estado
 */
import { useReloj } from '../hooks/useReloj'
import HuellaIcon from './HuellaIcon'

function LogoRobertGym() {
  return (
    <div className="flex items-center justify-center gap-3 mx-auto mb-7">
      <svg viewBox="0 0 64 32" className="w-10 h-5 text-red-600" fill="currentColor">
        <rect x="16" y="13" width="32" height="6" rx="3" />
        <rect x="2"  y="8"  width="7"  height="16" rx="3.5" />
        <rect x="9"  y="11" width="7"  height="10" rx="3" />
        <rect x="48" y="11" width="7"  height="10" rx="3" />
        <rect x="55" y="8"  width="7"  height="16" rx="3.5" />
      </svg>
      <div className="text-left">
        <p className="text-xl font-black text-white leading-none tracking-wider">ROBERT GYM</p>
        <p className="text-[9px] text-red-600/80 uppercase tracking-[5px] mt-0.5">Club Fitness</p>
      </div>
    </div>
  )
}

export default function PantallaIdle({ onClickSensor }) {
  const { hora, fecha } = useReloj()

  return (
    <>
      <LogoRobertGym />

      {/* Reloj */}
      <div className="font-bebas text-[88px] leading-none text-white tracking-[5px] drop-shadow-[0_2px_30px_rgba(0,0,0,0.9)] mb-1.5">
        {hora}
      </div>

      {/* Fecha */}
      <div className="text-[11px] tracking-[3px] text-[#bbb] uppercase mb-8 capitalize">
        {fecha}
      </div>

      {/* Sensor */}
      <div className="flex flex-col items-center mb-6">
        <HuellaIcon estado="idle" onClick={onClickSensor} />
        <p className="text-[20px] font-bold text-white mt-[18px] drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
          Coloque su dedo en el sensor
        </p>
        <p className="text-[12px] text-[#888] italic mt-1.5">
          Esperando escaneo biométrico...
        </p>
      </div>

      <hr className="border-t border-white/[0.07] mb-3.5" />

      {/* Footer */}
      <div className="flex justify-between items-center text-[9px] text-[#444] tracking-[1px] uppercase">
        <div className="flex items-center gap-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#22cc66] animate-pulse shrink-0" />
          <span>Sistema: Activo · ID: RG-P7</span>
        </div>
        <div className="flex gap-1">
          {['F1 Demo', 'Esc Ayuda', 'Tab Config'].map((k) => (
            <span key={k} className="bg-white/[0.04] border border-white/[0.09] rounded px-[7px] py-[2px]">{k}</span>
          ))}
        </div>
        <span className="text-[#c01818]">v4.2.0</span>
      </div>
    </>
  )
}
