import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { linkWhatsapp } from '../utils/whatsapp'

function estadoMiembro(diasRestantes, estadoMem) {
  if (!estadoMem || estadoMem === 'vencida') return 'vencido'
  if (diasRestantes <= 7) return 'por vencer'
  return 'activo'
}


// Celda de teléfono editable inline con botón WhatsApp
function CeldaTelefono({ miembro, onActualizar }) {
  const [editando, setEditando] = useState(false)
  const [tel, setTel]           = useState(miembro.telefono || '')
  const [guardando, setGuardando] = useState(false)

  // Sincronizar tel cuando el prop cambia (tras re-fetch del padre)
  useEffect(() => {
    setTel(miembro.telefono || '')
  }, [miembro.telefono])

  const waLink = linkWhatsapp(tel, miembro.nombres, miembro.dias_restantes, miembro.plan_nombre)

  const guardar = async () => {
    if (tel === (miembro.telefono || '')) { setEditando(false); return }
    setGuardando(true)
    try {
      await api.put(`/miembros/${miembro.id}`, { telefono: tel || null })
      onActualizar()
    } finally {
      setGuardando(false)
      setEditando(false)
    }
  }

  if (editando) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          className="w-28 bg-white border border-gym-red rounded px-2 py-1 text-xs text-gray-900 focus:outline-none"
          value={tel}
          maxLength={9}
          onChange={(e) => setTel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
          autoFocus
        />
        <button onClick={guardar} disabled={guardando} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold px-1">
          {guardando ? '...' : '✓'}
        </button>
        <button onClick={() => setEditando(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditando(true)}
        title="Clic para editar"
        className="text-xs text-gray-600 hover:text-gray-900 transition-colors group flex items-center gap-1"
      >
        {tel
          ? <span className="font-mono">{tel}</span>
          : <span className="text-gray-400 italic">+ agregar</span>
        }
        <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-[10px]">✏️</span>
      </button>
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          title="Enviar WhatsApp"
          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-colors font-bold"
        >
          WA
        </a>
      )}
    </div>
  )
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
      .then(({ data }) => setMiembros(data.data))
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{miembros.length} miembros encontrados</p>
        </div>
        <button
          onClick={() => navigate('/miembros/nuevo')}
          className="btn-primary text-sm"
        >
          + Nuevo miembro
        </button>
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
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p>No se encontraron miembros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Miembro</th>
                  <th className="text-left px-4 py-3 font-medium">Celular</th>
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
                        <Link
                          to={`/miembros/${m.id}`}
                          className="font-semibold text-gray-800 hover:text-gym-red transition-colors"
                        >
                          {m.nombres} {m.apellidos}
                        </Link>
                        <p className="text-xs text-gray-400">DNI: {m.dni}</p>
                      </td>
                      <td className="px-4 py-3">
                        <CeldaTelefono miembro={m} onActualizar={cargar} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{m.plan_nombre || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {m.fecha_fin
                          ? new Date(m.fecha_fin).toLocaleDateString('es-PE')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${
                          m.dias_restantes <= 0 ? 'text-red-500' :
                          m.dias_restantes <= 7 ? 'text-amber-500' :
                          'text-gray-600'
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
                          className="text-xs text-gray-500 hover:text-gym-red transition-colors"
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
