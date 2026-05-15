import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSensor } from './useSensor'

// VITE_SENSOR_MODE no definido → cae al default 'demo'

describe('useSensor (modo demo)', () => {
  let onToque

  beforeEach(() => {
    onToque = vi.fn()
  })

  it('llama onToque con FP-DEMO-001 al presionar Enter', () => {
    renderHook(() => useSensor({ onToque }))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(onToque).toHaveBeenCalledWith('FP-DEMO-001')
    expect(onToque).toHaveBeenCalledTimes(1)
  })

  it('llama onToque con FP-VENCIDO-999 al presionar d (minúscula)', () => {
    renderHook(() => useSensor({ onToque }))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
    })
    expect(onToque).toHaveBeenCalledWith('FP-VENCIDO-999')
  })

  it('llama onToque con FP-VENCIDO-999 al presionar D (mayúscula)', () => {
    renderHook(() => useSensor({ onToque }))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D' }))
    })
    expect(onToque).toHaveBeenCalledWith('FP-VENCIDO-999')
  })

  it('llama onToque con FP-DESCONOCIDO-000 al presionar x', () => {
    renderHook(() => useSensor({ onToque }))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
    })
    expect(onToque).toHaveBeenCalledWith('FP-DESCONOCIDO-000')
  })

  it('no llama onToque para teclas irrelevantes', () => {
    renderHook(() => useSensor({ onToque }))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onToque).not.toHaveBeenCalled()
  })

  it('usa siempre la última versión de onToque sin re-registrar el listener', () => {
    const onToque2 = vi.fn()
    const { rerender } = renderHook(({ cb }) => useSensor({ onToque: cb }), {
      initialProps: { cb: onToque },
    })

    rerender({ cb: onToque2 })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(onToque2).toHaveBeenCalledWith('FP-DEMO-001')
    expect(onToque).not.toHaveBeenCalled()
  })

  it('remueve el listener al desmontar', () => {
    const { unmount } = renderHook(() => useSensor({ onToque }))
    unmount()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(onToque).not.toHaveBeenCalled()
  })
})
