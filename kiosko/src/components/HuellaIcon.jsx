/**
 * Ícono SVG de huella dactilar con animaciones de estado.
 * estado: 'idle' | 'scan' | 'ok' | 'error'
 */
export default function HuellaIcon({ estado = 'idle', onClick }) {
  const colorBase = {
    idle:  '#dc2626',
    scan:  '#f59e0b',
    ok:    '#10b981',
    error: '#ef4444',
  }[estado]

  const esClickable = estado === 'idle' && !!onClick

  return (
    <div
      className={`relative flex items-center justify-center ${esClickable ? 'cursor-pointer select-none' : ''}`}
      onClick={esClickable ? onClick : undefined}
      title={esClickable ? 'Toque para simular acceso' : undefined}
    >
      {/* Halo rojo pulsante en idle */}
      {estado === 'idle' && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping scale-125 pointer-events-none" />
          <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl animate-pulse pointer-events-none" />
        </>
      )}

      {/* SVG de huella dactilar */}
      <svg
        viewBox="0 0 120 120"
        className={`w-44 h-44 transition-all duration-500 ${estado === 'idle' ? 'animate-pulse_fp' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke={colorBase} strokeLinecap="round" strokeWidth="4" opacity="0.95">
          <path d="M60 48 Q60 44 60 42" />
          <path d="M48 62 Q48 50 60 50 Q72 50 72 62 Q72 72 60 74" />
          <path d="M38 68 Q36 48 60 42 Q84 42 84 68 Q84 84 66 88" />
          <path d="M30 68 Q28 40 60 34 Q92 34 92 68 Q92 90 72 96 Q52 100 44 96" />
          <path d="M22 68 Q20 32 60 26 Q100 26 100 68 Q100 94 82 103 Q64 110 48 107 Q36 104 30 98" />
          <path d="M16 66 Q12 24 60 18 Q108 18 108 66 Q108 98 88 110 Q70 120 52 117 Q30 112 22 100" />
        </g>

        {estado === 'ok' && (
          <path
            d="M40 62 L55 77 L80 48"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {estado === 'error' && (
          <>
            <line x1="44" y1="44" x2="76" y2="76" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
            <line x1="76" y1="44" x2="44" y2="76" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* Línea de escaneo */}
      {estado === 'scan' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-4 right-4 h-0.5 bg-amber-400/80 blur-[1px] animate-scan" style={{ top: '0%' }} />
        </div>
      )}

      {/* Halo en estados no-idle */}
      {estado !== 'idle' && (
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none ${
          estado === 'scan'  ? 'bg-amber-400' :
          estado === 'ok'    ? 'bg-emerald-400' :
          estado === 'error' ? 'bg-red-500' : ''
        }`} />
      )}

      {/* Etiqueta en demo */}
      {esClickable && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-red-600/50 animate-pulse">
            toque aquí
          </p>
        </div>
      )}
    </div>
  )
}
