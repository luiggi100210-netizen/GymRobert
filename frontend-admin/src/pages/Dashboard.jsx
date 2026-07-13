import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import api from '../api/client'
import { linkWhatsapp } from '../utils/whatsapp'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton, { SkeletonFilas } from '../components/ui/Skeleton'

// Formatea monto en soles peruanos
const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

// Determina el estado visual del miembro según días restantes
function estadoMiembro(dias, estadoMem) {
  if (!estadoMem || estadoMem === 'vencida' || dias == null || dias < 0) return 'vencido'
  if (dias <= 7) return 'por vencer'
  return 'activo'
}

export default function Dashboard() {
  const [datos, setDatos]     = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]     = useState('')

  const cargarDashboard = () => {
    setCargando(true)
    setError('')
    api.get('/reportes/dashboard')
      .then(({ data }) => setDatos(data))
      .catch(() => setError('No se pudo cargar el panel. Revisa tu conexión.'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarDashboard() }, [])

  if (cargando) return <DashboardSkeleton />
  if (error) {
    return (
      <EmptyState
        icono="⚠️"
        titulo={error}
        detalle="El servidor no respondió a tiempo."
        accion={{ texto: 'Reintentar', onClick: cargarDashboard }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="anim-rise">
        <h1 className="page-title">Panel</h1>
        <p className="text-sm text-slate-500 mt-1.5">Resumen general del gimnasio</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-rise anim-rise-1">
        <StatCard
          titulo="Miembros activos"
          valor={datos.miembros_activos}
          sub={`+${datos.nuevos_mes} este mes`}
          icono="👥"
          color="blue"
        />
        <StatCard
          titulo="Ingresos del mes"
          valor={sol(datos.ingresos_mes)}
          sub="Pagos cobrados"
          icono="💰"
          color="green"
        />
        <StatCard
          titulo="Vencen pronto"
          valor={datos.vencen_pronto}
          sub="En los próximos 7 días"
          icono="⚠️"
          color="yellow"
        />
        <StatCard
          titulo="Asistencias hoy"
          valor={datos.asistencias_hoy}
          sub="Ingresos registrados"
          icono="📋"
          color="purple"
        />
      </div>

      {/* Gráfico + próximos a vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 anim-rise anim-rise-2">
        {/* Gráfico de barras: últimos 7 días */}
        <div className="card lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Asistencias — últimos 7 días
          </h2>
          {datos.asistencias_7_dias.length === 0 ? (
            <EmptyState
              compacto
              icono="📊"
              titulo="Aún no hay asistencias esta semana"
              detalle="Cuando los miembros marquen entrada en el kiosco, verás el movimiento aquí."
            />
          ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datos.asistencias_7_dias} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="etiqueta"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                labelStyle={{ color: '#6b7280' }}
                itemStyle={{ color: '#111827' }}
              />
              <Bar dataKey="total" fill="#c53030" radius={[4, 4, 0, 0]} name="Asistencias" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Proyección */}
        <div className="card lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-700">Proyección</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Cobrado este mes</span>
              <span className="text-sm font-bold text-emerald-600">{sol(datos.ingresos_mes)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Proyección siguiente mes</span>
              <span className="text-sm font-bold text-amber-600">{sol(datos.proyeccion_mes)}</span>
            </div>
            <div className="w-full h-px bg-gym-border" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Diferencia</span>
              <span className={`text-sm font-bold ${datos.proyeccion_mes >= datos.ingresos_mes ? 'text-emerald-600' : 'text-red-500'}`}>
                {datos.proyeccion_mes >= datos.ingresos_mes ? '+' : ''}
                {sol(datos.proyeccion_mes - datos.ingresos_mes)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla miembros recientes + próximos a vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 anim-rise anim-rise-3">
        {/* Últimos miembros */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Miembros recientes</h2>
            <Link to="/miembros" className="text-xs text-gym-red hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border">
                  <th className="text-left pb-2 font-medium">Miembro</th>
                  <th className="text-left pb-2 font-medium">Plan</th>
                  <th className="text-left pb-2 font-medium">Vence</th>
                  <th className="text-left pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.ultimos_miembros.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        compacto
                        icono="👥"
                        titulo="Todavía no hay miembros registrados"
                        accion={{ texto: '+ Registrar primer miembro', to: '/miembros/nuevo' }}
                      />
                    </td>
                  </tr>
                )}
                {datos.ultimos_miembros.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-800">{m.nombres} {m.apellidos}</p>
                      <p className="text-xs text-gray-400">{m.dni}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 text-xs">{m.plan_nombre || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-600 text-xs">
                      {m.fecha_fin
                        ? new Date(m.fecha_fin).toLocaleDateString('es-PE')
                        : '—'}
                    </td>
                    <td className="py-2.5">
                      <Badge estado={estadoMiembro(m.dias_restantes, m.membresia_estado)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Próximos a vencer */}
        <VencenProximo />
      </div>
    </div>
  )
}

function VencenProximo() {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get('/membresias/vencen-pronto')
      .then(({ data }) => setLista(data))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Vencen en 7 días</h2>
      {cargando ? (
        <SkeletonFilas filas={3} />
      ) : lista.length === 0 ? (
        <EmptyState
          compacto
          icono="✅"
          titulo="Ninguno próximo a vencer"
          detalle="Todas las membresías están al día."
        />
      ) : (
        <ul className="space-y-2">
          {lista.slice(0, 7).map((m) => {
            const waLink = linkWhatsapp(m.telefono, m.nombres, m.dias_restantes, m.plan_nombre)
            return (
              <li key={m.membresia_id} className="flex items-center justify-between py-2 border-b border-gym-border last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{m.nombres} {m.apellidos}</p>
                  <p className="text-[10px] text-gray-400">{m.plan_nombre}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold ${m.dias_restantes <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                    {m.dias_restantes}d
                  </span>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      title="Enviar recordatorio por WhatsApp"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-600 border border-emerald-300 hover:border-emerald-500 transition-colors text-emerald-600 hover:text-white text-xs font-bold"
                    >
                      W
                    </a>
                  ) : (
                    <span title="Sin número registrado" className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-400 text-xs cursor-not-allowed">
                      W
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Skeleton que imita el layout real del panel mientras cargan los datos
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60 mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="h-64 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
    </div>
  )
}
