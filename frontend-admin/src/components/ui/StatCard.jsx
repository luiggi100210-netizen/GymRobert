const accents = {
  red:    { bar: 'bg-red-500',     val: 'text-gray-900',    chip: 'bg-red-50 text-red-500' },
  green:  { bar: 'bg-emerald-500', val: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' },
  blue:   { bar: 'bg-blue-500',    val: 'text-blue-600',    chip: 'bg-blue-50 text-blue-600' },
  yellow: { bar: 'bg-amber-400',   val: 'text-amber-600',   chip: 'bg-amber-50 text-amber-600' },
  purple: { bar: 'bg-violet-500',  val: 'text-violet-600',  chip: 'bg-violet-50 text-violet-600' },
}

export default function StatCard({ titulo, valor, sub, icono, color = 'red' }) {
  const { bar, val, chip } = accents[color] || accents.red

  return (
    <div className="bg-white border border-gym-border rounded-xl p-5 relative overflow-hidden group shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      {/* Barra de acento lateral — gana presencia al hacer hover */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${bar} opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">{titulo}</p>
          <p className={`stat-num text-[2.6rem] mt-1.5 ${val}`}>{valor}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5 font-medium">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${chip}`}>
          {icono}
        </div>
      </div>
    </div>
  )
}
