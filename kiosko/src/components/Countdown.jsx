/**
 * Anillo SVG de cuenta regresiva para auto-reset.
 * segundos: tiempo total del countdown.
 */
import { useEffect, useState } from 'react'

const RADIO       = 34
const CIRCUNF     = 2 * Math.PI * RADIO   // ≈ 213.6

export default function Countdown({ segundos, color = '#10b981' }) {
  const [restante, setRestante] = useState(segundos)

  useEffect(() => {
    setRestante(segundos)
    const id = setInterval(() => {
      setRestante((prev) => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [segundos])

  const progreso  = restante / segundos
  const dashOffset = CIRCUNF * (1 - progreso)

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Pista */}
        <circle
          cx="40" cy="40" r={RADIO}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
          fill="none"
        />
        {/* Arco progreso */}
        <circle
          cx="40" cy="40" r={RADIO}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUNF}
          strokeDashoffset={dashOffset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      {/* Número */}
      <span className="absolute text-xl font-bold" style={{ color }}>
        {restante}
      </span>
    </div>
  )
}
