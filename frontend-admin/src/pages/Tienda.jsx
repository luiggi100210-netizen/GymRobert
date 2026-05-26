import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import Spinner from '../components/ui/Spinner'

const sol = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// Badge de stock
function StockBadge({ stock }) {
  if (stock === 0)   return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold border border-red-200">Sin stock</span>
  if (stock <= 5)    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">Stock bajo: {stock}</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">Stock: {stock}</span>
}

// Foto del producto con fallback
function FotoProducto({ url, nombre, className = '' }) {
  if (url) {
    return (
      <img
        src={url}
        alt={nombre}
        className={`object-contain ${className}`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div className={`flex items-center justify-center text-4xl bg-gray-50 ${className}`}>
      🛍️
    </div>
  )
}

// ── Modal vender ────────────────────────────────────────────────
function ModalVender({ producto, onCerrar, onVendido }) {
  const [cantidad, setCantidad] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(null)

  const total = parseFloat(producto.precio) * cantidad

  const handleVender = async () => {
    setError('')
    setGuardando(true)
    try {
      const { data } = await api.post('/tienda/ventas', {
        producto_id: producto.id,
        cantidad,
      })
      setExito(data)
      onVendido()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar venta')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {exito ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-5xl">✅</p>
            <p className="text-xl font-bold text-gray-900">¡Venta registrada!</p>
            <p className="text-gray-500 text-sm">
              {exito.venta.cantidad}× {producto.nombre}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600">{sol(exito.venta.total)}</p>
            <p className="text-xs text-gray-400">Stock restante: {exito.producto.stock}</p>
            <button onClick={onCerrar} className="mt-2 w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Header con foto */}
            <div className="relative h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100">
              <FotoProducto url={producto.foto_url} nombre={producto.nombre} className="h-full w-full" />
              <button
                onClick={onCerrar}
                className="absolute top-3 right-3 w-7 h-7 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{producto.nombre}</h2>
                <p className="text-gray-500 text-sm">{sol(producto.precio)} por unidad</p>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-10 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                    disabled={cantidad >= producto.stock}
                    className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-400 ml-1">máx. {producto.stock}</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Total</span>
                <span className="text-xl font-extrabold text-gray-900">{sol(total)}</span>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={onCerrar} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleVender}
                  disabled={guardando || producto.stock === 0}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Registrando...' : 'Confirmar venta'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Modal crear / editar producto ────────────────────────────────
function ModalProducto({ producto, onCerrar, onGuardado }) {
  const editando = !!producto
  const [form, setForm] = useState({
    nombre:   producto?.nombre   || '',
    precio:   producto?.precio   || '',
    stock:    producto?.stock    ?? '',
    foto_url: producto?.foto_url || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleGuardar = async () => {
    setError('')
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (form.precio === '' || isNaN(form.precio)) { setError('Precio inválido'); return }
    if (form.stock === '' || isNaN(form.stock))   { setError('Stock inválido');  return }
    setGuardando(true)
    try {
      if (editando) {
        await api.put(`/tienda/productos/${producto.id}`, form)
      } else {
        await api.post('/tienda/productos', form)
      }
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Preview foto */}
          {form.foto_url && (
            <div className="h-32 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center">
              <img src={form.foto_url} alt="preview" className="h-full w-full object-contain" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej: Proteína Whey 1kg"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Precio (S/)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                value={form.precio}
                onChange={(e) => set('precio', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">URL de foto <span className="normal-case text-gray-400 font-normal">(opcional)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              value={form.foto_url}
              onChange={(e) => set('foto_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal confirmar eliminación ──────────────────────────────────
function ModalEliminar({ producto, onCerrar, onEliminado }) {
  const [eliminando, setEliminando] = useState(false)

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await api.delete(`/tienda/productos/${producto.id}`)
      onEliminado()
      onCerrar()
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 space-y-4 text-center">
        <p className="text-4xl">🗑️</p>
        <p className="font-bold text-gray-900">¿Eliminar producto?</p>
        <p className="text-sm text-gray-500">"{producto.nombre}" no aparecerá más en la tienda.</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold">Cancelar</button>
          <button onClick={handleEliminar} disabled={eliminando} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            {eliminando ? '...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pestaña Productos ────────────────────────────────────────────
function TabProductos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando]   = useState(true)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalEditar, setModalEditar]   = useState(null)
  const [modalVender, setModalVender]   = useState(null)
  const [modalEliminar, setModalEliminar] = useState(null)

  const cargar = useCallback(() => {
    setCargando(true)
    api.get('/tienda/productos').then(({ data }) => setProductos(data)).finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const sinStock = productos.filter((p) => p.stock === 0).length
  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <div className="space-y-4">
      {/* Alertas de stock */}
      {(sinStock > 0 || stockBajo > 0) && (
        <div className="flex flex-wrap gap-2">
          {sinStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700">
              <span>⚠️</span>
              <span><strong>{sinStock}</strong> producto{sinStock > 1 ? 's' : ''} sin stock</span>
            </div>
          )}
          {stockBajo > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700">
              <span>⚠️</span>
              <span><strong>{stockBajo}</strong> con stock bajo (≤5)</span>
            </div>
          )}
        </div>
      )}

      {cargando ? <Spinner /> : productos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-medium">No hay productos aún</p>
          <p className="text-sm mt-1">Agrega tu primer producto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Foto */}
              <div className="h-36 bg-gray-50 flex items-center justify-center relative">
                {p.foto_url ? (
                  <>
                    <img src={p.foto_url} alt={p.nombre} className="h-full w-full object-contain" />
                    <div style={{ display: 'none' }} className="h-full w-full flex items-center justify-center text-4xl">🛍️</div>
                  </>
                ) : (
                  <span className="text-4xl">🛍️</span>
                )}
                {/* Botón eliminar */}
                <button
                  onClick={() => setModalEliminar(p)}
                  className="absolute top-2 right-2 w-6 h-6 bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-full text-gray-400 hover:text-red-500 text-xs flex items-center justify-center transition-colors"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1 gap-2">
                <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{p.nombre}</p>
                <p className="text-base font-extrabold text-gray-900">{sol(p.precio)}</p>
                <StockBadge stock={p.stock} />

                {/* Botones */}
                <div className="flex gap-1.5 mt-auto pt-1">
                  <button
                    onClick={() => setModalEditar(p)}
                    className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setModalVender(p)}
                    disabled={p.stock === 0}
                    className="flex-1 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-40"
                  >
                    Vender
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNuevo   && <ModalProducto onCerrar={() => setModalNuevo(false)}   onGuardado={cargar} />}
      {modalEditar  && <ModalProducto producto={modalEditar} onCerrar={() => setModalEditar(null)} onGuardado={cargar} />}
      {modalVender  && <ModalVender   producto={modalVender} onCerrar={() => setModalVender(null)} onVendido={cargar} />}
      {modalEliminar && <ModalEliminar producto={modalEliminar} onCerrar={() => setModalEliminar(null)} onEliminado={cargar} />}

      {/* FAB nuevo producto */}
      <button
        onClick={() => setModalNuevo(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black transition-colors text-2xl flex items-center justify-center z-10"
        title="Nuevo producto"
      >
        +
      </button>
    </div>
  )
}

// ── Pestaña Reportes ─────────────────────────────────────────────
function TabReportes() {
  const hoy = new Date()
  const [vista, setVista]   = useState('dia')
  const [mes, setMes]       = useState(hoy.getMonth() + 1)
  const [anio, setAnio]     = useState(hoy.getFullYear())
  const [datos, setDatos]   = useState(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(() => {
    setCargando(true)
    api.get('/tienda/reportes', { params: { vista, mes, anio } })
      .then(({ data }) => setDatos(data))
      .finally(() => setCargando(false))
  }, [vista, mes, anio])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { id: 'dia',    label: 'Hoy' },
          { id: 'semana', label: 'Esta semana' },
          { id: 'mes',    label: 'Por mes' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setVista(v.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              vista === v.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {v.label}
          </button>
        ))}
        {vista === 'mes' && (
          <div className="flex gap-2">
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => 2024 + i).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {cargando ? <Spinner /> : !datos ? null : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-gray-900">{datos.resumen.total_transacciones}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ventas</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-gray-900">{datos.resumen.total_unidades}</p>
              <p className="text-xs text-gray-500 mt-0.5">Unidades</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-emerald-600">{sol(datos.resumen.total_ingresos)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ingresos</p>
            </div>
          </div>

          {/* Top productos */}
          {datos.por_producto.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Productos vendidos</h3>
              <div className="space-y-3">
                {datos.por_producto.map((p, i) => {
                  const maxIngresos = datos.por_producto[0]?.ingresos || 1
                  const pct = (p.ingresos / maxIngresos) * 100
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {p.foto_url
                          ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-contain" />
                          : <span className="text-lg">🛍️</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-500 shrink-0 ml-2">{p.unidades} uds.</p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-gray-800 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-emerald-600 shrink-0 w-16 text-right">{sol(p.ingresos)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historial de ventas */}
          {datos.ventas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Sin ventas en este período</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <p className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Detalle de ventas</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 font-medium">Producto</th>
                      <th className="text-left px-4 py-3 font-medium">Cant.</th>
                      <th className="text-left px-4 py-3 font-medium">Precio</th>
                      <th className="text-left px-4 py-3 font-medium">Total</th>
                      <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.ventas.map((v) => (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                              {v.foto_url
                                ? <img src={v.foto_url} alt={v.producto_nombre} className="w-full h-full object-contain" />
                                : <span className="text-sm">🛍️</span>
                              }
                            </div>
                            <span className="font-medium text-gray-800">{v.producto_nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{v.cantidad}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{sol(v.precio_unitario)}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{sol(v.total)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(v.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────
const PESTANAS = ['Productos', 'Reportes']

export default function Tienda() {
  const [pestana, setPestana] = useState(0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tienda</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control de productos y ventas</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {PESTANAS.map((t, i) => (
          <button
            key={i}
            onClick={() => setPestana(i)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pestana === i
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {pestana === 0 && <TabProductos />}
      {pestana === 1 && <TabReportes />}
    </div>
  )
}
