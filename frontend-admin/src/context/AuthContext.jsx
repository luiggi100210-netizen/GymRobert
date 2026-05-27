import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]   = useState(() => {
    const saved = localStorage.getItem('gym_admin')
    return saved ? JSON.parse(saved) : null
  })
  const [cargando, setCargando] = useState(false)

  const login = async (username, password) => {
    setCargando(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('gym_token', data.token)
      localStorage.setItem('gym_admin', JSON.stringify(data.admin))
      setAdmin(data.admin)
      return { ok: true }
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al iniciar sesión'
      return { ok: false, error: mensaje }
    } finally {
      setCargando(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Si falla igual cerramos sesión local
    }
    localStorage.removeItem('gym_token')
    localStorage.removeItem('gym_admin')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
