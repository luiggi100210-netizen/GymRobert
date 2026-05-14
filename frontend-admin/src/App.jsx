import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Miembros    from './pages/Miembros'
import NuevoMiembro from './pages/NuevoMiembro'
import Asistencia  from './pages/Asistencia'
import Pagos       from './pages/Pagos'
import Reportes    from './pages/Reportes'
import Planes         from './pages/Planes'
import MiembroDetalle from './pages/MiembroDetalle'

// Ruta protegida: redirige a login si no está autenticado
function PrivateRoute({ children }) {
  const { admin } = useAuth()
  return admin ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { admin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index          element={<Dashboard />} />
        <Route path="miembros"       element={<Miembros />} />
        <Route path="miembros/nuevo"  element={<NuevoMiembro />} />
        <Route path="miembros/:id"    element={<MiembroDetalle />} />
        <Route path="asistencia"     element={<Asistencia />} />
        <Route path="pagos"          element={<Pagos />} />
        <Route path="reportes"       element={<Reportes />} />
        <Route path="planes"         element={<Planes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
