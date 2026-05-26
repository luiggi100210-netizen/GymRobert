import { useEffect, useState } from 'react'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

function qrUrl(id) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    window.location.origin + '/maquina/' + id
  )}`
}

export default function Maquinas() {
  const [maquinas, setMaquinas]     = useState([])
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(null) // null | 'nuevo' | {maquina}
  const [form, setForm]             = useState({ nombre: '', descripcion: '', foto_url: '', pdf_url: '', video_url: '' })
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')
  const [confirmar, setConfirmar]   = useState(null)

  const cargar = () => {
    setCargando(true)
    api.get('/maquinas').then(({ data }) => setMaquinas(data)).finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setForm({ nombre: '', descripcion: '', foto_url: '', pdf_url: '', video_url: '' })
    setError('')
    setModal('nuevo')
  }

  const abrirEditar = (m) => {
    setForm({
      nombre:      m.nombre,
      descripcion: m.descripcion || '',
      foto_url:    m.foto_url    || '',
      pdf_url:     m.pdf_url     || '',
      video_url:   m.video_url   || '',
    })
    setError('')
    setModal(m)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      if (modal === 'nuevo') {
        await api.post('/maquinas', form)
      } else {
        await api.put(`/maquinas/${modal.id}`, form)
      }
      setModal(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    try {
      await api.delete(`/maquinas/${confirmar.id}`)
      setConfirmar(null)
      cargar()
    } catch {
      setConfirmar(null)
    }
  }

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Máquinas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{maquinas.length} equipos registrados</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary text-sm">+ Nueva máquina</button>
      </div>

      {/* Listado */}
      {cargando ? <Spinner /> : maquinas.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏋️</p>
          <p>No hay máquinas registradas</p>
          <button onClick={abrirNuevo} className="btn-primary mt-4 text-sm">+ Agregar primera máquina</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {maquinas.map((m) => (
            <div key={m.id} className="card flex flex-col gap-3">
              {/* Foto */}
              {m.foto_url ? (
                <img src={m.foto_url} alt={m.nombre} className="w-full h-40 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-5xl">🏋️</div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{m.nombre}</h3>
                {m.descripcion && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.descripcion}</p>
                )}
                <div className="flex gap-2 mt-1.5">
                  {m.pdf_url   && <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">PDF</span>}
                  {m.video_url && <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-medium">YouTube</span>}
                </div>
              </div>

              {/* QR + enlace */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                <img src={qrUrl(m.id)} alt="QR" className="w-14 h-14 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 mb-0.5">Página pública</p>
                  <p className="text-[10px] text-gray-500 truncate font-mono">/maquina/{m.id}</p>
                  <a
                    href={`${window.location.origin}/maquina/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gym-red hover:underline block mt-0.5"
                  >
                    Abrir vista cliente →
                  </a>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => abrirEditar(m)} className="btn-ghost flex-1 text-xs py-1.5">Editar</button>
                <button
                  onClick={() => setConfirmar(m)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                {modal === 'nuevo' ? 'Nueva máquina' : `Editar: ${modal.nombre}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div>
              <label className="label">Nombre *</label>
              <input type="text" className="input" placeholder="Chest Press"
                value={form.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input resize-none" rows={2} placeholder="Trabaja pectoral mayor, deltoides anterior..."
                value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
            </div>
            <div>
              <label className="label">URL de la foto</label>
              <input type="url" className="input" placeholder="https://ejemplo.com/foto.jpg"
                value={form.foto_url} onChange={(e) => set('foto_url', e.target.value)} />
            </div>
            <div>
              <label className="label">URL del PDF (músculos trabajados)</label>
              <input type="url" className="input" placeholder="https://drive.google.com/..."
                value={form.pdf_url} onChange={(e) => set('pdf_url', e.target.value)} />
            </div>
            <div>
              <label className="label">URL del video YouTube</label>
              <input type="url" className="input" placeholder="https://youtube.com/watch?v=..."
                value={form.video_url} onChange={(e) => set('video_url', e.target.value)} />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre}
                className="btn-primary flex-1"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Eliminar máquina</h2>
            <p className="text-sm text-gray-600">
              ¿Seguro que deseas eliminar <strong>{confirmar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(null)} className="btn-ghost flex-1">Cancelar</button>
              <button
                onClick={handleEliminar}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
