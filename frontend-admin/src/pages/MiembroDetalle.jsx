import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

const METODOS = ['efectivo', 'yape', 'plin', 'transferencia']
const ICONOS_PAGO = {
  efectivo:      '💵',
  yape:          '📱',
  plin:          '📲',
  transferencia: '🏦',
}

function estadoMiembro(diasRestantes, estadoMem) {
  if (!estadoMem || estadoMem === 'vencida') return 'vencido'
  if (diasRestantes <= 7) return 'por vencer'
  return 'activo'
}

// Modal de renovación de membresía
function ModalRenovar({ miembro, onCerrar, onRenovado }) {
  const [planes, setPlanes]   = useState([])
  const [planSel, setPlanSel] = useState(null)
  const [form, setForm]       = useState({
    plan_id:      '',
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago:  'efectivo',
    comprobante:  '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    api.get('/planes').then(({ data }) => {
      const activos = data.filter((p) => p.activo)
      setPlanes(activos)
      if (activos.length > 0) {
        setForm((f) => ({ ...f, plan_id: activos[0].id }))
        setPlanSel(activos[0])
      }
    })
  }, [])

  const handlePlanChange = (id) => {
    const p = planes.find((x) => String(x.id) === String(id))
    setForm((f) => ({ ...f, plan_id: id }))
    setPlanSel(p || null)
  }

  const fechaFin = planSel && form.fecha_inicio
    ? format(addDays(new Date(form.fecha_inicio + 'T12:00:00'), planSel.duracion_dias), 'dd/MM/yyyy')
    : '—'

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      await api.post('/membresias', {
        miembro_id:   miembro.id,
        plan_id:      form.plan_id,
        fecha_inicio: form.fecha_inicio,
        metodo_pago:  form.metodo_pago,
        comprobante:  form.comprobante || null,
      })
      onRenovado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al renovar membresía')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Renovar membresía</h2>
            <p className="text-xs text-gray-500 mt-0.5">{miembro.nombres} {miembro.apellidos}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-600 hover:text-gray-300">✕</button>
        </div>

        <div>
          <label className="label">Plan *</label>
          <select
            className="input"
            value={form.plan_id}
            onChange={(e) => handlePlanChange(e.target.value)}
          >
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.duracion_dias}d — {sol(p.precio)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Fecha de inicio *</label>
          <input
            type="date"
            className="input"
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
          />
          {planSel && (
            <p className="text-xs text-gray-500 mt-1">
              Vence el: <span className="text-amber-400 font-medium">{fechaFin}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label">Método de pago</label>
          <div className="grid grid-cols-2 gap-2">
            {METODOS.map((m) => (
              <button
                key={m}
                onClick={() => setForm({ ...form, metodo_pago: m })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.metodo_pago === m
                    ? 'bg-gym-red border-gym-red text-white'
                    : 'border-gym-border text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <span>{ICONOS_PAGO[m]}</span>
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">N° Comprobante / Referencia</label>
          <input
            type="text"
            className="input"
            placeholder="Opcional"
            value={form.comprobante}
            onChange={(e) => setForm({ ...form, comprobante: e.target.value })}
          />
        </div>

        {planSel && (
          <div className="bg-gym-red/10 border border-gym-red/30 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-300">Total a cobrar</span>
            <span className="text-xl font-black text-gym-red-light">{sol(planSel.precio)}</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onCerrar} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !form.plan_id}
            className="btn-primary flex-1"
          >
            {guardando ? 'Renovando...' : 'Confirmar renovación'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MiembroDetalle() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [miembro, setMiembro]     = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState('')
  const [modalRenovar, setModalRenovar]       = useState(false)
  const [renovado, setRenovado]               = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const cargar = () => {
    setCargando(true)
    api.get(`/miembros/${id}`)
      .then(({ data }) => setMiembro(data))
      .catch(() => setError('Miembro no encontrado'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [id])

  const handleCambiarEstado = async () => {
    const nuevoEstado = miembro.estado === 'suspendido' ? 'activo' : 'suspendido'
    const confirmar   = window.confirm(
      nuevoEstado === 'suspendido'
        ? `¿Suspender a ${miembro.nombres}? No podrá ingresar al gimnasio.`
        : `¿Reactivar a ${miembro.nombres}?`
    )
    if (!confirmar) return
    setCambiandoEstado(true)
    try {
      await api.put(`/miembros/${miembro.id}`, { estado: nuevoEstado })
      cargar()
    } finally {
      setCambiandoEstado(false)
    }
  }

  const handleRenovado = () => {
    setModalRenovar(false)
    setRenovado(true)
    cargar()
    setTimeout(() => setRenovado(false), 4000)
  }

  if (cargando) return <Spinner />
  if (error)    return (
    <div className="text-center py-20">
      <p className="text-red-400">{error}</p>
      <button onClick={() => navigate('/miembros')} className="btn-ghost mt-4 text-sm">
        ← Volver a miembros
      </button>
    </div>
  )

  const estado = estadoMiembro(miembro.dias_restantes, miembro.membresia_estado)
  const edad   = miembro.fecha_nacimiento
    ? Math.floor((new Date() - new Date(miembro.fecha_nacimiento)) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/miembros" className="hover:text-gray-300 transition-colors">Miembros</Link>
        <span>/</span>
        <span className="text-gray-300">{miembro.nombres} {miembro.apellidos}</span>
      </div>

      {/* Banner suspendido */}
      {miembro.estado === 'suspendido' && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-300 flex items-center gap-2">
          <span>⛔</span> Este miembro está suspendido — no puede ingresar al gimnasio
        </div>
      )}

      {/* Aviso de renovación exitosa */}
      {renovado && (
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
          <span>✓</span> Membresía renovada correctamente
        </div>
      )}

      {/* Cabecera del miembro */}
      <div className="card flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gym-red/20 border border-gym-red/40 flex items-center justify-center text-2xl font-black text-gym-red-light shrink-0">
          {miembro.nombres?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {miembro.nombres} {miembro.apellidos}
            </h1>
            <Badge estado={estado} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
            <span>DNI: <span className="text-gray-400">{miembro.dni}</span></span>
            {miembro.telefono && (
              <span>Tel: <span className="text-gray-400 font-mono">{miembro.telefono}</span></span>
            )}
            {edad && <span>Edad: <span className="text-gray-400">{edad} años</span></span>}
            <span>
              Registrado: <span className="text-gray-400">
                {new Date(miembro.fecha_registro).toLocaleDateString('es-PE')}
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleCambiarEstado}
            disabled={cambiandoEstado}
            className={`text-sm px-3 py-2 rounded-lg border font-medium transition-colors ${
              miembro.estado === 'suspendido'
                ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/30'
                : 'border-red-800 text-red-400 hover:bg-red-900/20'
            }`}
          >
            {cambiandoEstado ? '...' : miembro.estado === 'suspendido' ? 'Reactivar' : 'Suspender'}
          </button>
          <button
            onClick={() => navigate(`/miembros/nuevo?editar=${miembro.id}`)}
            className="btn-ghost text-sm"
          >
            Editar datos
          </button>
          <button
            onClick={() => setModalRenovar(true)}
            className="btn-primary text-sm"
          >
            + Renovar
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{miembro.asistencias_mes ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Asistencias este mes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{miembro.historial_pagos?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pagos totales</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${
            miembro.dias_restantes <= 0 ? 'text-red-400' :
            miembro.dias_restantes <= 7 ? 'text-amber-400' :
            'text-emerald-400'
          }`}>
            {miembro.dias_restantes ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Días restantes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">
            {sol(miembro.historial_pagos?.reduce((s, p) => s + parseFloat(p.monto), 0))}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total pagado</p>
        </div>
      </div>

      {/* Info de membresía activa */}
      {miembro.membresia_estado === 'activa' && (
        <div className="card border border-gym-border">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Membresía actual</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Plan</p>
              <p className="text-white font-semibold">{miembro.plan_nombre || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Inicio</p>
              <p className="text-gray-300">
                {miembro.fecha_inicio
                  ? new Date(miembro.fecha_inicio).toLocaleDateString('es-PE')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Vencimiento</p>
              <p className={`font-semibold ${
                miembro.dias_restantes <= 7 ? 'text-amber-400' : 'text-gray-300'
              }`}>
                {miembro.fecha_fin
                  ? new Date(miembro.fecha_fin).toLocaleDateString('es-PE')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Precio</p>
              <p className="text-emerald-400 font-semibold">{sol(miembro.plan_precio)}</p>
            </div>
          </div>

          {/* Barra de progreso de membresía */}
          {miembro.fecha_inicio && miembro.fecha_fin && (() => {
            const inicio  = new Date(miembro.fecha_inicio)
            const fin     = new Date(miembro.fecha_fin)
            const total   = fin - inicio
            const usado   = new Date() - inicio
            const pct     = Math.min(100, Math.max(0, (usado / total) * 100))
            return (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                  <span>Inicio</span>
                  <span>{pct.toFixed(0)}% transcurrido</span>
                  <span>Vence</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div
                    className={`rounded-full h-2 transition-all ${
                      miembro.dias_restantes <= 7 ? 'bg-amber-500' : 'bg-gym-red'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Historial de pagos */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gym-border">
          <h2 className="text-sm font-semibold text-gray-300">Historial de pagos</h2>
        </div>
        {!miembro.historial_pagos || miembro.historial_pagos.length === 0 ? (
          <p className="text-center text-gray-600 py-10 text-sm">Sin pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border bg-black/20">
                  <th className="text-left px-5 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Período</th>
                  <th className="text-left px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Método</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha pago</th>
                  <th className="text-left px-4 py-3 font-medium">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {miembro.historial_pagos.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-3 text-gray-300 text-xs">{p.plan_nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.fecha_inicio).toLocaleDateString('es-PE')}
                      {' → '}
                      {new Date(p.fecha_fin).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-400">{sol(p.monto)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-300 flex items-center gap-1">
                        <span>{ICONOS_PAGO[p.metodo_pago] || '💳'}</span>
                        <span className="capitalize">{p.metodo_pago}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.fecha_pago).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {p.comprobante || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal renovar */}
      {modalRenovar && (
        <ModalRenovar
          miembro={miembro}
          onCerrar={() => setModalRenovar(false)}
          onRenovado={handleRenovado}
        />
      )}
    </div>
  )
}
