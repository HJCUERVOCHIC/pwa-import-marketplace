'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Modal para agregar un producto a un pedido
 * 
 * REGLAS IMPORTANTES (NO NEGOCIABLES):
 * - Solo productos con estado = 'publicado'
 * - Solo productos de listas con estado = 'publicada'
 * - Los valores se guardan como SNAPSHOT (no cambian si el producto se edita)
 * - NO se permiten pedidos sin cliente
 * - NO se permiten items sin producto_id
 */

// Estados de pedido permitidos para agregar items
const ESTADOS_PEDIDO_PERMITIDOS = ['nuevo', 'en_gestion', 'confirmado']

export default function ModalAgregarAPedido({ 
  isOpen, 
  onClose, 
  producto, 
  lista,
  onSuccess 
}) {
  const [paso, setPaso] = useState(1) // 1: Seleccionar pedido, 2: Crear nuevo pedido
  const [loading, setLoading] = useState(false)
  const [pedidosDisponibles, setPedidosDisponibles] = useState([])
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [buscandoPedidos, setBuscandoPedidos] = useState(true)
  const [busquedaPedido, setBusquedaPedido] = useState('') // Búsqueda de pedidos
  
  // Para crear nuevo pedido
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ telefono: '', nombres: '', apellidos: '' })
  const [errorCliente, setErrorCliente] = useState('')

  // Validación inicial
  const [errorValidacion, setErrorValidacion] = useState(null)

  useEffect(() => {
    if (isOpen && producto && lista) {
      validarProductoYLista()
      cargarPedidosDisponibles()
    }
  }, [isOpen, producto, lista])

  // Buscar pedidos cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && producto && lista) {
        cargarPedidosDisponibles(busquedaPedido)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaPedido])

  // Buscar clientes cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaCliente.trim().length >= 2) {
        buscarClientes()
      } else {
        setClientesEncontrados([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaCliente])

  /**
   * VALIDACIÓN OBLIGATORIA
   * Verificar que el producto y la lista cumplan los requisitos
   */
  const validarProductoYLista = () => {
    setErrorValidacion(null)

    // Validar que el producto existe
    if (!producto || !producto.id) {
      setErrorValidacion('El producto no existe o no es válido.')
      return false
    }

    // Validar estado del producto
    if (producto.estado !== 'publicado') {
      setErrorValidacion('Solo se pueden agregar productos con estado "publicado".')
      return false
    }

    // Validar que la lista existe
    if (!lista || !lista.id) {
      setErrorValidacion('La lista no existe o no es válida.')
      return false
    }

    // Validar estado de la lista
    if (lista.estado !== 'publicada') {
      setErrorValidacion('Solo se pueden agregar productos de listas "publicadas".')
      return false
    }

    return true
  }

  const cargarPedidosDisponibles = async (termino = '') => {
    setBuscandoPedidos(true)
    try {
      // Traer todos los pedidos activos (el filtro se aplica en frontend para incluir datos del cliente)
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          codigo_pedido,
          estado_pedido,
          created_at,
          total_items,
          cliente:clientes(id, telefono, nombres, apellidos)
        `)
        .in('estado_pedido', ESTADOS_PEDIDO_PERMITIDOS)
        .order('created_at', { ascending: false })
        .limit(100) // Traer más para poder filtrar

      if (error) throw error
      
      let resultados = data || []
      
      // Filtrar en frontend si hay término de búsqueda
      if (termino.trim()) {
        const terminoLower = termino.trim().toLowerCase()
        resultados = resultados.filter(pedido => {
          const codigoMatch = pedido.codigo_pedido?.toLowerCase().includes(terminoLower)
          const telefonoMatch = pedido.cliente?.telefono?.includes(termino.trim()) // Teléfono sin toLowerCase
          const nombresMatch = pedido.cliente?.nombres?.toLowerCase().includes(terminoLower)
          const apellidosMatch = pedido.cliente?.apellidos?.toLowerCase().includes(terminoLower)
          return codigoMatch || telefonoMatch || nombresMatch || apellidosMatch
        })
      }
      
      // Limitar a 20 resultados para mostrar
      setPedidosDisponibles(resultados.slice(0, 20))
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setBuscandoPedidos(false)
    }
  }

  const buscarClientes = async () => {
    setBuscandoClientes(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`telefono.ilike.%${busquedaCliente}%,nombres.ilike.%${busquedaCliente}%,apellidos.ilike.%${busquedaCliente}%`)
        .limit(5)

      if (error) throw error
      setClientesEncontrados(data || [])
    } catch (error) {
      console.error('Error buscando clientes:', error)
    } finally {
      setBuscandoClientes(false)
    }
  }

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente('')
    setClientesEncontrados([])
    setMostrarFormCliente(false)
  }

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.telefono.trim()) {
      setErrorCliente('El teléfono es obligatorio')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          telefono: nuevoCliente.telefono.trim(),
          nombres: nuevoCliente.nombres.trim() || null,
          apellidos: nuevoCliente.apellidos.trim() || null
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setErrorCliente('Este teléfono ya está registrado')
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      setErrorCliente('Error al crear cliente: ' + error.message)
      return null
    }
  }

  const generarCodigoPedido = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `P-${year}-${random}`
  }

  /**
   * Verificar si el producto ya existe en el pedido
   */
  const verificarProductoEnPedido = async (pedidoId) => {
    const { data, error } = await supabase
      .from('pedido_items')
      .select('id, cantidad')
      .eq('pedido_id', pedidoId)
      .eq('producto_id', producto.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return data // null si no existe, objeto si existe
  }

  /**
   * Incrementar cantidad de un item existente
   */
  const incrementarCantidadItem = async (itemId, cantidadActual) => {
    const { error } = await supabase
      .from('pedido_items')
      .update({ 
        cantidad: cantidadActual + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    if (error) throw error
  }

  /**
   * CREAR PEDIDO_ITEM CON SNAPSHOT
   * Los valores vienen del producto ya calculado con pricingEngine
   */
  const crearPedidoItem = async (pedidoId) => {
    const itemData = {
      pedido_id: pedidoId,
      producto_id: producto.id, // OBLIGATORIO - no se permite sin producto_id
      lista_oferta_id: lista.id,
      
      // SNAPSHOT del producto (valores congelados)
      titulo_articulo: producto.titulo,
      precio_venta_cop: producto.precio_final_cop,
      costo_cop: producto.costo_total_cop,
      // ganancia_cop es columna generada - se calcula automáticamente
      
      // Valores iniciales
      cantidad: 1,
      fue_encontrado: false,
      estado_item: 'solicitado',
      
      // Campos opcionales - se completan después
      talla: null,
      genero: null,
      descripcion_detallada: null
    }

    const { data, error } = await supabase
      .from('pedido_items')
      .insert([itemData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Recalcular totales del pedido
   */
  const recalcularTotalesPedido = async (pedidoId) => {
    const { data: items } = await supabase
      .from('pedido_items')
      .select('cantidad, precio_venta_cop, costo_cop')
      .eq('pedido_id', pedidoId)

    const totales = (items || []).reduce((acc, item) => {
      const cant = item.cantidad || 1
      return {
        total_items: acc.total_items + cant,
        total_venta_cop: acc.total_venta_cop + (item.precio_venta_cop * cant),
        total_costo_cop: acc.total_costo_cop + (item.costo_cop * cant)
      }
    }, { total_items: 0, total_venta_cop: 0, total_costo_cop: 0 })

    totales.total_ganancia_cop = totales.total_venta_cop - totales.total_costo_cop

    await supabase
      .from('pedidos')
      .update({ ...totales, updated_at: new Date().toISOString() })
      .eq('id', pedidoId)
  }

  /**
   * AGREGAR A PEDIDO EXISTENTE
   */
  const agregarAPedidoExistente = async () => {
    if (!pedidoSeleccionado) {
      alert('Selecciona un pedido')
      return
    }

    setLoading(true)
    try {
      // Verificar si el producto ya existe en el pedido
      const itemExistente = await verificarProductoEnPedido(pedidoSeleccionado.id)

      if (itemExistente) {
        const confirmar = window.confirm(
          'Este producto ya existe en el pedido. ¿Deseas aumentar la cantidad?'
        )
        if (confirmar) {
          await incrementarCantidadItem(itemExistente.id, itemExistente.cantidad)
          await recalcularTotalesPedido(pedidoSeleccionado.id)
          onSuccess && onSuccess(pedidoSeleccionado.id, 'cantidad_incrementada')
          handleClose()
        }
        return
      }

      // Crear nuevo item
      await crearPedidoItem(pedidoSeleccionado.id)
      await recalcularTotalesPedido(pedidoSeleccionado.id)
      
      onSuccess && onSuccess(pedidoSeleccionado.id, 'item_agregado')
      handleClose()
    } catch (error) {
      alert('Error al agregar al pedido: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * CREAR NUEVO PEDIDO
   */
  const crearNuevoPedido = async () => {
    // Validar cliente
    let cliente = clienteSeleccionado

    if (!cliente && mostrarFormCliente) {
      cliente = await crearNuevoCliente()
      if (!cliente) return // Error ya mostrado
    }

    if (!cliente) {
      alert('Debes seleccionar o crear un cliente')
      return
    }

    setLoading(true)
    try {
      // Crear pedido
      const codigoPedido = generarCodigoPedido()
      
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert([{
          codigo_pedido: codigoPedido,
          cliente_id: cliente.id,
          estado_pedido: 'nuevo',
          fecha_solicitud: new Date().toISOString(),
          lista_oferta_id: lista.id,
          total_items: 0,
          total_venta_cop: 0,
          total_costo_cop: 0,
          total_ganancia_cop: 0
        }])
        .select()
        .single()

      if (errorPedido) throw errorPedido

      // Crear el item con snapshot del producto
      await crearPedidoItem(pedido.id)
      await recalcularTotalesPedido(pedido.id)

      onSuccess && onSuccess(pedido.id, 'pedido_creado')
      handleClose()
    } catch (error) {
      alert('Error al crear pedido: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPaso(1)
    setPedidoSeleccionado(null)
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    setBusquedaPedido('') // Reset búsqueda de pedidos
    setClientesEncontrados([])
    setMostrarFormCliente(false)
    setNuevoCliente({ telefono: '', nombres: '', apellidos: '' })
    setErrorCliente('')
    setErrorValidacion(null)
    onClose()
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return 'Sin cliente'
    const partes = [cliente.nombres, cliente.apellidos].filter(Boolean)
    return partes.length > 0 ? partes.join(' ') : cliente.telefono
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutrals-grayBorder bg-gradient-to-r from-blue-elegant to-blue-800">
          <div className="text-white">
            <h3 className="font-display text-lg font-semibold">Agregar a Pedido</h3>
            <p className="text-sm text-white/70">
              {paso === 1 ? 'Seleccionar pedido' : 'Crear nuevo pedido'}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/70 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error de validación */}
        {errorValidacion && (
          <div className="mx-5 mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{errorValidacion}</span>
            </div>
          </div>
        )}

        {/* Contenido */}
        {!errorValidacion && (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Info del producto */}
            <div className="bg-neutrals-grayBg rounded-xl p-4 mb-5">
              <p className="text-xs text-neutrals-graySoft mb-1">Producto a agregar</p>
              <p className="font-semibold text-neutrals-black line-clamp-1">{producto?.titulo}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-neutrals-graySoft">
                  Costo: {formatearCOP(producto?.costo_total_cop)}
                </span>
                <span className="font-semibold text-blue-elegant">
                  Venta: {formatearCOP(producto?.precio_final_cop)}
                </span>
              </div>
            </div>

            {/* PASO 1: Seleccionar pedido */}
            {paso === 1 && (
              <>
                {/* Opción A: Pedidos existentes */}
                <div className="mb-6">
                  <h4 className="font-semibold text-neutrals-black mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-elegant text-white rounded-full flex items-center justify-center text-xs">A</span>
                    Agregar a pedido existente
                  </h4>

                  {/* Campo de búsqueda de pedidos */}
                  <div className="relative mb-3">
                    <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={busquedaPedido}
                      onChange={(e) => setBusquedaPedido(e.target.value)}
                      className="input-chic text-sm w-full"
                      style={{ paddingLeft: '2.5rem', paddingRight: busquedaPedido ? '2.5rem' : '0.75rem' }}
                      placeholder="Buscar por código, cliente o teléfono..."
                    />
                    {busquedaPedido && (
                      <button
                        onClick={() => setBusquedaPedido('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutrals-graySoft hover:text-neutrals-black"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {buscandoPedidos ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : pedidosDisponibles.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-neutrals-graySoft">
                        {busquedaPedido.trim() 
                          ? `No se encontraron pedidos para "${busquedaPedido}"`
                          : 'No hay pedidos activos disponibles'
                        }
                      </p>
                      {busquedaPedido.trim() && (
                        <button
                          onClick={() => setBusquedaPedido('')}
                          className="text-sm text-blue-elegant hover:underline mt-2"
                        >
                          Ver todos los pedidos
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pedidosDisponibles.map((pedido) => (
                        <button
                          key={pedido.id}
                          onClick={() => setPedidoSeleccionado(pedido)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            pedidoSeleccionado?.id === pedido.id
                              ? 'border-blue-elegant bg-blue-elegant/5'
                              : 'border-neutrals-grayBorder hover:border-blue-elegant/50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white text-xs font-bold">
                            {pedido.total_items || 0}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutrals-black">
                              {pedido.codigo_pedido}
                            </p>
                            <p className="text-xs text-neutrals-graySoft truncate">
                              {getNombreCliente(pedido.cliente)} • {pedido.estado_pedido}
                            </p>
                          </div>
                          {pedidoSeleccionado?.id === pedido.id && (
                            <svg className="w-5 h-5 text-blue-elegant" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {pedidoSeleccionado && (
                    <button
                      onClick={agregarAPedidoExistente}
                      disabled={loading}
                      className="w-full btn-primary mt-4"
                    >
                      {loading ? 'Agregando...' : `Agregar a ${pedidoSeleccionado.codigo_pedido}`}
                    </button>
                  )}
                </div>

                {/* Separador */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-neutrals-grayBorder"></div>
                  <span className="text-sm text-neutrals-graySoft">o</span>
                  <div className="flex-1 h-px bg-neutrals-grayBorder"></div>
                </div>

                {/* Opción B: Nuevo pedido */}
                <div>
                  <h4 className="font-semibold text-neutrals-black mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">B</span>
                    Crear nuevo pedido
                  </h4>
                  <button
                    onClick={() => setPaso(2)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Pedido Nuevo
                  </button>
                </div>
              </>
            )}

            {/* PASO 2: Crear nuevo pedido */}
            {paso === 2 && (
              <div>
                <button
                  onClick={() => setPaso(1)}
                  className="text-sm text-blue-elegant hover:underline mb-4 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver
                </button>

                <h4 className="font-semibold text-neutrals-black mb-4">
                  Seleccionar Cliente
                </h4>

                {/* Cliente seleccionado */}
                {clienteSeleccionado ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                          {(clienteSeleccionado.nombres?.[0] || clienteSeleccionado.telefono?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-neutrals-black">
                            {getNombreCliente(clienteSeleccionado)}
                          </p>
                          <p className="text-sm text-neutrals-graySoft">
                            {clienteSeleccionado.telefono}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setClienteSeleccionado(null)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ) : !mostrarFormCliente ? (
                  <>
                    {/* Buscador de clientes */}
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Buscar por teléfono o nombre..."
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        className="input-chic pl-10 w-full"
                      />
                      <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Resultados */}
                    {clientesEncontrados.length > 0 && (
                      <div className="border border-neutrals-grayBorder rounded-xl overflow-hidden mb-4">
                        {clientesEncontrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => seleccionarCliente(cliente)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-neutrals-grayBg transition-colors text-left border-b last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-elegant flex items-center justify-center text-white text-sm">
                              {(cliente.nombres?.[0] || cliente.telefono?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-neutrals-black text-sm">
                                {getNombreCliente(cliente)}
                              </p>
                              <p className="text-xs text-neutrals-graySoft">
                                {cliente.telefono}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setMostrarFormCliente(true)
                        if (/^[0-9+\-\s()]+$/.test(busquedaCliente)) {
                          setNuevoCliente(prev => ({ ...prev, telefono: busquedaCliente }))
                        }
                      }}
                      className="w-full text-sm text-blue-elegant hover:underline"
                    >
                      + Crear cliente nuevo
                    </button>
                  </>
                ) : (
                  /* Formulario nuevo cliente */
                  <div className="border border-neutrals-grayBorder rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Nuevo Cliente</span>
                      <button
                        onClick={() => setMostrarFormCliente(false)}
                        className="text-xs text-neutrals-graySoft hover:text-neutrals-black"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutrals-grayStrong mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={nuevoCliente.telefono}
                        onChange={(e) => {
                          setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))
                          setErrorCliente('')
                        }}
                        className={`input-chic text-sm ${errorCliente ? 'border-red-500' : ''}`}
                        placeholder="+57 300 123 4567"
                      />
                      {errorCliente && (
                        <p className="text-red-500 text-xs mt-1">{errorCliente}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-neutrals-grayStrong mb-1">
                          Nombres
                        </label>
                        <input
                          type="text"
                          value={nuevoCliente.nombres}
                          onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombres: e.target.value }))}
                          className="input-chic text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutrals-grayStrong mb-1">
                          Apellidos
                        </label>
                        <input
                          type="text"
                          value={nuevoCliente.apellidos}
                          onChange={(e) => setNuevoCliente(prev => ({ ...prev, apellidos: e.target.value }))}
                          className="input-chic text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón crear pedido */}
                {(clienteSeleccionado || mostrarFormCliente) && (
                  <button
                    onClick={crearNuevoPedido}
                    disabled={loading}
                    className="w-full btn-primary mt-6"
                  >
                    {loading ? 'Creando pedido...' : 'Crear Pedido y Agregar Producto'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer con info */}
        <div className="p-4 border-t border-neutrals-grayBorder bg-neutrals-grayBg/50">
          <p className="text-xs text-neutrals-graySoft text-center">
            💡 Los precios se guardan como snapshot al momento de agregar
          </p>
        </div>
      </div>
    </div>
  )
}
