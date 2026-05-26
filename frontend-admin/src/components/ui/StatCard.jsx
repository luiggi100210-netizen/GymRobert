const accents = {
  red:    { bar: 'bg-red-500',     val: 'text-gray-900' },
  green:  { bar: 'bg-emerald-500', val: 'text-emerald-600' },
  blue:   { bar: 'bg-blue-500',    val: 'text-blue-600' },
  yellow: { bar: 'bg-amber-400',   val: 'text-amber-600' },
  purple: { bar: 'bg-violet-500',  val: 'text-violet-600' },
}

export default function StatCard({ titulo, valor, sub, icono, color = 'red' }) {
  const { bar, val } = accents[color] || accents.red

  return (
    <div className="bg-white border border-gym-border rounded-xl p-5 shadow-card relative overflow-hidden group hover:shadow-card-hover transition-shadow duration-200">
      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bar}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{titulo}</p>
          <p className={`text-3xl font-extrabold mt-2 leading-none tracking-tight ${val}`}>{valor}</p>
          {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
        </div>
        <div className="text-2xl opacity-60 shrink-0 mt-0.5">{icono}</div>
      </div>
    </div>
  )
}
