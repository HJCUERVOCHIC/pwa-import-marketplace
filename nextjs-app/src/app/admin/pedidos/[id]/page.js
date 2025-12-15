'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ESTADOS_PEDIDO = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-gray-100 text-gray-700' },
  { value: 'en_gestion', label: 'En gestión', color: 'bg-blue-100 text-blue-700' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'en_compra', label: 'En compra', color: 'bg-orange-100 text-orange-700' },
  { value: 'en_transito', label: 'En tránsito', color: 'bg-amber-100 text-amber-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' }
]

const ESTADOS_ITEM = [
  { value: 'solicitado', label: 'Solicitado', color: 'bg-gray-100 text-gray-700' },
  { value: 'en_busqueda', label: 'En búsqueda', color: 'bg-blue-100 text-blue-700' },
  { value: 'encontrado', label: 'Encontrado', color: 'bg-green-100 text-green-700' },
  { value: 'no_encontrado', label: 'No encontrado', color: 'bg-red-100 text-red-700' },
  { value: 'comprado', label: 'Comprado', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-200 text-gray-600' }
]

const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referido', label: 'Referido' },
  { value: 'otro', label: 'Otro' }
]

const GENEROS = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'ninos', label: 'Niños' }
]

export default function DetallePedidoPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [pedido, setPedido] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal agregar artículo
  const [showModalItem, setShowModalItem] = useState(false)
  const [itemEditando, setItemEditando] = useState(null)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosEncontrados, setProductosEncontrados] = useState([])
  const [buscandoProductos, setBuscandoProductos] = useState(false)
  
  const [nuevoItem, setNuevoItem] = useState({
    producto_id: null,
    lista_oferta_id: null,
    titulo_articulo: '',
    cantidad: 1,
    precio_venta_cop: 0,
    costo_cop: 0,
    talla: '',
    genero: '',
    descripcion_detallada: '',
    estado_item: 'solicitado',
    fue_encontrado: false
  })

  useEffect(() => {
    cargarPedido()
    cargarItems()
  }, [id])

  // Buscar productos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaProducto.length >= 2) {
        buscarProductos()
      } else {
        setProductosEncontrados([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaProducto])

  const cargarPedido = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      alert('Error al cargar pedido')
      router.push('/admin/pedidos')
      return
    }
    
    setPedido(data)
    setLoading(false)
  }

  const cargarItems = async () => {
    const { data, error } = await supabase
      .from('pedido_items')
      .select('*')
      .eq('pedido_id', id)
      .order('created_at', { ascending: true })
    
    if (!error) {
      setItems(data || [])
    }
  }

  const buscarProductos = async () => {
    setBuscandoProductos(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*, listas_oferta(titulo)')
      .or(`titulo.ilike.%${busquedaProducto}%,marca.ilike.%${busquedaProducto}%`)
      .eq('estado', 'publicado')
      .limit(10)
    
    if (!error) {
      setProductosEncontrados(data || [])
    }
    setBuscandoProductos(false)
  }

  const seleccionarProducto = (producto) => {
    setNuevoItem({
      ...nuevoItem,
      producto_id: producto.id,
      lista_oferta_id: producto.id_lista,
      titulo_articulo: producto.titulo,
      precio_venta_cop: producto.precio_final_cop || 0,
      costo_cop: producto.costo_total_cop || 0
    })
    setBusquedaProducto('')
    setProductosEncontrados([])
  }

  const actualizarPedido = async (campo, valor) => {
    setSaving(true)
    const { error } = await supabase
      .from('pedidos')
      .update({ [campo]: valor })
      .eq('id', id)
    
    if (error) {
      alert('Error al actualizar: ' + error.message)
    } else {
      setPedido(prev => ({ ...prev, [campo]: valor }))
    }
    setSaving(false)
  }

  const handleChangeItem = (e) => {
    const { name, value, type, checked } = e.target
    setNuevoItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const abrirModalNuevoItem = () => {
    setItemEditando(null)
    setNuevoItem({
      producto_id: null,
      lista_oferta_id: null,
      titulo_articulo: '',
      cantidad: 1,
      precio_venta_cop: 0,
      costo_cop: 0,
      talla: '',
      genero: '',
      descripcion_detallada: '',
      estado_item: 'solicitado',
      fue_encontrado: false
    })
    setBusquedaProducto('')
    setShowModalItem(true)
  }

  const abrirModalEditarItem = (item) => {
    setItemEditando(item)
    setNuevoItem({
      producto_id: item.producto_id,
      lista_oferta_id: item.lista_oferta_id,
      titulo_articulo: item.titulo_articulo,
      cantidad: item.cantidad,
      precio_venta_cop: item.precio_venta_cop,
      costo_cop: item.costo_cop,
      talla: item.talla || '',
      genero: item.genero || '',
      descripcion_detallada: item.descripcion_detallada || '',
      estado_item: item.estado_item || 'solicitado',
      fue_encontrado: item.fue_encontrado || false
    })
    setShowModalItem(true)
  }

  const guardarItem = async (e) => {
    e.preventDefault()
    
    if (!nuevoItem.titulo_articulo.trim()) {
      alert('El título del artículo es obligatorio')
      return
    }
    
    setSaving(true)
    
    try {
      if (itemEditando) {
        // Actualizar
        const { error } = await supabase
          .from('pedido_items')
          .update({
            producto_id: nuevoItem.producto_id,
            lista_oferta_id: nuevoItem.lista_oferta_id,
            titulo_articulo: nuevoItem.titulo_articulo,
            cantidad: parseInt(nuevoItem.cantidad) || 1,
            precio_venta_cop: parseFloat(nuevoItem.precio_venta_cop) || 0,
            costo_cop: parseFloat(nuevoItem.costo_cop) || 0,
            talla: nuevoItem.talla || null,
            genero: nuevoItem.genero || null,
            descripcion_detallada: nuevoItem.descripcion_detallada || null,
            estado_item: nuevoItem.estado_item,
            fue_encontrado: nuevoItem.fue_encontrado
          })
          .eq('id', itemEditando.id)
        
        if (error) throw error
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('pedido_items')
          .insert({
            pedido_id: id,
            producto_id: nuevoItem.producto_id,
            lista_oferta_id: nuevoItem.lista_oferta_id,
            titulo_articulo: nuevoItem.titulo_articulo,
            cantidad: parseInt(nuevoItem.cantidad) || 1,
            precio_venta_cop: parseFloat(nuevoItem.precio_venta_cop) || 0,
            costo_cop: parseFloat(nuevoItem.costo_cop) || 0,
            talla: nuevoItem.talla || null,
            genero: nuevoItem.genero || null,
            descripcion_detallada: nuevoItem.descripcion_detallada || null,
            estado_item: nuevoItem.estado_item,
            fue_encontrado: nuevoItem.fue_encontrado
          })
        
        if (error) throw error
      }
      
      setShowModalItem(false)
      cargarItems()
      cargarPedido() // Recargar totales
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminarItem = async (item) => {
    if (!confirm(`¿Eliminar "${item.titulo_articulo}"?`)) return
    
    const { error } = await supabase
      .from('pedido_items')
      .delete()
      .eq('id', item.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      cargarItems()
      cargarPedido()
    }
  }

  const toggleEncontrado = async (item) => {
    const { error } = await supabase
      .from('pedido_items')
      .update({ fue_encontrado: !item.fue_encontrado })
      .eq('id', item.id)
    
    if (!error) {
      cargarItems()
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const getEstadoInfo = (estado, lista) => {
    return lista.find(e => e.value === estado) || lista[0]
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return 'Sin cliente'
    if (cliente.alias_whatsapp) return cliente.alias_whatsapp
    if (cliente.nombres || cliente.apellidos) {
      return [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ')
    }
    return cliente.telefono
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (!pedido) {
    return null
  }

  const estadoPedidoInfo = getEstadoInfo(pedido.estado_pedido, ESTADOS_PEDIDO)
  const itemsEncontrados = items.filter(i => i.fue_encontrado).length
  const itemsPendientes = items.length - itemsEncontrados

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/pedidos"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-blue-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {pedido.codigo_pedido}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Cliente: {getNombreCliente(pedido.clientes)} • {pedido.clientes?.telefono}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pedido.estado_pedido}
                onChange={(e) => actualizarPedido('estado_pedido', e.target.value)}
                className={`px-4 py-2 rounded-lg font-medium border-0 focus:ring-2 focus:ring-blue-500 ${estadoPedidoInfo.color}`}
              >
                {ESTADOS_PEDIDO.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna izquierda - Info pedido y cliente */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card Fechas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Fechas del pedido</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha solicitud</label>
                  <p className="text-gray-900">{formatearFecha(pedido.fecha_solicitud)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha probable envío</label>
                  <input
                    type="date"
                    value={pedido.fecha_probable_envio ? pedido.fecha_probable_envio.split('T')[0] : ''}
                    onChange={(e) => actualizarPedido('fecha_probable_envio', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha entrega</label>
                  <input
                    type="date"
                    value={pedido.fecha_entrega ? pedido.fecha_entrega.split('T')[0] : ''}
                    onChange={(e) => {
                      actualizarPedido('fecha_entrega', e.target.value || null)
                      if (e.target.value) {
                        actualizarPedido('estado_pedido', 'entregado')
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Card Resumen económico */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen económico</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total items</span>
                  <span className="font-semibold text-gray-900 bg-blue-100 px-2 py-0.5 rounded">
                    {pedido.total_items || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total venta</span>
                  <span className="font-semibold text-blue-800 text-lg">{formatearCOP(pedido.total_venta_cop)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total costo</span>
                  <span className="text-gray-700">{formatearCOP(pedido.total_costo_cop)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-500">Ganancia</span>
                  <span className="font-bold text-green-600 text-lg">{formatearCOP(pedido.total_ganancia_cop)}</span>
                </div>
              </div>
            </div>

            {/* Card Cliente */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información del cliente</h3>
              
              {pedido.clientes && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                    <p className="text-gray-900 font-medium text-lg">{pedido.clientes.telefono}</p>
                  </div>
                  
                  {(pedido.clientes.nombres || pedido.clientes.apellidos) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                      <p className="text-gray-900">
                        {[pedido.clientes.nombres, pedido.clientes.apellidos].filter(Boolean).join(' ')}
                      </p>
                    </div>
                  )}
                  
                  {pedido.clientes.alias_whatsapp && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Alias WhatsApp</label>
                      <p className="text-gray-900">{pedido.clientes.alias_whatsapp}</p>
                    </div>
                  )}
                  
                  {pedido.clientes.canal_preferido && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Canal preferido</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {pedido.clientes.canal_preferido}
                      </span>
                    </div>
                  )}
                  
                  {pedido.clientes.notas && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
                      <p className="text-gray-600 text-sm italic">"{pedido.clientes.notas}"</p>
                    </div>
                  )}
                  
                  <Link
                    href={`/admin/clientes?busqueda=${pedido.clientes.telefono}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Ver ficha de cliente
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Canal entrada */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-xs font-medium text-gray-500 mb-2">Canal de entrada</label>
              <select
                value={pedido.canal_entrada || ''}
                onChange={(e) => actualizarPedido('canal_entrada', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {CANALES.map(canal => (
                  <option key={canal.value} value={canal.value}>{canal.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Columna derecha - Artículos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              {/* Header artículos */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Artículos del pedido</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {items.length} artículos ({itemsEncontrados} encontrados, {itemsPendientes} pendientes)
                    </p>
                  </div>
                  <button
                    onClick={abrirModalNuevoItem}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar artículo
                  </button>
                </div>
              </div>

              {/* Lista de artículos */}
              {items.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Sin artículos</h4>
                  <p className="text-gray-500 text-sm mb-4">Agrega artículos a este pedido</p>
                  <button
                    onClick={abrirModalNuevoItem}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar primer artículo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const estadoItemInfo = getEstadoInfo(item.estado_item, ESTADOS_ITEM)
                    const gananciaItem = (item.precio_venta_cop - item.costo_cop) * item.cantidad
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          {/* Toggle encontrado */}
                          <button
                            onClick={() => toggleEncontrado(item)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.fue_encontrado 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {item.fue_encontrado && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          
                          {/* Info del item */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.titulo_articulo}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {item.talla && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                      Talla: {item.talla}
                                    </span>
                                  )}
                                  {item.genero && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                                      {item.genero}
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${estadoItemInfo.color}`}>
                                    {estadoItemInfo.label}
                                  </span>
                                </div>
                                {item.descripcion_detallada && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.descripcion_detallada}</p>
                                )}
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-blue-800">{formatearCOP(item.precio_venta_cop)}</p>
                                <p className="text-xs text-gray-500">Costo: {formatearCOP(item.costo_cop)}</p>
                                <p className="text-xs text-green-600 font-medium">+{formatearCOP(gananciaItem)}</p>
                              </div>
                            </div>
                            
                            {/* Cantidad y acciones */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Cantidad:</span>
                                <span className="font-medium">{item.cantidad}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => abrirModalEditarItem(item)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => eliminarItem(item)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Eliminar
                                </button>
                              </div>
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
      </div>

      {/* Modal Agregar/Editar Item */}
      {showModalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                {itemEditando ? 'Editar artículo' : 'Agregar artículo'}
              </h2>
            </div>
            
            <form onSubmit={guardarItem} className="p-6 space-y-6">
              {/* Buscador de productos */}
              {!itemEditando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar producto (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o marca..."
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {buscandoProductos && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800"></div>
                      </div>
                    )}
                  </div>
                  
                  {productosEncontrados.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {productosEncontrados.map((producto) => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() => seleccionarProducto(producto)}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">{producto.titulo}</p>
                          <p className="text-sm text-gray-500">
                            {producto.marca && `${producto.marca} • `}
                            {formatearCOP(producto.precio_final_cop)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Puedes buscar un producto existente o ingresar los datos manualmente
                  </p>
                </div>
              )}

              {/* Datos del artículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del artículo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titulo_articulo"
                  value={nuevoItem.titulo_articulo}
                  onChange={handleChangeItem}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    name="cantidad"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={handleChangeItem}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Talla</label>
                  <input
                    type="text"
                    name="talla"
                    value={nuevoItem.talla}
                    onChange={handleChangeItem}
                    placeholder="M, L, 8 US..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta (COP)</label>
                  <input
                    type="number"
                    name="precio_venta_cop"
                    min="0"
                    value={nuevoItem.precio_venta_cop}
                    onChange={handleChangeItem}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo (COP)</label>
                  <input
                    type="number"
                    name="costo_cop"
                    min="0"
                    value={nuevoItem.costo_cop}
                    onChange={handleChangeItem}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <select
                    name="genero"
                    value={nuevoItem.genero}
                    onChange={handleChangeItem}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {GENEROS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    name="estado_item"
                    value={nuevoItem.estado_item}
                    onChange={handleChangeItem}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ESTADOS_ITEM.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
                <textarea
                  name="descripcion_detallada"
                  value={nuevoItem.descripcion_detallada}
                  onChange={handleChangeItem}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Color, especificaciones, notas..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="fue_encontrado"
                  id="fue_encontrado"
                  checked={nuevoItem.fue_encontrado}
                  onChange={handleChangeItem}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="fue_encontrado" className="text-sm text-gray-700">
                  Artículo encontrado
                </label>
              </div>

              {/* Ganancia calculada */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ganancia por unidad:</span>
                  <span className="font-semibold text-green-600">
                    {formatearCOP(nuevoItem.precio_venta_cop - nuevoItem.costo_cop)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Ganancia total:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatearCOP((nuevoItem.precio_venta_cop - nuevoItem.costo_cop) * nuevoItem.cantidad)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalItem(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
