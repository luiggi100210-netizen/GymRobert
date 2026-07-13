import { useEffect, useState, useCallback, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const PESTANAS = ['Hoy', 'Historial', 'Reporte mensual']

function duracion(minutos) {
  if (!minutos) return '—'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function hora(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function ModalRegistroManual({ onCerrar, onRegistrado }) {
  const [buscar, setBuscar]       = useState('')
  const [miembros, setMiembros]   = useState([])
  const [buscando, setBuscando]   = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null) // { estado, mensaje }
  const [error, setError]         = useState('')
  const timerRef                  = useRef(null)

  const buscarMiembros = useCallback((q) => {
    if (!q.trim()) { setMiembros([]); return }
    setBuscando(true)
    api.get('/miembros', { params: { buscar: q } })
      .then(({ data }) => setMiembros(data.data.slice(0, 6)))
      .finally(() => setBuscando(false))
  }, [])

  // Cuando el input tiene exactamente 8 dígitos, busca por DNI y auto-selecciona si hay match
  const buscarPorDni = useCallback((dni) => {
    setBuscando(true)
    api.get('/miembros', { params: { buscar: dni } })
      .then(({ data }) => {
        const exacto = data.data.find((m) => m.dni === dni)
        if (exacto) {
          setSeleccionado(exacto)
          setBuscar(`${exacto.nombres} ${exacto.apellidos}`)
          setMiembros([])
        } else {
          setMiembros(data.data.slice(0, 6))
        }
      })
      .finally(() => setBuscando(false))
  }, [])

  const handleBuscar = (e) => {
    const q = e.target.value
    setBuscar(q)
    setSeleccionado(null)
    setResultado(null)
    setError('')
    clearTimeout(timerRef.current)
    if (/^\d{8}$/.test(q)) {
      timerRef.current = setTimeout(() => buscarPorDni(q), 300)
    } else {
      timerRef.current = setTimeout(() => buscarMiembros(q), 300)
    }
  }

  const handleSeleccionar = (m) => {
    setSeleccionado(m)
    setBuscar(`${m.nombres} ${m.apellidos}`)
    setMiembros([])
    setResultado(null)
    setError('')
  }

  const handleRegistrar = async () => {
    if (!seleccionado) return
    setGuardando(true)
    setError('')
    try {
      const { data } = await api.post('/asistencia/manual', { miembro_id: seleccionado.id })
      setResultado(data)
      onRegistrado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar asistencia')
    } finally {
      setGuardando(false)
    }
  }

  const estadoActual = seleccionado
    ? seleccionado.membresia_estado !== 'activa'
      ? 'sin membresía'
      : null
    : null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Registro manual de asistencia</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <label className="label">Buscar miembro</label>
          <input
            type="text"
            className="input"
            placeholder="Nombre, apellido o DNI..."
            value={buscar}
            onChange={handleBuscar}
            autoFocus
          />
          {buscando && (
            <p className="text-xs text-gray-500 mt-1">Buscando...</p>
          )}
          {miembros.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-xl">
              {miembros.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => handleSeleccionar(m)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{m.nombres} {m.apellidos}</p>
                      <p className="text-xs text-gray-600">DNI: {m.dni}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      m.membresia_estado === 'activa'
                        ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-400'
                        : 'bg-red-900/30 border-red-800/50 text-red-400'
                    }`}>
                      {m.membresia_estado === 'activa' ? 'activo' : 'vencido'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info del seleccionado */}
        {seleccionado && !resultado && (
          <div className="bg-gray-900/60 border border-gym-border rounded-xl px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-white">
              {seleccionado.nombres} {seleccionado.apellidos}
            </p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>DNI: {seleccionado.dni}</span>
              <span>Plan: {seleccionado.plan_nombre || '—'}</span>
            </div>
            {estadoActual && (
              <p className="text-xs text-red-400 mt-1">Sin membresía activa — no se puede registrar</p>
            )}
          </div>
        )}

        {/* Resultado exitoso */}
        {resultado && (
          <div className={`rounded-xl px-4 py-4 text-center border ${
            resultado.estado === 'entrada'
              ? 'bg-blue-900/20 border-blue-800/40'
              : 'bg-emerald-900/20 border-emerald-800/40'
          }`}>
            <p className="text-3xl mb-2">{resultado.estado === 'entrada' ? '🟢' : '🔴'}</p>
            <p className={`text-lg font-bold capitalize ${
              resultado.estado === 'entrada' ? 'text-blue-300' : 'text-emerald-300'
            }`}>
              {resultado.estado} registrada
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {resultado.miembro.nombre_completo}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="btn-ghost flex-1">
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>
          {!resultado && (
            <button
              onClick={handleRegistrar}
              disabled={guardando || !seleccionado || !!estadoActual}
              className="btn-primary flex-1"
            >
              {guardando ? 'Registrando...' : 'Registrar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Asistencia() {
  const [pestana, setPestana] = useState(0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control de entradas y salidas del gimnasio</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-slate-100 border border-gym-border rounded-xl p-1 w-fit max-w-full overflow-x-auto">
        {PESTANAS.map((t, i) => (
          <button
            key={i}
            onClick={() => setPestana(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === i
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-slate-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {pestana === 0 && <TabHoy />}
      {pestana === 1 && <TabHistorial />}
      {pestana === 2 && <TabReporteMensual />}
    </div>
  )
}

// Pestaña: Asistencias de hoy (actualización automática cada 30s)
function TabHoy() {
  const [lista, setLista]         = useState([])
  const [cargando, setCargando]   = useState(true)
  const [modalManual, setModalManual] = useState(false)

  const cargar = useCallback(() => {
    api.get('/asistencia/hoy')
      .then(({ data }) => setLista(data))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000) // refrescar cada 30 seg
    return () => clearInterval(interval)
  }, [cargar])

  const enGym    = lista.filter((a) => !a.salida).length
  const salieron = lista.filter((a) => a.salida).length

  return (
    <div className="space-y-4">
      {/* Stats + botón */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="grid grid-cols-3 gap-3 flex-1 w-full">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{lista.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total hoy</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">{enGym}</p>
            <p className="text-xs text-gray-500 mt-0.5">En el gym</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-400">{salieron}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completados</p>
          </div>
        </div>
        <button
          onClick={() => setModalManual(true)}
          className="btn-primary text-sm shrink-0 sm:mt-1 w-full sm:w-auto"
        >
          + Registrar manual
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {cargando ? <Spinner /> : lista.length === 0 ? (
          <EmptyState
            icono="🕐"
            titulo="Sin asistencias registradas hoy"
            detalle="Las entradas del kiosco y los registros manuales aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gym-border bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Miembro</th>
                <th className="text-left px-4 py-3 font-medium">Entrada</th>
                <th className="text-left px-4 py-3 font-medium">Salida</th>
                <th className="text-left px-4 py-3 font-medium">Tiempo</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{a.nombres} {a.apellidos}</p>
                    <p className="text-xs text-gray-600">{a.plan_nombre || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-sm font-mono">{hora(a.entrada)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{hora(a.salida)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{duracion(a.duracion_minutos)}</td>
                  <td className="px-4 py-3">
                    {a.salida
                      ? <span className="badge-verde">Completado</span>
                      : <span className="badge-azul">En gym</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modalManual && (
        <ModalRegistroManual
          onCerrar={() => setModalManual(false)}
          onRegistrado={cargar}
        />
      )}
    </div>
  )
}

// Pestaña: Historial por fecha
function TabHistorial() {
  const [fecha, setFecha]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [lista, setLista]   = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setCargando(true)
    api.get(`/asistencia/dia/${fecha}`)
      .then(({ data }) => setLista(data))
      .finally(() => setCargando(false))
  }, [fecha])

  // Últimos 7 días como acceso rápido
  const accesosRapidos = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i)
    return { valor: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM', { locale: es }) }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          className="input w-auto"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
        <div className="flex gap-1 flex-wrap">
          {accesosRapidos.map((d) => (
            <button
              key={d.valor}
              onClick={() => setFecha(d.valor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                fecha === d.valor
                  ? 'bg-gym-red border-gym-red text-white'
                  : 'border-gym-border text-gray-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {cargando ? <Spinner /> : lista.length === 0 ? (
          <EmptyState
            icono="📅"
            titulo="Sin registros para esta fecha"
            detalle="Prueba con otro día usando los accesos rápidos de arriba."
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gym-border bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Miembro</th>
                <th className="text-left px-4 py-3 font-medium">Entrada</th>
                <th className="text-left px-4 py-3 font-medium">Salida</th>
                <th className="text-left px-4 py-3 font-medium">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{a.nombres} {a.apellidos}</p>
                    <p className="text-xs text-gray-600">{a.plan_nombre || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-sm">{hora(a.entrada)}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{hora(a.salida)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{duracion(a.duracion_minutos)}</td>
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

// Pestaña: Reporte mensual completo
function TabReporteMensual() {
  const hoy = new Date()
  const [mes, setMes]   = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [datos, setDatos]   = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setCargando(true)
    api.get(`/asistencia/reporte/${mes}/${anio}`)
      .then(({ data }) => setDatos(data))
      .finally(() => setCargando(false))
  }, [mes, anio])

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          className="input w-auto"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
            .map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
        </select>
        <select
          className="input w-auto"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
        >
          {Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => 2024 + i).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {cargando ? <Spinner /> : datos && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{datos.total_asistencias}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total asistencias</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-400">{datos.miembros_unicos}</p>
              <p className="text-xs text-gray-500 mt-0.5">Miembros únicos</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {parseFloat(datos.promedio_diario || 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Promedio diario</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-purple-400">{datos.duracion_promedio || 0}m</p>
              <p className="text-xs text-gray-500 mt-0.5">Duración promedio</p>
            </div>
          </div>

          {/* Gráfico por día */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Asistencias por día</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={datos.por_dia} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).getDate()}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('es-PE')}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="total" fill="#c53030" radius={[3, 3, 0, 0]} name="Asistencias" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Por día de semana */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Por día de semana</h3>
              <div className="space-y-2">
                {datos.por_dia_semana.map((d) => {
                  const max = Math.max(...datos.por_dia_semana.map((x) => x.total))
                  const pct = max ? (d.total / max) * 100 : 0
                  return (
                    <div key={d.dia_semana} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-12">{d.dia_semana.trim().slice(0, 3)}</span>
                      <div className="flex-1 bg-gray-900 rounded-full h-2">
                        <div className="bg-gym-red rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right">{d.total}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top miembros */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 5 miembros</h3>
              <ol className="space-y-2">
                {datos.top_miembros.map((m, i) => (
                  <li key={m.dni} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500 text-black' :
                      i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {m.nombres} {m.apellidos}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gym-red-light">
                      {m.total_asistencias}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
