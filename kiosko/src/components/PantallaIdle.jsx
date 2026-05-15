/**
 * Pantalla IDLE — diseño kiosko card.
 * Logo · Reloj Bebas Neue · Sensor anillo pulsante · Footer con estado
 */
import { useReloj } from '../hooks/useReloj'
import HuellaIcon from './HuellaIcon'

function LogoRobertGym() {
  return (
    <div className="mx-auto mb-6">
      <img
        src="/robert-gym-logo.png"
        alt="Robert Gym"
        className="w-[280px] h-auto mx-auto mix-blend-screen drop-shadow-[0_0_36px_rgba(220,38,38,0.55)]"
      />
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
