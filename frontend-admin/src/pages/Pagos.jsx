import { useEffect, useState } from 'react'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ICONOS_PAGO = {
  efectivo:      '💵',
  yape:          '📱',
  plin:          '📲',
  transferencia: '🏦',
}

export default function Pagos() {
  const hoy = new Date()
  const [mes, setMes]     = useState(hoy.getMonth() + 1)
  const [anio, setAnio]   = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    api.get('/pagos', { params: { mes, anio } })
      .then(({ data }) => setPagos(data))
      .finally(() => setCargando(false))
  }, [mes, anio])

  // Calcular totales
  const totalMes  = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0)
  const porMetodo = pagos.reduce((acc, p) => {
    acc[p.metodo_pago] = (acc[p.metodo_pago] || 0) + parseFloat(p.monto)
    return acc
  }, {})

  const exportarCSV = () => {
    const cabecera = ['Miembro', 'DNI', 'Plan', 'Monto', 'Método', 'Fecha', 'Comprobante']
    const filas = pagos.map((p) => [
      `${p.nombres} ${p.apellidos}`,
      p.dni,
      p.plan_nombre,
      parseFloat(p.monto).toFixed(2),
      p.metodo_pago,
      new Date(p.fecha_pago).toLocaleDateString('es-PE'),
      p.comprobante || '',
    ])
    const csv = [cabecera, ...filas]
      .map((fila) => fila.map((v) => `"${v}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `pagos_${MESES[mes - 1]}_${anio}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historial de cobros y métodos de pago</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportarCSV}
            disabled={pagos.length === 0}
            className="btn-ghost text-sm flex items-center gap-1.5"
            title="Exportar a CSV"
          >
            ↓ CSV
          </button>
          <select
            className="input w-auto text-sm"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="input w-auto text-sm"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total cobrado</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{sol(totalMes)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{pagos.length} pagos</p>
        </div>
        {Object.entries(porMetodo).map(([metodo, monto]) => (
          <div key={metodo} className="card">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <span>{ICONOS_PAGO[metodo] || '💳'}</span> {metodo}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sol(monto)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {pagos.filter((p) => p.metodo_pago === metodo).length} pagos
            </p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {cargando ? <Spinner /> : pagos.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Sin pagos en este período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Miembro</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Método</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{p.nombres} {p.apellidos}</p>
                      <p className="text-xs text-gray-400">DNI: {p.dni}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.plan_nombre}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-600">{sol(p.monto)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700 flex items-center gap-1">
                        <span>{ICONOS_PAGO[p.metodo_pago] || '💳'}</span>
                        <span className="capitalize">{p.metodo_pago}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(p.fecha_pago).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {p.comprobante || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
