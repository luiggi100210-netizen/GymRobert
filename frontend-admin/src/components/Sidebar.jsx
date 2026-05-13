import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           label: 'Dashboard',   icon: '⊞',  exact: true },
  { to: '/miembros',   label: 'Miembros',    icon: '👥' },
  { to: '/asistencia', label: 'Asistencia',  icon: '📋' },
  { to: '/pagos',      label: 'Pagos',       icon: '💰' },
  { to: '/reportes',   label: 'Reportes',    icon: '📊' },
  { to: '/planes',     label: 'Planes',      icon: '🏷️' },
]

export default function Sidebar() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-gym-sidebar border-r border-gym-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gym-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gym-red rounded-lg flex items-center justify-center text-lg font-bold">
            R
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">ROBERT GYM</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Club Fitness</p>
          </div>
        </div>
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
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gym-red/10 border border-gym-red/30 text-gym-red-light text-sm font-semibold hover:bg-gym-red hover:text-white transition-colors duration-150"
        >
          <span>+</span> Nuevo Miembro
        </NavLink>
      </div>

      {/* Admin info */}
      <div className="px-4 py-4 border-t border-gym-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gym-red/20 border border-gym-red/40 flex items-center justify-center text-xs font-bold text-gym-red-light">
            {admin?.nombre?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">{admin?.nombre || 'Admin'}</p>
            <p className="text-[10px] text-gray-600">Administrador</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-gray-600 hover:text-gray-300 transition-colors text-sm"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
