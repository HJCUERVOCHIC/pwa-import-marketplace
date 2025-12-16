'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

// Estados de pedido con colores
const ESTADOS_PEDIDO = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
  en_gestion: { label: 'En Gestión', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  confirmado: { label: 'Confirmado', color: 'bg-purple-100 text-purple-800', icon: '✅' },
  en_compra: { label: 'En Compra', color: 'bg-orange-100 text-orange-800', icon: '🛒' },
  en_transito: { label: 'En Tránsito', color: 'bg-cyan-100 text-cyan-800', icon: '✈️' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: '📦' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' }
}

// Componente interno que usa useSearchParams
function PedidosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get('cliente')

  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [clienteFiltro, setClienteFiltro] = useState(null)

  useEffect(() => {
    checkAuth()
    if (clienteIdParam) {
      cargarClienteFiltro(clienteIdParam)
    }
    cargarPedidos()
  }, [clienteIdParam])

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPedidos()
    }, 300)
    return () => clearTimeout(timer)
  }, [filtroEstado, busqueda])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
    }
  }

  const cargarClienteFiltro = async (clienteId) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, telefono, nombres, apellidos')
        .eq('id', clienteId)
        .single()

      if (!error && data) {
        setClienteFiltro(data)
      }
    } catch (error) {
      console.error('Error cargando cliente:', error)
    }
  }

  const cargarPedidos = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(id, telefono, nombres, apellidos, alias_whatsapp)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filtro por cliente (desde URL)
      if (clienteIdParam) {
        query = query.eq('cliente_id', clienteIdParam)
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        query = query.eq('estado_pedido', filtroEstado)
      }

      // Búsqueda por código de pedido
      if (busqueda.trim()) {
        query = query.ilike('codigo_pedido', `%${busqueda}%`)
      }

      const { data, error, count } = await query

      if (error) throw error
      setPedidos(data || [])
      setTotalPedidos(count || 0)
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setLoading(false)
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

  const limpiarFiltroCliente = () => {
    setClienteFiltro(null)
    router.push('/admin/pedidos')
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b-[3px] border-blue-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutrals-black">
                Pedidos
              </h1>
              <p className="text-neutrals-graySoft text-sm mt-1">
                {totalPedidos} pedido{totalPedidos !== 1 ? 's' : ''}
                {clienteFiltro && (
                  <span className="ml-2">
                    de <strong>{getNombreCliente(clienteFiltro)}</strong>
                    <button 
                      onClick={limpiarFiltroCliente}
                      className="ml-2 text-blue-elegant hover:underline"
                    >
                      (ver todos)
                    </button>
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-chic pl-10 w-full sm:w-48"
                />
                <svg className="w-5 h-5 text-neutrals-graySoft absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filtro por estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="input-chic w-full sm:w-auto"
              >
                <option value="todos">Todos los estados</option>
                {Object.entries(ESTADOS_PEDIDO).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>

              {/* Botón Nuevo Pedido */}
              <Link
                href="/admin/pedidos/nuevo"
                className="btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nuevo Pedido</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutrals-graySoft">Cargando pedidos...</p>
            </div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutrals-grayBg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-neutrals-black mb-2">
              {busqueda || filtroEstado !== 'todos' ? 'No se encontraron pedidos' : 'Sin pedidos aún'}
            </h3>
            <p className="text-neutrals-graySoft mb-6">
              {busqueda || filtroEstado !== 'todos'
                ? 'Intenta con otros filtros de búsqueda'
                : 'Crea tu primer pedido para comenzar'}
            </p>
            {!busqueda && filtroEstado === 'todos' && (
              <Link href="/admin/pedidos/nuevo" className="btn-primary">
                Crear Pedido
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Grid de Pedidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pedidos.map((pedido) => {
                const estadoInfo = ESTADOS_PEDIDO[pedido.estado_pedido] || ESTADOS_PEDIDO.nuevo
                
                return (
                  <Link
                    key={pedido.id}
                    href={`/admin/pedidos/${pedido.id}`}
                    className="card-premium p-5 hover:shadow-lg transition-shadow group"
                  >
                    {/* Header del pedido */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-display font-bold text-lg text-neutrals-black group-hover:text-blue-elegant transition-colors">
                          {pedido.codigo_pedido || `#${pedido.id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-neutrals-graySoft">
                          {formatearFecha(pedido.fecha_solicitud || pedido.created_at)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                        {estadoInfo.icon} {estadoInfo.label}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutrals-grayBorder">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-elegant to-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                        {(pedido.cliente?.nombres?.[0] || pedido.cliente?.telefono?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutrals-black truncate">
                          {getNombreCliente(pedido.cliente)}
                        </p>
                        <p className="text-sm text-neutrals-graySoft truncate">
                          {pedido.cliente?.telefono}
                        </p>
                      </div>
                    </div>

                    {/* Totales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutrals-graySoft">Items</p>
                        <p className="font-semibold text-neutrals-black">
                          {pedido.total_items || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutrals-graySoft">Total Venta</p>
                        <p className="font-semibold text-neutrals-black">
                          {formatearCOP(pedido.total_venta_cop)}
                        </p>
                      </div>
                    </div>

                    {/* Ganancia */}
                    {pedido.total_ganancia_cop > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutrals-grayBorder">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-neutrals-graySoft">Ganancia</span>
                          <span className="font-semibold text-green-600">
                            {formatearCOP(pedido.total_ganancia_cop)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fechas de envío/entrega */}
                    {(pedido.fecha_probable_envio || pedido.fecha_entrega) && (
                      <div className="mt-3 pt-3 border-t border-neutrals-grayBorder space-y-1">
                        {pedido.fecha_probable_envio && (
                          <div className="flex justify-between text-xs">
                            <span className="text-neutrals-graySoft">Envío aprox:</span>
                            <span className="text-neutrals-grayStrong">{formatearFecha(pedido.fecha_probable_envio)}</span>
                          </div>
                        )}
                        {pedido.fecha_entrega && (
                          <div className="flex justify-between text-xs">
                            <span className="text-neutrals-graySoft">Entrega:</span>
                            <span className="text-green-600 font-medium">{formatearFecha(pedido.fecha_entrega)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </>
  )
}

// Componente de loading para Suspense
function LoadingPedidos() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-elegant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutrals-graySoft">Cargando...</p>
      </div>
    </div>
  )
}

// Componente principal envuelto en Suspense
export default function PedidosPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingPedidos />}>
        <PedidosContent />
      </Suspense>
    </AdminLayout>
  )
}
