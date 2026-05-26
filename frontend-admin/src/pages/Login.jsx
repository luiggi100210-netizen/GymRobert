import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login, cargando } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(form.username, form.password)
    if (res.ok) {
      navigate('/')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#1a1a1a]">

      {/* ── Panel izquierdo: formulario ── */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:max-w-[420px] min-h-screen bg-[#1c1c1c] px-8 lg:px-12 py-16 shrink-0">

        {/* Logo */}
        <div className="mb-10">
          <img
            src="/robert-gym-logo.png"
            alt="Robert Gym"
            className="w-[210px] h-auto mix-blend-screen drop-shadow-[0_0_28px_rgba(220,38,38,0.45)]"
          />
        </div>

        {/* Título */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
          <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Usuario
            </label>
            <input
              type="text"
              className="w-full bg-transparent border-b border-gray-700 focus:border-red-600 text-white placeholder-gray-600 py-2 text-sm outline-none transition-colors"
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full bg-transparent border-b border-gray-700 focus:border-red-600 text-white placeholder-gray-600 py-2 text-sm outline-none transition-colors"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold py-3 text-sm tracking-widest uppercase transition-colors mt-2"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-xs text-gray-700 mt-12">
          Arequipa, Perú · Robert Gym © 2026
        </p>
      </div>

      {/* ── Panel derecho: imagen del atleta ── */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="/gym-hero.jpg"
          alt="Robert Gym"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* degradado de fusión con el panel izquierdo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1c1c] via-[#1c1c1c]/20 to-transparent" />
      </div>

    </div>
  )
}
