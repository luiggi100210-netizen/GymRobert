import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../api/client', () => ({
  default: { post: vi.fn() },
}))

import api from '../api/client'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('inicia sin admin cuando localStorage está vacío', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.admin).toBeNull()
    expect(result.current.cargando).toBe(false)
  })

  it('restaura admin desde localStorage al montar', () => {
    const adminGuardado = { id: '1', username: 'admin', nombre: 'Admin' }
    localStorage.setItem('gym_admin', JSON.stringify(adminGuardado))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.admin.username).toBe('admin')
  })

  it('login exitoso guarda token en localStorage y actualiza estado', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'jwt-abc',
        admin: { id: '1', username: 'admin', nombre: 'Admin' },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let res
    await act(async () => {
      res = await result.current.login('admin', 'admin123')
    })

    expect(res.ok).toBe(true)
    expect(localStorage.getItem('gym_token')).toBe('jwt-abc')
    expect(result.current.admin.username).toBe('admin')
  })

  it('login fallido retorna ok: false con el mensaje del servidor', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Credenciales incorrectas' } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let res
    await act(async () => {
      res = await result.current.login('admin', 'mal')
    })

    expect(res.ok).toBe(false)
    expect(res.error).toBe('Credenciales incorrectas')
    expect(localStorage.getItem('gym_token')).toBeNull()
  })

  it('logout limpia localStorage y pone admin en null', async () => {
    localStorage.setItem('gym_token', 'jwt-abc')
    localStorage.setItem('gym_admin', JSON.stringify({ id: '1', username: 'admin' }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => { result.current.logout() })

    expect(localStorage.getItem('gym_token')).toBeNull()
    expect(localStorage.getItem('gym_admin')).toBeNull()
    expect(result.current.admin).toBeNull()
  })
})
