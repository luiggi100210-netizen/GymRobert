import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gym-red/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gym-red rounded-2xl text-2xl font-black text-white mb-4 shadow-lg shadow-gym-red/30">
            R
          </div>
          <h1 className="text-2xl font-bold text-white">ROBERT GYM</h1>
          <p className="text-sm text-gray-500 mt-1">Club Fitness — Panel Admin</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Usuario</label>
            <input
              type="text"
              className="input"
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-700 mt-6">
          Arequipa, Perú · Robert Gym © 2026
        </p>
      </div>
    </div>
  )
}
