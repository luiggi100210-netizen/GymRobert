import { useEffect, useState } from 'react'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

const TABS = [
  { key: 'pronto',  label: 'Vencen en 7 días',  icon: '⚠️' },
  { key: 'mes',     label: 'Vencen en 30 días',  icon: '📅' },
  { key: 'vencidos',label: 'Vencidos',           icon: '❌' },
]

function fecha(f) {
  return new Date(f + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mensajeWsp(miembro, tab) {
  const nombre = miembro.nombres.split(' ')[0]
  const f = fecha(miembro.fecha_fin)
  const plan = miembro.plan_nombre || 'tu plan'

  if (tab === 'vencidos') {
    return `Hola ${nombre} 👋

Te escribimos desde *Robert Gym* para saludarte. Notamos que tu membresía (*${plan}*) venció el ${f} y te extrañamos por acá 🏋️

No dejes que el esfuerzo que ya pusiste se pierda. ¡Ahora es el momento de retomar y seguir avanzando! 💪🔥

Para renovar, acércate al gimnasio o escríbenos y te orientamos. ¡Te esperamos con todo!

_Robert Gym — Arequipa_ 🏆`
  }

  if (tab === 'mes') {
    return `Hola ${nombre} 👋

Te informamos que tu membresía en *Robert Gym* (*${plan}*) vence el *${f}*.

Aún tienes tiempo para renovar sin perder tu continuidad. 🗓️ Renueva antes de esa fecha y sigue entrenando sin pausas.

Si tienes alguna duda o quieres cambiar de plan, con gusto te asesoramos. ¡Gracias por ser parte de nuestra familia! 💪

_Robert Gym — Arequipa_ 🏆`
  }

  return `Hola ${nombre} ⚠️

Te recordamos que tu membresía en *Robert Gym* (*${plan}*) vence en pocos días: *${f}*.

Para no perder tu acceso al gimnasio, renuévala cuanto antes. 🏋️ Puedes hacerlo directamente en recepción o avisarnos por aquí.

¡No pares ahora, que ya estás viendo resultados! 💪🔥

_Robert Gym — Arequipa_ 🏆`
}

function abrirWhatsapp(telefono, mensaje) {
  const num = telefono?.replace(/\D/g, '')
  const tel = num?.startsWith('51') ? num : `51${num}`
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank')
}

function FilaMiembro({ m, tab }) {
  const sinTel = !m.telefono
  const msg = mensajeWsp(m, tab)

  return (
    <tr className="border-b border-gym-border hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3">
        <p className="font-medium text-gray-900 text-sm">{m.nombres} {m.apellidos}</p>
        <p className="text-xs text-gray-500">DNI: {m.dni}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
        {m.telefono || <span className="text-red-400 text-xs">Sin teléfono</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{m.plan_nombre}</td>
      <td className="px-4 py-3 text-sm">
        {tab === 'vencidos' ? (
          <span className="text-red-500 font-medium">{fecha(m.fecha_fin)}</span>
        ) : (
          <span className={m.dias_restantes <= 3 ? 'text-red-500 font-bold' : 'text-amber-600 font-medium'}>
            {fecha(m.fecha_fin)}
            <span className="text-xs text-gray-400 ml-1">
              ({tab === 'vencidos' ? `hace ${m.dias_vencido}d` : `${m.dias_restantes}d`})
            </span>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => abrirWhatsapp(m.telefono, msg)}
          disabled={sinTel}
          title={sinTel ? 'No tiene teléfono registrado' : msg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>💬</span> Enviar aviso
        </button>
      </td>
    </tr>
  )
}

export default function Whatsapp() {
  const [tab, setTab]         = useState('pronto')
  const [datos, setDatos]     = useState({ pronto: [], mes: [], vencidos: [] })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    Promise.all([
      api.get('/membresias/vencen-pronto?dias=7'),
      api.get('/membresias/vencen-pronto?dias=30'),
      api.get('/membresias/vencidos'),
    ]).then(([r1, r2, r3]) => {
      const pronto = r1.data
      const mes    = r2.data.filter((m) => m.dias_restantes > 7)
      setDatos({ pronto, mes, vencidos: r3.data })
    }).finally(() => setCargando(false))
  }, [])

  const lista = datos[tab] || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-0.5">Envía avisos de membresía a tus miembros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 border border-gym-border rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-slate-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
            {datos[t.key]?.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                t.key === 'vencidos' ? 'bg-red-100 text-red-600' :
                t.key === 'pronto'  ? 'bg-amber-100 text-amber-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {datos[t.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mensaje de ayuda */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
        💬 Al hacer click en <strong>"Enviar aviso"</strong> se abrirá WhatsApp con el mensaje listo. Solo necesitas presionar <strong>Enviar</strong>.
      </div>

      {/* Tabla */}
      {cargando ? <Spinner /> : lista.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium text-gray-600">No hay miembros en esta categoría</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gym-border bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium">Miembro</th>
                  <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Vencimiento</th>
                  <th className="text-left px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <FilaMiembro key={m.membresia_id} m={m} tab={tab} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
