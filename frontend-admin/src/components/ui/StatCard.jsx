export default function StatCard({ titulo, valor, sub, icono, color = 'red' }) {
  const colors = {
    red:    'bg-red-900/20 border-red-800/40 text-red-400',
    green:  'bg-emerald-900/20 border-emerald-800/40 text-emerald-400',
    blue:   'bg-blue-900/20 border-blue-800/40 text-blue-400',
    yellow: 'bg-amber-900/20 border-amber-800/40 text-amber-400',
    purple: 'bg-purple-900/20 border-purple-800/40 text-purple-400',
  }

  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border text-xl shrink-0 ${colors[color]}`}>
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{titulo}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{valor}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
