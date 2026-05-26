// Página pública de máquina — se abre al escanear el QR
// Accesible sin autenticación
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

function getYoutubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export default function MaquinaPublica() {
  const { id } = useParams()
  const [maquina, setMaquina]   = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')
  const [modalVideo, setModalVideo] = useState(false)

  useEffect(() => {
    api.get(`/maquinas/${id}`)
      .then(({ data }) => setMaquina(data))
      .catch(() => setError('Máquina no encontrada'))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <p className="text-5xl">⚠️</p>
        <p className="text-red-400 font-semibold">{error}</p>
      </div>
    )
  }

  const youtubeId = getYoutubeId(maquina.video_url)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center gap-3">
        <img src="/robert-gym-logo.png" alt="Robert Gym" className="h-8 object-contain" />
        <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Guía de uso</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Foto */}
        {maquina.foto_url ? (
          <img
            src={maquina.foto_url}
            alt={maquina.nombre}
            className="w-full h-56 object-cover rounded-2xl border border-white/10"
          />
        ) : (
          <div className="w-full h-56 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-6xl">
            🏋️
          </div>
        )}

        {/* Nombre y descripción */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{maquina.nombre}</h1>
          {maquina.descripcion && (
            <p className="text-sm text-white/50 mt-1 leading-relaxed">{maquina.descripcion}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {maquina.pdf_url && (
            <a
              href={maquina.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 transition-colors"
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-xl shrink-0">
                📄
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Músculos trabajados</p>
                <p className="text-xs text-white/40 mt-0.5">Ver guía en PDF</p>
              </div>
              <span className="text-white/30 text-lg">→</span>
            </a>
          )}

          {youtubeId && (
            <button
              onClick={() => setModalVideo(true)}
              className="flex items-center gap-4 w-full bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 rounded-2xl px-5 py-4 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center text-xl shrink-0">
                ▶️
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Video tutorial</p>
                <p className="text-xs text-white/40 mt-0.5">Cómo usar la máquina</p>
              </div>
              <span className="text-white/30 text-lg">→</span>
            </button>
          )}

          {!maquina.pdf_url && !youtubeId && (
            <p className="text-center text-white/30 text-sm py-4">
              Próximamente se agregará contenido para esta máquina.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/20 pt-4">
          Robert Gym — Club Fitness · Arequipa, Perú
        </p>
      </div>

      {/* Modal video YouTube */}
      {modalVideo && youtubeId && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setModalVideo(false)}
        >
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm font-semibold">{maquina.nombre} — Tutorial</p>
              <button
                onClick={() => setModalVideo(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={`${maquina.nombre} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
