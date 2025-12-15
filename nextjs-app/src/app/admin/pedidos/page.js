'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const ESTADOS_PEDIDO = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-gray-100 text-gray-700' },
  { value: 'en_gestion', label: 'En gestión', color: 'bg-blue-100 text-blue-700' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'en_compra', label: 'En compra', color: 'bg-orange-100 text-orange-700' },
  { value: 'en_transito', label: 'En tránsito', color: 'bg-amber-100 text-amber-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' }
]

export default function PedidosPage() {
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get('cliente')
  
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    if (clienteIdParam) {
      setFiltroCliente(clienteIdParam)
    }
    cargarPedidos()
  }, [clienteIdParam])

  const cargarPedidos = async () => {
    setLoading(true)
    
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          id,
          telefono,
          nombres,
          apellidos,
          alias_whatsapp
        )
      `)
      .order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (!error) {
      setPedidos(data || [])
    }
    setLoading(false)
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && pedido.estado_pedido !== filtroEstado) {
      return false
    }
    
    // Filtro por cliente
    if (filtroCliente) {
      const cliente = pedido.clientes
      const matchCliente = 
        cliente?.telefono?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        cliente?.nombres?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        cliente?.apellidos?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        cliente?.alias_whatsapp?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
        cliente?.id === filtroCliente
      if (!matchCliente) return false
    }
    
    // Filtro por fecha desde
    if (fechaDesde) {
      const fechaPedido = new Date(pedido.fecha_solicitud)
      const desde = new Date(fechaDesde)
      if (fechaPedido < desde) return false
    }
    
    // Filtro por fecha hasta
    if (fechaHasta) {
      const fechaPedido = new Date(pedido.fecha_solicitud)
      const hasta = new Date(fechaHasta + 'T23:59:59')
      if (fechaPedido > hasta) return false
    }
    
    return true
  })

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

  const getEstadoInfo = (estado) => {
    return ESTADOS_PEDIDO.find(e => e.value === estado) || ESTADOS_PEDIDO[0]
  }

  const getNombreCliente = (cliente) => {
    if (!cliente) return 'Sin cliente'
    if (cliente.alias_whatsapp) return cliente.alias_whatsapp
    if (cliente.nombres || cliente.apellidos) {
      return [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ')
    }
    return cliente.telefono
  }

  const limpiarFiltros = () => {
    setFiltroEstado('todos')
    setFiltroCliente('')
    setFechaDesde('')
    setFechaHasta('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pedidos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Seguimiento de pedidos por cliente
              </p>
            </div>
            <Link
              href="/admin/pedidos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo pedido
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro estado */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS_PEDIDO.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
              <input
                type="text"
                placeholder="Teléfono, nombre..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Botón limpiar */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Chips de estado rápido */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filtroEstado === 'todos' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({pedidos.length})
          </button>
          {ESTADOS_PEDIDO.map(estado => {
            const count = pedidos.filter(p => p.estado_pedido === estado.value).length
            return (
              <button
                key={estado.value}
                onClick={() => setFiltroEstado(estado.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filtroEstado === estado.value ? 'bg-blue-800 text-white' : estado.color + ' hover:opacity-80'
                }`}
              >
                {estado.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-500 text-sm mb-4">
              {filtroEstado !== 'todos' || filtroCliente || fechaDesde || fechaHasta 
                ? 'No se encontraron pedidos con los filtros seleccionados' 
                : 'Comienza creando tu primer pedido'}
            </p>
            <Link
              href="/admin/pedidos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear pedido
            </Link>
          </div>
        ) : (
          <>
            {/* Vista desktop - Tabla */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Venta</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidosFiltrados.map((pedido) => {
                    const estadoInfo = getEstadoInfo(pedido.estado_pedido)
                    return (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-800">{pedido.codigo_pedido}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{getNombreCliente(pedido.clientes)}</p>
                            <p className="text-sm text-gray-500">{pedido.clientes?.telefono}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatearFecha(pedido.fecha_solicitud)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatearCOP(pedido.total_venta_cop)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          {formatearCOP(pedido.total_ganancia_cop)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/pedidos/${pedido.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="md:hidden space-y-3">
              {pedidosFiltrados.map((pedido) => {
                const estadoInfo = getEstadoInfo(pedido.estado_pedido)
                return (
                  <Link
                    key={pedido.id}
                    href={`/admin/pedidos/${pedido.id}`}
                    className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-blue-800">{pedido.codigo_pedido}</p>
                        <p className="text-sm text-gray-600">{getNombreCliente(pedido.clientes)}</p>
                        <p className="text-xs text-gray-400">{pedido.clientes?.telefono}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {formatearFecha(pedido.fecha_solicitud)}
                      </span>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatearCOP(pedido.total_venta_cop)}</p>
                        <p className="text-xs text-green-600">+{formatearCOP(pedido.total_ganancia_cop)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
