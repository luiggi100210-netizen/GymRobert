import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

const METODOS = ['efectivo', 'yape', 'plin', 'transferencia']
const ICONOS_PAGO = {
  efectivo:      '💵',
  yape:          '📱',
  plin:          '📲',
  transferencia: '🏦',
}

function estadoMiembro(diasRestantes, estadoMem) {
  if (!estadoMem || estadoMem === 'vencida' || diasRestantes == null || diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 7) return 'por vencer'
  return 'activo'
}

// Modal de renovación de membresía
function ModalRenovar({ miembro, onCerrar, onRenovado }) {
  const [planes, setPlanes]   = useState([])
  const [planSel, setPlanSel] = useState(null)

  // Si el miembro tiene días restantes > 0, sugerir inicio el día siguiente al vencimiento
  // para no quitarle los días que ya pagó
  const fechaInicioSugerida = miembro.dias_restantes > 0 && miembro.fecha_fin
    ? format(addDays(new Date(miembro.fecha_fin + 'T12:00:00'), 1), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')

  const [form, setForm]       = useState({
    plan_id:      '',
    fecha_inicio: fechaInicioSugerida,
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
            <h2 className="text-sm font-bold text-gray-900">Renovar membresía</h2>
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
          {miembro.dias_restantes > 0 && form.fecha_inicio === fechaInicioSugerida && (
            <p className="text-xs text-emerald-600 mt-1">
              El miembro aún tiene <strong>{miembro.dias_restantes} días</strong> vigentes. La nueva membresía empezará el día que vence la actual para no perder esos días.
            </p>
          )}
          {miembro.dias_restantes > 0 && form.fecha_inicio !== fechaInicioSugerida && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ El miembro aún tiene {miembro.dias_restantes} días vigentes. Si cambias la fecha de inicio, podría perder esos días.
            </p>
          )}
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
            <span className="text-sm text-gray-700">Total a cobrar</span>
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

// Modal para eliminar pago con contraseña
function ModalEliminarPago({ pago, onCerrar, onEliminado }) {
  const [password, setPassword] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  const handleEliminar = async () => {
    if (!password) { setError('Ingresa tu contraseña'); return }
    setEliminando(true)
    setError('')
    try {
      await api.delete(`/pagos/${pago.id}`, { data: { password } })
      onEliminado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Eliminar registro de pago</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <strong>Plan:</strong> {pago.plan_nombre} — <strong>Monto:</strong> S/ {parseFloat(pago.monto).toFixed(2)}<br />
          <strong>Fecha:</strong> {new Date(pago.fecha_pago).toLocaleDateString('es-PE')}
        </div>
        <div>
          <label className="label">Contraseña de administrador</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEliminar() }}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onCerrar} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={handleEliminar}
            disabled={eliminando || !password}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
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
  const [modalRenovar, setModalRenovar]           = useState(false)
  const [renovado, setRenovado]                   = useState(false)
  const [cambiandoEstado, setCambiandoEstado]     = useState(false)
  const [modalEliminarPago, setModalEliminarPago] = useState(null) // pago a eliminar

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
        <span className="text-gray-600">{miembro.nombres} {miembro.apellidos}</span>
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
          <p className="text-2xl font-bold text-gray-900">{miembro.asistencias_mes ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Asistencias este mes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{miembro.historial_pagos?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pagos totales</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${
            miembro.dias_restantes == null ? 'text-gray-400' :
            miembro.dias_restantes < 0    ? 'text-red-400' :
            miembro.dias_restantes <= 7   ? 'text-amber-400' :
            'text-emerald-400'
          }`}>
            {miembro.dias_restantes == null ? '—' :
             miembro.dias_restantes < 0     ? 'Vencido' :
             miembro.dias_restantes}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Días restantes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">
            {sol(miembro.historial_pagos?.reduce((s, p) => s + parseFloat(p.monto), 0))}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total pagado</p>
        </div>
      </div>

      {/* Info de membresía activa */}
      {miembro.membresia_estado === 'activa' && (
        <div className="card border border-gym-border">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Membresía actual</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Plan</p>
              <p className="text-gray-900 font-semibold">{miembro.plan_nombre || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Inicio</p>
              <p className="text-gray-600">
                {miembro.fecha_inicio
                  ? new Date(miembro.fecha_inicio).toLocaleDateString('es-PE')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wide mb-0.5">Vencimiento</p>
              <p className={`font-semibold ${
                miembro.dias_restantes <= 7 ? 'text-amber-400' : 'text-gray-600'
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

      {/* Progreso físico (peso/estatura) */}
      <ProgresoFisico miembroId={miembro.id} />

      {/* Historial de pagos */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gym-border">
          <h2 className="text-sm font-semibold text-gray-700">Historial de pagos</h2>
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {miembro.historial_pagos.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-3 text-gray-700 text-xs">{p.plan_nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(p.fecha_inicio).toLocaleDateString('es-PE')}
                      {' → '}
                      {new Date(p.fecha_fin).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-400">{sol(p.monto)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-700 flex items-center gap-1">
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setModalEliminarPago(p)}
                        title="Eliminar este registro"
                        className="text-gray-300 hover:text-red-500 transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
                      >
                        🗑
                      </button>
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

      {/* Modal eliminar pago */}
      {modalEliminarPago && (
        <ModalEliminarPago
          pago={modalEliminarPago}
          onCerrar={() => setModalEliminarPago(null)}
          onEliminado={() => { setModalEliminarPago(null); cargar() }}
        />
      )}
    </div>
  )
}

// Tarjeta de progreso físico: historial de medidas, gráfico de peso y registro rápido
function ProgresoFisico({ miembroId }) {
  const [medidas, setMedidas]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [peso, setPeso]         = useState('')
  const [estatura, setEstatura] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  const cargar = () => {
    api.get(`/miembros/${miembroId}/medidas`)
      .then(({ data }) => setMedidas(data))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [miembroId])

  const handleGuardar = async () => {
    if (!peso && !estatura) return
    setGuardando(true)
    setError('')
    try {
      await api.post(`/miembros/${miembroId}/medidas`, {
        peso_kg:     peso     || null,
        estatura_cm: estatura || null,
      })
      setPeso('')
      setEstatura('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar la medida')
    } finally {
      setGuardando(false)
    }
  }

  // Última medida conocida de cada tipo (pueden venir en registros distintos)
  const ultimoPeso     = [...medidas].reverse().find((m) => m.peso_kg != null)
  const ultimaEstatura = [...medidas].reverse().find((m) => m.estatura_cm != null)
  const imc = ultimoPeso && ultimaEstatura
    ? (parseFloat(ultimoPeso.peso_kg) / Math.pow(parseFloat(ultimaEstatura.estatura_cm) / 100, 2)).toFixed(1)
    : null

  // Serie para el gráfico: solo registros con peso
  const serie = medidas
    .filter((m) => m.peso_kg != null)
    .map((m) => ({
      etiqueta: new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      peso: parseFloat(m.peso_kg),
    }))

  const primerPeso = serie[0]?.peso
  const pesoActual = serie[serie.length - 1]?.peso
  const cambio = primerPeso != null && serie.length > 1
    ? (pesoActual - primerPeso).toFixed(1)
    : null

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Progreso físico</h2>
        {cambio != null && (
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
            cambio <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {cambio > 0 ? '+' : ''}{cambio} kg desde la primera medida
          </span>
        )}
      </div>

      {cargando ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Resumen + registro */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg py-2.5">
                <p className="stat-num text-xl text-gray-900">{ultimoPeso ? `${parseFloat(ultimoPeso.peso_kg)}` : '—'}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Peso kg</p>
              </div>
              <div className="bg-slate-50 rounded-lg py-2.5">
                <p className="stat-num text-xl text-gray-900">{ultimaEstatura ? `${parseFloat(ultimaEstatura.estatura_cm)}` : '—'}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Est. cm</p>
              </div>
              <div className="bg-slate-50 rounded-lg py-2.5">
                <p className="stat-num text-xl text-gray-900">{imc || '—'}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">IMC</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="label mb-0">Registrar nueva medida</p>
              <div className="flex gap-2">
                <input
                  type="number" step="0.1" min="20" max="399"
                  className="input" placeholder="Peso kg"
                  value={peso} onChange={(e) => setPeso(e.target.value)}
                />
                <input
                  type="number" step="0.5" min="80" max="259"
                  className="input" placeholder="Est. cm"
                  value={estatura} onChange={(e) => setEstatura(e.target.value)}
                />
                <button
                  onClick={handleGuardar}
                  disabled={guardando || (!peso && !estatura)}
                  className="btn-primary text-sm shrink-0"
                >
                  {guardando ? '...' : 'Guardar'}
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>

          {/* Gráfico de evolución del peso */}
          <div className="lg:col-span-2">
            {serie.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    formatter={(v) => [`${v} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3.5, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                compacto
                icono="📈"
                titulo={medidas.length === 0 ? 'Sin medidas registradas' : 'Registra otra medida para ver la evolución'}
                detalle="Con dos o más registros de peso verás aquí la curva de progreso del miembro."
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
