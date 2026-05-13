import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

function estadoMiembro(diasRestantes, estadoMem) {
  if (!estadoMem || estadoMem === 'vencida') return 'vencido'
  if (diasRestantes <= 7) return 'por vencer'
  return 'activo'
}

export default function Miembros() {
  const [miembros, setMiembros]     = useState([])
  const [planes, setPlanes]         = useState([])
  const [cargando, setCargando]     = useState(true)
  const [buscar, setBuscar]         = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPlan, setFiltroPlan] = useState('')
  const navigate = useNavigate()

  const cargar = useCallback(() => {
    setCargando(true)
    const params = {}
    if (buscar)      params.buscar    = buscar
    if (filtroEstado) params.estado   = filtroEstado
    if (filtroPlan)  params.plan_id   = filtroPlan

    api.get('/miembros', { params })
      .then(({ data }) => setMiembros(data))
      .finally(() => setCargando(false))
  }, [buscar, filtroEstado, filtroPlan])

  useEffect(() => {
    api.get('/planes').then(({ data }) => setPlanes(data))
  }, [])

  useEffect(() => {
    const timer = setTimeout(cargar, 350)
    return () => clearTimeout(timer)
  }, [cargar])

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Miembros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{miembros.length} miembros encontrados</p>
        </div>
        <Link to="/miembros/nuevo" className="btn-primary text-sm">
          + Nuevo miembro
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          className="input max-w-xs"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <select
          className="input w-auto"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="vencido">Vencidos</option>
        </select>
        <select
          className="input w-auto"
          value={filtroPlan}
          onChange={(e) => setFiltroPlan(e.target.value)}
        >
          <option value="">Todos los planes</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <Spinner />
        ) : miembros.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-3xl mb-2">👤</p>
            <p>No se encontraron miembros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border bg-black/20">
                  <th className="text-left px-5 py-3 font-medium">Miembro</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Vencimiento</th>
                  <th className="text-left px-4 py-3 font-medium">Días</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {miembros.map((m) => {
                  const estado = estadoMiembro(m.dias_restantes, m.membresia_estado)
                  return (
                    <tr key={m.id} className="table-row">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-200">{m.nombres} {m.apellidos}</p>
                        <p className="text-xs text-gray-600">DNI: {m.dni}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{m.plan_nombre || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {m.fecha_fin
                          ? new Date(m.fecha_fin).toLocaleDateString('es-PE')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${
                          m.dias_restantes <= 0 ? 'text-red-400' :
                          m.dias_restantes <= 7 ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {m.dias_restantes != null ? `${m.dias_restantes}d` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/miembros/nuevo?editar=${m.id}`)}
                          className="text-xs text-gray-500 hover:text-gym-red-light transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
