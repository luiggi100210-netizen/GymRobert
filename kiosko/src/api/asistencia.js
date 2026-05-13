// Cliente para el endpoint del kiosco
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

/**
 * Registra un toque biométrico y retorna el resultado del servidor.
 * @param {string} huellaId  - ID del sensor biométrico
 * @returns {Promise<object>} - { estado, miembro, membresia, asistencia, motivo? }
 */
export async function registrarToque(huellaId) {
  const { data } = await api.post('/asistencia/toque', { huella_id: huellaId })
  return data
}
