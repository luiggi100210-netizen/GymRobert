import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { addDays, format } from 'date-fns'
import api from '../api/client'

const METODOS = ['efectivo', 'yape', 'plin', 'transferencia']

export default function NuevoMiembro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editarId = searchParams.get('editar')
  const esEdicion = !!editarId

  const [planes, setPlanes]           = useState([])
  const [planSel, setPlanSel]         = useState(null)
  const [buscandoDni, setBuscandoDni] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [exito, setExito]             = useState(false)
  const [error, setError]             = useState('')
  const [paso, setPaso]               = useState(1) // 1=datos, 2=plan/pago, 3=resumen

  const [form, setForm] = useState({
    dni: '', nombres: '', apellidos: '', telefono: '',
    fecha_nacimiento: '', huella_id: '',
    plan_id: '', fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'efectivo', comprobante: '',
  })

  // Calcular fecha fin automáticamente
  const fechaFin = planSel && form.fecha_inicio
    ? format(addDays(new Date(form.fecha_inicio + 'T12:00:00'), planSel.duracion_dias), 'yyyy-MM-dd')
    : ''

  useEffect(() => {
    api.get('/planes').then(({ data }) => setPlanes(data))
  }, [])

  // Si es edición, cargar datos del miembro
  useEffect(() => {
    if (!editarId) return
    api.get(`/miembros/${editarId}`).then(({ data }) => {
      setForm((f) => ({
        ...f,
        dni:              data.dni,
        nombres:          data.nombres,
        apellidos:        data.apellidos,
        telefono:         data.telefono || '',
        fecha_nacimiento: data.fecha_nacimiento?.split('T')[0] || '',
        huella_id:        data.huella_id || '',
      }))
    })
  }, [editarId])

  const buscarDni = async () => {
    if (form.dni.length !== 8) return
    setBuscandoDni(true)
    try {
      const { data } = await api.get(`/miembros/dni/${form.dni}`)
      setForm((f) => ({
        ...f,
        nombres:  data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono || f.telefono,
      }))
    } catch {
      // DNI no encontrado — es un miembro nuevo, ignorar
    } finally {
      setBuscandoDni(false)
    }
  }

  const seleccionarPlan = (plan) => {
    setPlanSel(plan)
    setForm((f) => ({ ...f, plan_id: plan.id }))
  }

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleSubmit = async () => {
    setGuardando(true)
    setError('')
    try {
      if (esEdicion) {
        await api.put(`/miembros/${editarId}`, {
          nombres:          form.nombres,
          apellidos:        form.apellidos,
          telefono:         form.telefono,
          fecha_nacimiento: form.fecha_nacimiento || null,
          huella_id:        form.huella_id || null,
        })
      } else {
        await api.post('/miembros', { ...form })
      }
      setExito(true)
      setTimeout(() => navigate('/miembros'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el miembro')
    } finally {
      setGuardando(false)
    }
  }

  if (exito) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-emerald-900/30 border border-emerald-700 rounded-full flex items-center justify-center text-3xl">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {esEdicion ? 'Miembro actualizado' : 'Miembro registrado correctamente'}
        </h2>
        <p className="text-gray-500 text-sm">Redirigiendo a la lista de miembros...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {esEdicion ? 'Editar Miembro' : 'Nuevo Miembro'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {esEdicion ? 'Actualiza los datos del miembro' : 'Registro de nuevo socio al gimnasio'}
        </p>
      </div>

      {/* Pasos (solo en modo creación) */}
      {!esEdicion && (
        <div className="flex items-center gap-2">
          {['Datos personales', 'Plan y pago', 'Confirmar'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                paso === i + 1 ? 'bg-gym-red text-white' :
                paso > i + 1  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' :
                'bg-gray-900 text-gray-600 border border-gym-border'
              }`}>
                <span>{paso > i + 1 ? '✓' : i + 1}</span>
                <span>{label}</span>
              </div>
              {i < 2 && <span className="text-gym-border">→</span>}
            </div>
          ))}
        </div>
      )}

      {/* PASO 1: Datos personales */}
      {(paso === 1 || esEdicion) && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gym-border pb-3">
            Datos personales
          </h2>

          {/* DNI con búsqueda */}
          <div>
            <label className="label">DNI *</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input"
                placeholder="12345678"
                maxLength={8}
                value={form.dni}
                onChange={(e) => set('dni', e.target.value)}
                disabled={esEdicion}
              />
              {!esEdicion && (
                <button
                  type="button"
                  onClick={buscarDni}
                  disabled={form.dni.length !== 8 || buscandoDni}
                  className="btn-ghost text-xs whitespace-nowrap"
                >
                  {buscandoDni ? '...' : 'Buscar'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombres *</label>
              <input
                type="text"
                className="input"
                placeholder="Juan Carlos"
                value={form.nombres}
                onChange={(e) => set('nombres', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Apellidos *</label>
              <input
                type="text"
                className="input"
                placeholder="García López"
                value={form.apellidos}
                onChange={(e) => set('apellidos', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono / WhatsApp</label>
              <input
                type="text"
                className="input"
                placeholder="959123456"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fecha de nacimiento</label>
              <input
                type="date"
                className="input"
                value={form.fecha_nacimiento}
                onChange={(e) => set('fecha_nacimiento', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">ID de huella biométrica</label>
            <input
              type="text"
              className="input"
              placeholder="ID del sensor (ej: FP-001)"
              value={form.huella_id}
              onChange={(e) => set('huella_id', e.target.value)}
            />
          </div>

          {!esEdicion && (
            <button
              onClick={() => setPaso(2)}
              disabled={!form.dni || !form.nombres || !form.apellidos}
              className="btn-primary w-full"
            >
              Continuar →
            </button>
          )}

          {esEdicion && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/miembros')} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={guardando} className="btn-primary flex-1">
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 2: Plan y pago */}
      {paso === 2 && !esEdicion && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gym-border pb-3">
              Seleccionar plan
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {planes.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => seleccionarPlan(plan)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    planSel?.id === plan.id
                      ? 'border-gym-red bg-gym-red/10'
                      : 'border-gym-border hover:border-gray-600'
                  }`}
                >
                  <p className="font-bold text-gray-900 text-sm">{plan.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.duracion_dias} días</p>
                  <p className="text-gym-red-light font-bold mt-2">S/ {plan.precio}</p>
                </button>
              ))}
            </div>

            {planSel && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="label">Fecha de inicio *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Fecha de fin (calculada)</label>
                  <input
                    type="text"
                    className="input bg-gray-800 cursor-not-allowed"
                    value={fechaFin ? new Date(fechaFin + 'T12:00:00').toLocaleDateString('es-PE') : '—'}
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gym-border pb-3">
              Método de pago
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METODOS.map((m) => (
                <button
                  key={m}
                  onClick={() => set('metodo_pago', m)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    form.metodo_pago === m
                      ? 'border-gym-red bg-gym-red/10 text-white'
                      : 'border-gym-border text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Número de comprobante (opcional)</label>
              <input
                type="text"
                className="input"
                placeholder="Nro. operación / boleta"
                value={form.comprobante}
                onChange={(e) => set('comprobante', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)} className="btn-ghost flex-1">
              ← Atrás
            </button>
            <button
              onClick={() => setPaso(3)}
              disabled={!planSel}
              className="btn-primary flex-1"
            >
              Ver resumen →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Resumen y confirmación */}
      {paso === 3 && !esEdicion && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gym-border pb-3">
              Resumen del registro
            </h2>
            <Fila label="Nombre" valor={`${form.nombres} ${form.apellidos}`} />
            <Fila label="DNI"    valor={form.dni} />
            <Fila label="Teléfono" valor={form.telefono || '—'} />
            <Fila label="Huella" valor={form.huella_id || 'No registrada'} />
            <div className="w-full h-px bg-gym-border my-1" />
            <Fila label="Plan"     valor={planSel?.nombre} />
            <Fila label="Inicio"   valor={new Date(form.fecha_inicio + 'T12:00:00').toLocaleDateString('es-PE')} />
            <Fila label="Fin"      valor={new Date(fechaFin + 'T12:00:00').toLocaleDateString('es-PE')} />
            <Fila label="Monto"    valor={`S/ ${planSel?.precio}`} />
            <Fila label="Pago"     valor={form.metodo_pago} />
            {form.comprobante && <Fila label="Comprobante" valor={form.comprobante} />}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setPaso(2)} className="btn-ghost flex-1">
              ← Modificar
            </button>
            <button
              onClick={handleSubmit}
              disabled={guardando}
              className="btn-primary flex-1 py-3"
            >
              {guardando ? 'Registrando...' : '✓ Confirmar registro'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Fila({ label, valor }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{valor}</span>
    </div>
  )
}
