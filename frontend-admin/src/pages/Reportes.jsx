import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from 'recharts'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reportes() {
  const hoy = new Date()
  const [mes, setMes]   = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [ingresos, setIngresos]   = useState(null)
  const [proyeccion, setProyeccion] = useState(null)
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    setCargando(true)
    Promise.all([
      api.get(`/reportes/ingresos/${mes}/${anio}`),
      api.get('/reportes/proyeccion'),
    ]).then(([ing, proy]) => {
      setIngresos(ing.data)
      setProyeccion(proy.data)
    }).finally(() => setCargando(false))
  }, [mes, anio])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis financiero y proyecciones</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto text-sm" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select className="input w-auto text-sm" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => 2024 + i).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {cargando ? <Spinner /> : (
        <div className="space-y-4">
          {/* Cards financieros */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ingresos del mes</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {sol(ingresos?.resumen?.total_ingresos)}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{ingresos?.resumen?.total_pagos} cobros</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mes anterior</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{sol(proyeccion?.mes_anterior)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Proyección sig. mes</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{sol(proyeccion?.proyeccion)}</p>
              <p className="text-xs text-gray-600 mt-0.5">{proyeccion?.vencen_siguiente} renuevan</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Variación</p>
              {(() => {
                const actual   = ingresos?.resumen?.total_ingresos || 0
                const anterior = proyeccion?.mes_anterior || 0
                const diff     = actual - anterior
                const pct      = anterior > 0 ? ((diff / anterior) * 100).toFixed(1) : 0
                return (
                  <>
                    <p className={`text-2xl font-bold mt-1 ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{pct}%
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">vs mes anterior</p>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Gráfico ingresos por día */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Ingresos diarios — {MESES[mes - 1]} {anio}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ingresos?.por_dia} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).getDate()}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `S/${v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                  formatter={(v) => [sol(v), 'Ingresos']}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('es-PE')}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por plan + métodos de pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ingresos por plan</h3>
              <div className="space-y-3">
                {(ingresos?.por_plan || []).map((p) => {
                  const max = Math.max(...(ingresos?.por_plan || []).map((x) => x.total))
                  const pct = max ? (p.total / max) * 100 : 0
                  return (
                    <div key={p.plan}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{p.plan} ({p.cantidad} pagos)</span>
                        <span className="text-emerald-400 font-bold">{sol(p.total)}</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5">
                        <div className="bg-emerald-500 rounded-full h-1.5" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Por método de pago</h3>
              <div className="space-y-2.5">
                {[
                  { key: 'efectivo',      label: 'Efectivo',       icon: '💵', color: 'bg-emerald-500' },
                  { key: 'yape',          label: 'Yape',           icon: '📱', color: 'bg-purple-500' },
                  { key: 'plin',          label: 'Plin',           icon: '📲', color: 'bg-blue-500' },
                  { key: 'transferencia', label: 'Transferencia',  icon: '🏦', color: 'bg-amber-500' },
                ].map(({ key, label, icon, color }) => {
                  const monto = ingresos?.resumen?.[key] || 0
                  const total = ingresos?.resumen?.total_ingresos || 1
                  const pct   = (monto / total) * 100
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-base w-6">{icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{label}</span>
                          <span className="text-gray-700">{sol(monto)}</span>
                        </div>
                        <div className="w-full bg-gray-900 rounded-full h-1.5">
                          <div className={`${color} rounded-full h-1.5`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
