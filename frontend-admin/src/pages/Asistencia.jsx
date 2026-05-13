import { useEffect, useState, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

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

export default function Asistencia() {
  const [pestana, setPestana] = useState(0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Asistencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control de entradas y salidas del gimnasio</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-900 border border-gym-border rounded-xl p-1 w-fit">
        {PESTANAS.map((t, i) => (
          <button
            key={i}
            onClick={() => setPestana(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === i
                ? 'bg-gym-card text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
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
  const [lista, setLista]     = useState([])
  const [cargando, setCargando] = useState(true)

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

  const enGym     = lista.filter((a) => !a.salida).length
  const salieron  = lista.filter((a) => a.salida).length

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{lista.length}</p>
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

      <div className="card p-0 overflow-hidden">
        {cargando ? <Spinner /> : lista.length === 0 ? (
          <p className="text-center text-gray-600 py-12">Sin asistencias registradas hoy</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gym-border bg-black/20">
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
                    <p className="font-medium text-gray-200">{a.nombres} {a.apellidos}</p>
                    <p className="text-xs text-gray-600">{a.plan_nombre || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm font-mono">{hora(a.entrada)}</td>
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
        )}
      </div>
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
          <p className="text-center text-gray-600 py-12">Sin registros para esta fecha</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gym-border bg-black/20">
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
                    <p className="font-medium text-gray-200">{a.nombres} {a.apellidos}</p>
                    <p className="text-xs text-gray-600">{a.plan_nombre || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-sm">{hora(a.entrada)}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{hora(a.salida)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{duracion(a.duracion_minutos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {[2024, 2025, 2026].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {cargando ? <Spinner /> : datos && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-white">{datos.total_asistencias}</p>
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
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Asistencias por día</h3>
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
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Por día de semana</h3>
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
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Top 5 miembros</h3>
              <ol className="space-y-2">
                {datos.top_miembros.map((m, i) => (
                  <li key={m.dni} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500 text-black' :
                      i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">
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
