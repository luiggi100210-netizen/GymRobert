/**
 * Pantalla SCANNING: leyendo la huella (1-2 segundos).
 */
import HuellaIcon from './HuellaIcon'

export default function PantallaScanning() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <HuellaIcon estado="scan" />
      <div className="text-center space-y-2">
        <p className="text-2xl font-bold text-amber-300 tracking-tight">
          Leyendo huella...
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
