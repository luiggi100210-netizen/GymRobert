import { useEffect, useState } from 'react'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

const PLAN_ICONS = { 30: '📅', 90: '🗓️', 365: '🏆' }
const PLAN_COLORS = {
  30:  'border-blue-400 bg-blue-50',
  90:  'border-amber-400 bg-amber-50',
  365: 'border-gym-red bg-gym-red/10',
}

export default function Planes() {
  const [planes, setPlanes]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal]     = useState(null)   // null | 'nuevo' | {plan}
  const [form, setForm]       = useState({ nombre: '', duracion_dias: '', precio: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]     = useState('')

  const cargar = () => {
    setCargando(true)
    api.get('/planes').then(({ data }) => setPlanes(data)).finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setForm({ nombre: '', duracion_dias: '', precio: '' })
    setError('')
    setModal('nuevo')
  }

  const abrirEditar = (plan) => {
    setForm({
      nombre:        plan.nombre,
      duracion_dias: plan.duracion_dias,
      precio:        plan.precio,
      activo:        plan.activo,
    })
    setError('')
    setModal(plan)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/planes', {
          nombre:        form.nombre,
          duracion_dias: parseInt(form.duracion_dias),
          precio:        parseFloat(form.precio),
        })
      } else {
        await api.put(`/planes/${modal.id}`, {
          nombre:        form.nombre,
          duracion_dias: parseInt(form.duracion_dias),
          precio:        parseFloat(form.precio),
          activo:        form.activo,
        })
      }
      setModal(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el plan')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Planes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tipos de membresía disponibles</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary text-sm">
          + Nuevo plan
        </button>
      </div>

      {cargando ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`card border-2 ${PLAN_COLORS[plan.duracion_dias] || 'border-gym-border'} relative`}
            >
              {!plan.activo && (
                <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Inactivo
                </span>
              )}
              <div className="text-3xl mb-3">{PLAN_ICONS[plan.duracion_dias] || '🏷️'}</div>
              <h3 className="text-lg font-bold text-gray-900">{plan.nombre}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{plan.duracion_dias} días de vigencia</p>
              <p className="text-3xl font-black text-gym-red mt-3">{sol(plan.precio)}</p>
              <p className="text-xs text-gray-400 mt-1">
                S/ {(plan.precio / plan.duracion_dias).toFixed(2)} / día
              </p>
              <button
                onClick={() => abrirEditar(plan)}
                className="mt-4 w-full btn-ghost text-xs py-2"
              >
                Editar plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                {modal === 'nuevo' ? 'Nuevo plan' : `Editar: ${modal.nombre}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div>
              <label className="label">Nombre del plan *</label>
              <input
                type="text"
                className="input"
                placeholder="Mensual"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Duración (días) *</label>
              <input
                type="number"
                className="input"
                placeholder="30"
                value={form.duracion_dias}
                onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Precio (S/.) *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="80.00"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>

            {modal !== 'nuevo' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="accent-gym-red"
                />
                <label htmlFor="activo" className="text-sm text-gray-600">Plan activo</label>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre || !form.duracion_dias || !form.precio}
                className="btn-primary flex-1"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
