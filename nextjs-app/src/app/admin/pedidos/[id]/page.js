'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

// Estados de pedido
const ESTADOS_PEDIDO = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
  en_gestion: { label: 'En Gestión', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmado: { label: 'Confirmado', color: 'bg-purple-100 text-purple-800', icon: '✅' },
  en_compra: { label: 'En Compra', color: 'bg-orange-100 text-orange-800', icon: '🛒' },
  en_transito: { label: 'En Tránsito', color: 'bg-cyan-100 text-cyan-800', icon: '✈️' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: '📦' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' }
}

// Estados de items
const ESTADOS_ITEM = {
  solicitado: { label: 'Solicitado', color: 'bg-gray-100 text-gray-800' },
  en_busqueda: { label: 'En Búsqueda', color: 'bg-yellow-100 text-yellow-800' },
  encontrado: { label: 'Encontrado', color: 'bg-green-100 text-green-800' },
  no_encontrado: { label: 'No Encontrado', color: 'bg-red-100 text-red-800' },
  comprado: { label: 'Comprado', color: 'bg-blue-100 text-blue-800' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
}

export default function DetallePedidoPage() {
  const router = useRouter()
  const params = useParams()
  const pedidoId = params.id

  const [pedido, setPedido] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Modal agregar item
  const [showModalItem, setShowModalItem] = useState(false)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosEncontrados, setProductosEncontrados] = useState([])
  const [buscandoProductos, setBuscandoProductos] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [nuevoItem, setNuevoItem] = useState({
    cantidad: 1,
    precio_venta_cop: '',
    talla: '',
    genero: '',
    descripcion_detallada: ''
  })

  // Modal editar fechas/estado
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [editarPedido, setEditarPedido] = useState({
    estado_pedido: '',
    fecha_probable_envio: '',
    fecha_entrega: '',
    notas_internas: ''
  })

  useEffect(() => {
    if (pedidoId) {
      checkAuth()
      cargarPedido()
      cargarItems()
    }
  }, [pedidoId])

  // Buscar productos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaProducto.trim().length >= 2) {
        buscarProductos()
      } else {
        setProductosEncontrados([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaProducto])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarPedido = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .eq('id', pedidoId)
        .single()

      if (error) throw error
      setPedido(data)
    } catch (error) {
      console.error('Error cargando pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pedido_items')
        .select(`
          *,
          producto:productos(id, titulo, imagenes, categoria)
        `)
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error cargando items:', error)
    }
  }

  const buscarProductos = async () => {
    setBuscandoProductos(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, titulo, precio_final_cop, costo_total_cop, imagenes, categoria, marca')
        .or(`titulo.ilike.%${busquedaProducto}%,marca.ilike.%${busquedaProducto}%`)
        .eq('estado', 'publicado')
        .limit(10)

      if (error) throw error
      setProductosEncontrados(data || [])
    } catch (error) {
      console.error('Error buscando productos:', error)
    } finally {
      setBuscandoProductos(false)
    }
  }

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto)
    setNuevoItem(prev => ({
      ...prev,
      precio_venta_cop: producto.precio_final_cop?.toString() || ''
    }))
    setBusquedaProducto('')
    setProductosEncontrados([])
  }

  const agregarItem = async () => {
    if (!productoSeleccionado && !busquedaProducto.trim()) {
      alert('Debe seleccionar un producto o ingresar un título')
      return
    }

    if (!nuevoItem.precio_venta_cop) {
      alert('El precio de venta es requerido')
      return
    }

    setActionLoading(true)
    try {
      const precioVenta = parseFloat(nuevoItem.precio_venta_cop)
      const costoCop = productoSeleccionado?.costo_total_cop || 0
      const cantidad = parseInt(nuevoItem.cantidad) || 1

      const itemData = {
        pedido_id: pedidoId,
        producto_id: productoSeleccionado?.id || null,
        lista_oferta_id: pedido.lista_oferta_id || null,
        titulo_articulo: productoSeleccionado?.titulo || busquedaProducto.trim(),
        cantidad: cantidad,
        precio_venta_cop: precioVenta,
        costo_cop: costoCop,
        ganancia_cop: (precioVenta - costoCop) * cantidad,
        fue_encontrado: false,
        talla: nuevoItem.talla.trim() || null,
        genero: nuevoItem.genero || null,
        descripcion_detallada: nuevoItem.descripcion_detallada.trim() || null,
        estado_item: 'solicitado'
      }

      const { error } = await supabase
        .from('pedido_items')
        .insert([itemData])

      if (error) throw error

      // Recargar items y recalcular totales
      await cargarItems()
      await recalcularTotales()
      
      // Resetear modal
      setShowModalItem(false)
      setProductoSeleccionado(null)
      setBusquedaProducto('')
      setNuevoItem({
        cantidad: 1,
        precio_venta_cop: '',
        talla: '',
        genero: '',
        descripcion_detallada: ''
      })
    } catch (error) {
      alert('Error al agregar item: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleFueEncontrado = async (item) => {
    try {
      const nuevoValor = !item.fue_encontrado
      const nuevoEstado = nuevoValor ? 'encontrado' : 'solicitado'

      const { error } = await supabase
        .from('pedido_items')
        .update({ 
          fue_encontrado: nuevoValor,
          estado_item: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      if (error) throw error
      await cargarItems()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const eliminarItem = async (item) => {
    const confirmar = window.confirm(`¿Eliminar "${item.titulo_articulo}" del pedido?`)
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('pedido_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      await cargarItems()
      await recalcularTotales()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const recalcularTotales = async () => {
    try {
      const { data: itemsActuales } = await supabase
        .from('pedido_items')
        .select('cantidad, precio_venta_cop, costo_cop')
        .eq('pedido_id', pedidoId)

      const totales = (itemsActuales || []).reduce((acc, item) => {
        const cant = item.cantidad || 1
        return {
          total_items: acc.total_items + cant,
          total_venta_cop: acc.total_venta_cop + (item.precio_venta_cop * cant),
          total_costo_cop: acc.total_costo_cop + (item.costo_cop * cant)
        }
      }, { total_items: 0, total_venta_cop: 0, total_costo_cop: 0 })

      totales.total_ganancia_cop = totales.total_venta_cop - totales.total_costo_cop

      const { error } = await supabase
        .from('pedidos')
        .update({
          ...totales,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (error) throw error
      await cargarPedido()
    } catch (error) {
      console.error('Error recalculando totales:', error)
    }
  }

  const abrirModalEditar = () => {
    setEditarPedido({
      estado_pedido: pedido.estado_pedido || 'nuevo',
      fecha_probable_envio: pedido.fecha_probable_envio?.split('T')[0] || '',
      fecha_entrega: pedido.fecha_entrega?.split('T')[0] || '',
      notas_internas: pedido.notas_internas || ''
    })
    setShowModalEditar(true)
  }

  const guardarCambiosPedido = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          estado_pedido: editarPedido.estado_pedido,
          fecha_probable_envio: editarPedido.fecha_probable_envio || null,
          fecha_entrega: editarPedido.fecha_entrega || null,
          notas_internas: editarPedido.notas_internas.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (error) throw error
      await cargarPedido()
      setShowModalEditar(false)
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatearCOP = (valor) => {
    if (!valor) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return 'Sin cliente'
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : cliente.telefono
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutrals-graySoft">Cargando pedido...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!pedido) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-neutrals-graySoft">Pedido no encontrado</p>
          <Link href="/admin/pedidos" className="btn-primary mt-4">
            Volver a Pedidos
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const estadoInfo = ESTADOS_PEDIDO[pedido.estado_pedido] || ESTADOS_PEDIDO.nuevo

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/pedidos"
                className="p-2 hover:bg-neutrals-grayBg rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutrals-grayStrong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-semibold text-neutrals-black">
                    {pedido.codigo_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                    {estadoInfo.icon} {estadoInfo.label}
                  </span>
                </div>
                <p className="text-neutrals-graySoft text-sm">
                  Creado el {formatearFecha(pedido.created_at)}
                </p>
              </div>
            </div>

            <button
              onClick={abrirModalEditar}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Pedido
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Info del pedido */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta Cliente */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>👤</span> Cliente
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white font-semibold">
                  {(pedido.cliente?.nombres?.[0] || pedido.cliente?.telefono?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-neutrals-black">
                    {getNombreCliente(pedido.cliente)}
                  </p>
                  <a 
                    href={`https://wa.me/${pedido.cliente?.telefono?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-elegant hover:underline"
                  >
                    {pedido.cliente?.telefono}
                  </a>
                </div>
              </div>
            </div>

            {/* Tarjeta Fechas */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>📅</span> Fechas
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Solicitud:</span>
                  <span className="font-medium">{formatearFecha(pedido.fecha_solicitud)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Envío aprox:</span>
                  <span className={pedido.fecha_probable_envio ? 'font-medium' : 'text-neutrals-graySoft'}>
                    {formatearFecha(pedido.fecha_probable_envio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-graySoft">Entrega:</span>
                  <span className={pedido.fecha_entrega ? 'font-medium text-green-600' : 'text-neutrals-graySoft'}>
                    {formatearFecha(pedido.fecha_entrega)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta Totales */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-neutrals-black mb-4 flex items-center gap-2">
                <span>💰</span> Totales
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Items:</span>
                  <span className="font-medium">{pedido.total_items || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Costo:</span>
                  <span className="font-medium">{formatearCOP(pedido.total_costo_cop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutrals-graySoft">Venta:</span>
                  <span className="font-semibold text-lg">{formatearCOP(pedido.total_venta_cop)}</span>
                </div>
                <div className="pt-3 border-t border-neutrals-grayBorder">
                  <div className="flex justify-between">
                    <span className="text-neutrals-graySoft">Ganancia:</span>
                    <span className={`font-bold text-lg ${pedido.total_ganancia_cop >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearCOP(pedido.total_ganancia_cop)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {pedido.notas_internas && (
              <div className="card-premium p-5">
                <h3 className="font-semibold text-neutrals-black mb-3 flex items-center gap-2">
                  <span>📝</span> Notas
                </h3>
                <p className="text-sm text-neutrals-grayStrong whitespace-pre-wrap">
                  {pedido.notas_internas}
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha - Items del pedido */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              {/* Header Items */}
              <div className="flex items-center justify-between p-5 border-b border-neutrals-grayBorder">
                <h3 className="font-semibold text-neutrals-black flex items-center gap-2">
                  <span>📦</span> Artículos ({items.length})
                </h3>
                <button
                  onClick={() => setShowModalItem(true)}
                  className="btn-primary btn-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar
                </button>
              </div>

              {/* Lista de Items */}
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutrals-grayBg rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-neutrals-graySoft mb-4">No hay artículos en este pedido</p>
                  <button
                    onClick={() => setShowModalItem(true)}
                    className="btn-primary"
                  >
                    Agregar Primer Artículo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutrals-grayBorder">
                  {items.map((item) => {
                    const estadoItem = ESTADOS_ITEM[item.estado_item] || ESTADOS_ITEM.solicitado
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-neutrals-grayBg/30 transition-colors">
                        <div className="flex gap-4">
                          {/* Imagen */}
                          <div className="w-16 h-16 rounded-lg bg-neutrals-grayBg flex-shrink-0 overflow-hidden">
                            {item.producto?.imagenes?.[0] ? (
                              <img 
                                src={item.producto.imagenes[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-neutrals-black line-clamp-1">
                                  {item.titulo_articulo}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-neutrals-graySoft">
                                  {item.cantidad > 1 && <span>Cant: {item.cantidad}</span>}
                                  {item.talla && <span>• Talla: {item.talla}</span>}
                                  {item.genero && <span>• {item.genero}</span>}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoItem.color}`}>
                                {estadoItem.label}
                              </span>
                            </div>

                            {/* Precios */}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-neutrals-graySoft">
                                Costo: {formatearCOP(item.costo_cop)}
                              </span>
                              <span className="font-semibold text-neutrals-black">
                                Venta: {formatearCOP(item.precio_venta_cop)}
                              </span>
                              {item.ganancia_cop > 0 && (
                                <span className="text-green-600 text-xs">
                                  +{formatearCOP(item.ganancia_cop)}
                                </span>
                              )}
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={() => toggleFueEncontrado(item)}
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                  item.fue_encontrado
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-neutrals-grayBg text-neutrals-graySoft hover:bg-neutrals-grayBorder'
                                }`}
                              >
                                {item.fue_encontrado ? '✅ Encontrado' : '🔍 Marcar encontrado'}
                              </button>
                              <button
                                onClick={() => eliminarItem(item)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Agregar Item */}
      {showModalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder sticky top-0 bg-white">
              <h3 className="font-display text-lg font-semibold">Agregar Artículo</h3>
              <button onClick={() => { setShowModalItem(false); setProductoSeleccionado(null); setBusquedaProducto(''); }}>
                <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Buscar producto */}
              {!productoSeleccionado ? (
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Buscar Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      className="input-chic pl-10"
                      placeholder="Nombre del producto o artículo..."
                    />
                    <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Resultados */}
                  {productosEncontrados.length > 0 && (
                    <div className="mt-2 border border-neutrals-grayBorder rounded-xl max-h-60 overflow-y-auto">
                      {productosEncontrados.map((producto) => (
                        <button
                          key={producto.id}
                          onClick={() => seleccionarProducto(producto)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-neutrals-grayBg transition-colors text-left border-b last:border-b-0"
                        >
                          <div className="w-12 h-12 rounded-lg bg-neutrals-grayBg overflow-hidden">
                            {producto.imagenes?.[0] ? (
                              <img src={producto.imagenes[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutrals-black truncate">{producto.titulo}</p>
                            <p className="text-sm text-neutrals-graySoft">
                              {formatearCOP(producto.precio_final_cop)}
                              {producto.marca && ` • ${producto.marca}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-neutrals-graySoft mt-2">
                    💡 Puedes buscar un producto o escribir directamente el nombre del artículo
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white overflow-hidden">
                        {productoSeleccionado.imagenes?.[0] ? (
                          <img src={productoSeleccionado.imagenes[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutrals-black">{productoSeleccionado.titulo}</p>
                        <p className="text-sm text-neutrals-graySoft">
                          Costo: {formatearCOP(productoSeleccionado.costo_total_cop)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProductoSeleccionado(null)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad: e.target.value }))}
                    className="input-chic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Precio Venta (COP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={nuevoItem.precio_venta_cop}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, precio_venta_cop: e.target.value }))}
                    className="input-chic"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Talla y Género */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Talla
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.talla}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, talla: e.target.value }))}
                    className="input-chic"
                    placeholder="M, L, 42, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Género
                  </label>
                  <select
                    value={nuevoItem.genero}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, genero: e.target.value }))}
                    className="input-chic"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                    <option value="unisex">Unisex</option>
                    <option value="nino">Niño</option>
                    <option value="nina">Niña</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Descripción Detallada
                </label>
                <textarea
                  value={nuevoItem.descripcion_detallada}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, descripcion_detallada: e.target.value }))}
                  rows={2}
                  className="input-chic resize-none"
                  placeholder="Color, características especiales, etc."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowModalItem(false); setProductoSeleccionado(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarItem}
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Agregando...' : 'Agregar Artículo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pedido */}
      {showModalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-premium max-w-md w-full">
            <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder">
              <h3 className="font-display text-lg font-semibold">Editar Pedido</h3>
              <button onClick={() => setShowModalEditar(false)}>
                <svg className="w-6 h-6 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Estado del Pedido
                </label>
                <select
                  value={editarPedido.estado_pedido}
                  onChange={(e) => setEditarPedido(prev => ({ ...prev, estado_pedido: e.target.value }))}
                  className="input-chic"
                >
                  {Object.entries(ESTADOS_PEDIDO).map(([key, { label, icon }]) => (
                    <option key={key} value={key}>{icon} {label}</option>
                  ))}
                </select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Fecha Envío Aprox.
                  </label>
                  <input
                    type="date"
                    value={editarPedido.fecha_probable_envio}
                    onChange={(e) => setEditarPedido(prev => ({ ...prev, fecha_probable_envio: e.target.value }))}
                    className="input-chic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                    Fecha Entrega
                  </label>
                  <input
                    type="date"
                    value={editarPedido.fecha_entrega}
                    onChange={(e) => setEditarPedido(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                    className="input-chic"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-neutrals-grayStrong mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={editarPedido.notas_internas}
                  onChange={(e) => setEditarPedido(prev => ({ ...prev, notas_internas: e.target.value }))}
                  rows={3}
                  className="input-chic resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModalEditar(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCambiosPedido}
                  disabled={actionLoading}
                  className="flex-1 btn-primary"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
