// Bloque de carga con pulso — se compone para imitar el layout real
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

// Filas de skeleton para listas/tablas
export function SkeletonFilas({ filas = 4 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
