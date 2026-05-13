// Cliente axios con interceptores de autenticación
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Adjuntar token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el servidor devuelve 401/403, cerrar sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('gym_token')
      localStorage.removeItem('gym_admin')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
