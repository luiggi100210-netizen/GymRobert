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
  { to: '/maquinas',   label: 'Máquinas',    icon: '🏋️' },
  { to: '/tienda',     label: 'Tienda',      icon: '🛍️' },
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
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
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

export default function Sidebar({ onCerrar }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [modalPassword, setModalPassword] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-gym-sidebar border-r border-gym-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-center border-b border-gym-sidebar-border relative">
        <img
          src="/robert-gym-logo.png"
          alt="Robert Gym"
          className="w-[140px] h-auto drop-shadow-[0_2px_8px_rgba(197,48,48,0.2)]"
        />
        {onCerrar && (
          <button
            onClick={onCerrar}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item'
            }
          >
            <span className="text-base w-5 text-center shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Nuevo miembro CTA */}
      <div className="px-3 pb-4">
        <NavLink
          to="/miembros/nuevo"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gym-red text-white text-sm font-semibold hover:bg-gym-red-dark transition-colors duration-150"
        >
          <span className="text-base">+</span> Nuevo Miembro
        </NavLink>
      </div>

      {/* Admin info */}
      <div className="px-4 py-4 border-t border-gym-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gym-red flex items-center justify-center text-xs font-bold text-white shrink-0">
            {admin?.nombre?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setModalPassword(true)}
              className="text-sm font-semibold text-slate-200 truncate hover:text-white transition-colors block w-full text-left"
              title="Cambiar contraseña"
            >
              {admin?.nombre || 'Admin'}
            </button>
            <p className="text-[11px] text-slate-500 font-medium">Administrador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-slate-500 hover:text-white transition-colors text-sm p-1 rounded-md hover:bg-white/10"
          >
            ⏻
          </button>
        </div>
      </div>

      {modalPassword && <ModalCambiarPassword onCerrar={() => setModalPassword(false)} />}
    </aside>
  )
}
