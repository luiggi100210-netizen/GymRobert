import { Link } from 'react-router-dom'

// Estado vacío consistente para tablas, listas y gráficos.
// accion: { texto, to } para navegar o { texto, onClick } para ejecutar.
export default function EmptyState({ icono = '📭', titulo, detalle, accion, compacto = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${compacto ? 'py-6' : 'py-12'}`}>
      <div className={`rounded-full bg-slate-100 flex items-center justify-center mb-3 ${compacto ? 'w-10 h-10 text-lg' : 'w-14 h-14 text-2xl'}`}>
        {icono}
      </div>
      <p className="text-sm font-medium text-gray-600">{titulo}</p>
      {detalle && <p className="text-xs text-gray-400 mt-1 max-w-xs">{detalle}</p>}
      {accion && (
        accion.to ? (
          <Link to={accion.to} className="btn-primary mt-4 text-xs">{accion.texto}</Link>
        ) : (
          <button onClick={accion.onClick} className="btn-primary mt-4 text-xs">{accion.texto}</button>
        )
      )}
    </div>
  )
}
