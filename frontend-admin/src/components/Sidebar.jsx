import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const NAV = [
  { to: '/',           label: 'Dashboard',   icon: '⊞',  exact: true },
  { to: '/miembros',   label: 'Miembros',    icon: '👥' },
  { to: '/asistencia', label: 'Asistencia',  icon: '📋' },
  { to: '/pagos',      label: 'Pagos',       icon: '💰' },
  { to: '/reportes',   label: 'Reportes',    icon: '📊' },
  { to: '/planes',     label: 'Planes',      icon: '🏷️' },
]

function ModalCambiarPassword({ onCerrar }) {
  const [form, setForm]       = useState({ actual: '', nueva: '', confirmar: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]     = useState('')
  const [exito, setExito]     = useState(false)

  const handleGuardar = async () => {
    setError('')
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setGuardando(true)
    try {
      await api.post('/auth/cambiar-password', {
        password_actual: form.actual,
        password_nuevo:  form.nueva,
      })
      setExito(true)
      setTimeout(onCerrar, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Cambiar contraseña</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {exito ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-emerald-600 font-medium">Contraseña actualizada</p>
          </div>
        ) : (
          <>
            <div>
              <label className="label">Contraseña actual</label>
              <input type="password" className="input" value={form.actual}
                onChange={(e) => setForm({ ...form, actual: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input type="password" className="input" value={form.nueva}
                onChange={(e) => setForm({ ...form, nueva: e.target.value })} />
            </div>
            <div>
              <label className="label">Confirmar nueva contraseña</label>
              <input type="password" className="input" value={form.confirmar}
                onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGuardar() }} />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={onCerrar} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando || !form.actual || !form.nueva}
                className="btn-primary flex-1">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [modalPassword, setModalPassword] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-gym-sidebar border-r border-gym-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gym-border flex items-center justify-center">
        <img
          src="/robert-gym-logo.png"
          alt="Robert Gym"
          className="w-[148px] h-auto drop-shadow-[0_0_12px_rgba(197,48,48,0.25)]"
        />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-gym-red text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Nuevo miembro CTA */}
      <div className="px-3 pb-3">
        <NavLink
          to="/miembros/nuevo"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm font-semibold hover:bg-gym-red hover:text-white transition-colors duration-150"
        >
          <span>+</span> Nuevo Miembro
        </NavLink>
      </div>

      {/* Admin info */}
      <div className="px-4 py-4 border-t border-gym-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gym-red/10 border border-gym-red/30 flex items-center justify-center text-xs font-bold text-gym-red">
            {admin?.nombre?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setModalPassword(true)}
              className="text-xs font-medium text-gray-700 truncate hover:text-gray-900 transition-colors block w-full text-left"
              title="Cambiar contraseña"
            >
              {admin?.nombre || 'Admin'}
            </button>
            <p className="text-[10px] text-gray-400">Administrador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
          >
            ⏻
          </button>
        </div>
      </div>

      {modalPassword && <ModalCambiarPassword onCerrar={() => setModalPassword(false)} />}
    </aside>
  )
}
