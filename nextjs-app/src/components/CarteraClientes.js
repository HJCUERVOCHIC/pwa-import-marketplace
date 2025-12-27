'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// =====================================================
// CONSTANTES Y CONFIGURACIÓN
// =====================================================

const ESTADOS_CARTERA = {
  al_dia: { label: 'Al día', color: 'green', icon: '✓', bgClass: 'bg-green-100 text-green-800' },
  pendiente: { label: 'Pendiente', color: 'amber', icon: '⏳', bgClass: 'bg-amber-100 text-amber-800' },
  vencido: { label: 'Vencido', color: 'red', icon: '⚠', bgClass: 'bg-red-100 text-red-800' }
}

const FILTROS_CARTERA = [
  { key: 'con_deuda', label: 'Todos', color: 'blue-elegant' },
  { key: 'vencido', label: 'Vencidos', color: 'red-500' },
  { key: 'pendiente', label: 'Pendientes', color: 'amber-500' }
]

// =====================================================
// UTILIDADES
// =====================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

const formatPeriodo = (periodo) => {
  if (!periodo) return 'Sin período'
  const [year, month] = periodo.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${meses[parseInt(month) - 1]} ${year}`
}

// =====================================================
// COMPONENTE: BADGE DE ESTADO CARTERA
// =====================================================

const BadgeEstadoCartera = ({ estado, size = 'sm' }) => {
  const config = ESTADOS_CARTERA[estado] || ESTADOS_CARTERA.pendiente
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm'
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgClass} ${sizeClasses}`}>
      {config.icon} {config.label}
    </span>
  )
}

// =====================================================
// COMPONENTE: CARD DE CLIENTE CON DEUDA
// =====================================================

const ClienteDeudaCard = ({ cliente }) => {
  const porcentajePagado = cliente.total_ventas_cop > 0
    ? Math.round((cliente.total_abonado_cop / cliente.total_ventas_cop) * 100)
    : 100

  const nombreCompleto = cliente.alias_whatsapp || 
    `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 
    'Sin nombre'

  // Determinar color de la barra según estado
  const barraColor = cliente.estado_cartera_cliente === 'vencido' 
    ? 'bg-red-500' 
    : cliente.estado_cartera_cliente === 'pendiente'
    ? 'bg-amber-500'
    : 'bg-green-500'

  return (
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-neutrals-grayBorder cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-neutrals-black">{nombreCompleto}</h4>
          <p className="text-sm text-neutrals-graySoft">{cliente.telefono}</p>
        </div>
        <BadgeEstadoCartera estado={cliente.estado_cartera_cliente} />
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="h-2 bg-neutrals-grayBg rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${barraColor}`}
            style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-neutrals-graySoft">
          <span>{porcentajePagado}% pagado</span>
          <span>{cliente.total_pedidos} pedidos</span>
        </div>
      </div>

      {/* Estadísticas de cartera */}
      {cliente.pedidos_vencidos > 0 && (
        <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <span>⚠</span>
            <span className="font-medium">{cliente.pedidos_vencidos} pedido{cliente.pedidos_vencidos > 1 ? 's' : ''} vencido{cliente.pedidos_vencidos > 1 ? 's' : ''}</span>
            <span className="ml-auto font-bold">{formatCurrency(cliente.deuda_vencida_cop)}</span>
          </div>
        </div>
      )}

      {/* Valores */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutrals-graySoft">Total compras</span>
          <span className="font-medium">{formatCurrency(cliente.total_ventas_cop)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutrals-graySoft">Total pagado</span>
          <span className="font-medium text-green-600">{formatCurrency(cliente.total_abonado_cop)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-neutrals-grayBorder">
          <span className="font-medium text-neutrals-black">Deuda total</span>
          <span className={`font-bold ${
            cliente.estado_cartera_cliente === 'vencido' ? 'text-red-600' :
            cliente.estado_cartera_cliente === 'pendiente' ? 'text-amber-600' : 
            'text-green-600'
          }`}>
            {formatCurrency(cliente.deuda_total_cop)}
          </span>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE: CARTERA POR PERÍODO
// =====================================================

const CarteraPorPeriodo = ({ datos }) => {
  if (!datos || datos.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-neutrals-grayBorder">
        <h3 className="font-medium text-neutrals-black flex items-center gap-2">
          📅 Cartera por Período de Venta
        </h3>
        <p className="text-sm text-neutrals-graySoft mt-1">
          Análisis de cartera según el mes en que se confirmó cada venta
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutrals-grayBg">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutrals-grayStrong">Período</th>
              <th className="px-4 py-3 text-right font-medium text-neutrals-grayStrong">Ventas</th>
              <th className="px-4 py-3 text-right font-medium text-neutrals-grayStrong">Recaudado</th>
              <th className="px-4 py-3 text-right font-medium text-neutrals-grayStrong">Pendiente</th>
              <th className="px-4 py-3 text-right font-medium text-neutrals-grayStrong">Vencido</th>
              <th className="px-4 py-3 text-center font-medium text-neutrals-grayStrong">% Recaudo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutrals-grayBorder">
            {datos.map((periodo) => (
              <tr key={periodo.periodo_venta} className="hover:bg-neutrals-grayBg/50">
                <td className="px-4 py-3 font-medium">{formatPeriodo(periodo.periodo_venta)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(periodo.total_ventas_cop)}</td>
                <td className="px-4 py-3 text-right text-green-600">
                  {formatCurrency(periodo.total_ventas_cop - periodo.cartera_total_cop)}
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatCurrency(periodo.cartera_pendiente_cop)}
                </td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">
                  {formatCurrency(periodo.cartera_vencida_cop)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-neutrals-grayBg rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          periodo.porcentaje_recaudo >= 80 ? 'bg-green-500' :
                          periodo.porcentaje_recaudo >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${periodo.porcentaje_recaudo}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{periodo.porcentaje_recaudo}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL: CARTERA DE CLIENTES
// =====================================================

export default function CarteraClientes() {
  const [clientes, setClientes] = useState([])
  const [carteraPeriodo, setCarteraPeriodo] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('con_deuda')
  const [busqueda, setBusqueda] = useState('')
  const [ordenPor, setOrdenPor] = useState('deuda_desc')
  const [vistaActiva, setVistaActiva] = useState('clientes') // 'clientes' | 'periodos'

  // Cargar datos de cartera
  const cargarCartera = async () => {
    setLoading(true)
    try {
      // Cargar vista de clientes con estado de cartera
      const { data: clientesData, error: clientesError } = await supabase
        .from('vista_deuda_clientes')
        .select('*')

      if (clientesError) {
        console.error('Error cargando clientes:', clientesError)
        // Fallback: consulta manual si la vista no existe
        await cargarCarteraManual()
        return
      }

      setClientes(clientesData || [])

      // Cargar vista de cartera por período
      const { data: periodoData, error: periodoError } = await supabase
        .from('vista_cartera_por_periodo')
        .select('*')
        .order('periodo_venta', { ascending: false })
        .limit(12)

      if (!periodoError) {
        setCarteraPeriodo(periodoData || [])
      }

      // Cargar resumen ejecutivo
      const { data: resumenData, error: resumenError } = await supabase
        .from('vista_resumen_cartera')
        .select('*')
        .single()

      if (!resumenError && resumenData) {
        setResumen(resumenData)
      }

    } catch (err) {
      console.error('Error cargando cartera:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fallback: cargar cartera manualmente si las vistas no existen
  const cargarCarteraManual = async () => {
    try {
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select(`
          id,
          telefono,
          nombres,
          apellidos,
          alias_whatsapp
        `)

      if (clientesError) throw clientesError

      const clientesConDeuda = await Promise.all(
        clientesData.map(async (cliente) => {
          const { data: pedidosData } = await supabase
            .from('pedidos')
            .select('total_venta_cop, total_abonado_cop, saldo_cop, estado_pedido, estado_cartera')
            .eq('cliente_id', cliente.id)
            .not('estado_pedido', 'in', '(cancelado,rechazado)')

          const pedidos = pedidosData || []
          const pedidosVencidos = pedidos.filter(p => p.estado_cartera === 'vencido')
          const pedidosPendientes = pedidos.filter(p => p.estado_cartera === 'pendiente')
          
          // Determinar estado del cliente
          let estadoCliente = 'al_dia'
          if (pedidosVencidos.length > 0) estadoCliente = 'vencido'
          else if (pedidosPendientes.length > 0) estadoCliente = 'pendiente'
          
          return {
            cliente_id: cliente.id,
            telefono: cliente.telefono,
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            alias_whatsapp: cliente.alias_whatsapp,
            total_pedidos: pedidos.length,
            pedidos_con_saldo: pedidos.filter(p => (p.saldo_cop || 0) > 0).length,
            pedidos_vencidos: pedidosVencidos.length,
            pedidos_pendientes: pedidosPendientes.length,
            total_ventas_cop: pedidos.reduce((sum, p) => sum + (p.total_venta_cop || 0), 0),
            total_abonado_cop: pedidos.reduce((sum, p) => sum + (p.total_abonado_cop || 0), 0),
            deuda_total_cop: pedidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0),
            deuda_vencida_cop: pedidosVencidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0),
            estado_cartera_cliente: estadoCliente
          }
        })
      )

      setClientes(clientesConDeuda)
    } catch (err) {
      console.error('Error en carga manual:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCartera()
  }, [])

  // Filtrar y ordenar clientes
  const clientesFiltrados = clientes
    .filter(cliente => {
      // Siempre excluir clientes sin deuda (la cartera es para gestionar cobros)
      if (cliente.deuda_total_cop <= 0) return false

      // Filtro por estado de cartera específico
      if (filtro === 'vencido' && cliente.estado_cartera_cliente !== 'vencido') return false
      if (filtro === 'pendiente' && cliente.estado_cartera_cliente !== 'pendiente') return false
      // 'con_deuda' muestra todos los que tienen deuda (ya filtrados arriba)

      // Filtro por búsqueda
      if (busqueda) {
        const search = busqueda.toLowerCase()
        const nombre = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toLowerCase()
        const alias = (cliente.alias_whatsapp || '').toLowerCase()
        const telefono = (cliente.telefono || '').toLowerCase()
        
        return nombre.includes(search) || alias.includes(search) || telefono.includes(search)
      }

      return true
    })
    .sort((a, b) => {
      switch (ordenPor) {
        case 'deuda_desc':
          return b.deuda_total_cop - a.deuda_total_cop
        case 'deuda_asc':
          return a.deuda_total_cop - b.deuda_total_cop
        case 'vencido_primero':
          // Ordenar por estado: vencido > pendiente > al_dia
          const orden = { vencido: 0, pendiente: 1, al_dia: 2 }
          return (orden[a.estado_cartera_cliente] || 2) - (orden[b.estado_cartera_cliente] || 2)
        case 'nombre':
          return (a.nombres || '').localeCompare(b.nombres || '')
        default:
          return 0
      }
    })

  // Calcular totales para resumen
  const totales = resumen || {
    total_clientes: clientes.length,
    clientes_con_deuda: clientes.filter(c => c.deuda_total_cop > 0).length,
    clientes_con_vencido: clientes.filter(c => c.estado_cartera_cliente === 'vencido').length,
    total_ventas_cop: clientes.reduce((sum, c) => sum + (c.total_ventas_cop || 0), 0),
    total_recaudado_cop: clientes.reduce((sum, c) => sum + (c.total_abonado_cop || 0), 0),
    cartera_total_cop: clientes.reduce((sum, c) => sum + (c.deuda_total_cop || 0), 0),
    cartera_vencida_cop: clientes.reduce((sum, c) => sum + (c.deuda_vencida_cop || 0), 0),
    cartera_pendiente_cop: clientes.reduce((sum, c) => sum + ((c.deuda_total_cop || 0) - (c.deuda_vencida_cop || 0)), 0)
  }

  // Contar clientes por estado para los badges de filtros (solo con deuda)
  const clientesConDeuda = clientes.filter(c => c.deuda_total_cop > 0)
  const conteosPorEstado = {
    con_deuda: clientesConDeuda.length,
    vencido: clientesConDeuda.filter(c => c.estado_cartera_cliente === 'vencido').length,
    pendiente: clientesConDeuda.filter(c => c.estado_cartera_cliente === 'pendiente').length
  }

  return (
    <div className="space-y-6">
      {/* Resumen general con indicadores de estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-neutrals-black">{totales.total_clientes || clientes.length}</div>
          <div className="text-sm text-neutrals-graySoft">Clientes totales</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
          <div className="text-2xl mb-1">🚨</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totales.cartera_vencida_cop)}</div>
          <div className="text-sm text-neutrals-graySoft">Cartera vencida</div>
          <div className="text-xs text-red-500 mt-1">{totales.clientes_con_vencido || conteosPorEstado.vencido} clientes</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-amber-500">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(totales.cartera_pendiente_cop)}</div>
          <div className="text-sm text-neutrals-graySoft">Cartera pendiente</div>
          <div className="text-xs text-amber-500 mt-1">{conteosPorEstado.pendiente} clientes</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(totales.total_recaudado_cop)}</div>
          <div className="text-sm text-neutrals-graySoft">Total recaudado</div>
          <div className="text-xs text-green-500 mt-1">
            {totales.total_ventas_cop > 0 
              ? Math.round((totales.total_recaudado_cop / totales.total_ventas_cop) * 100)
              : 100}% de ventas
          </div>
        </div>
      </div>

      {/* Tabs de vista */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="flex border-b border-neutrals-grayBorder">
          <button
            onClick={() => setVistaActiva('clientes')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              vistaActiva === 'clientes'
                ? 'text-blue-elegant border-b-2 border-blue-elegant'
                : 'text-neutrals-graySoft hover:text-neutrals-black'
            }`}
          >
            👥 Por Cliente
          </button>
          <button
            onClick={() => setVistaActiva('periodos')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              vistaActiva === 'periodos'
                ? 'text-blue-elegant border-b-2 border-blue-elegant'
                : 'text-neutrals-graySoft hover:text-neutrals-black'
            }`}
          >
            📅 Por Período
          </button>
        </div>

        {vistaActiva === 'clientes' && (
          <div className="p-4">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutrals-graySoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-2 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro por estado de cartera */}
              <div className="flex gap-2 flex-wrap">
                {FILTROS_CARTERA.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setFiltro(key)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                      filtro === key
                        ? `bg-${color} text-white`
                        : 'bg-neutrals-grayBg text-neutrals-grayStrong hover:bg-neutrals-grayBorder'
                    }`}
                    style={filtro === key ? {
                      backgroundColor: key === 'con_deuda' ? '#1e40af' : 
                                      key === 'vencido' ? '#ef4444' :
                                      key === 'pendiente' ? '#f59e0b' : '#22c55e'
                    } : {}}
                  >
                    {label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filtro === key ? 'bg-white/20' : 'bg-neutrals-grayBorder'
                    }`}>
                      {conteosPorEstado[key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ordenar */}
              <select
                value={ordenPor}
                onChange={(e) => setOrdenPor(e.target.value)}
                className="px-4 py-2 border border-neutrals-grayBorder rounded-xl focus:ring-2 focus:ring-blue-elegant focus:border-transparent"
              >
                <option value="vencido_primero">Vencidos primero</option>
                <option value="deuda_desc">Mayor deuda primero</option>
                <option value="deuda_asc">Menor deuda primero</option>
                <option value="nombre">Por nombre</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Contenido según vista activa */}
      {vistaActiva === 'clientes' ? (
        /* Lista de clientes */
        loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-elegant"></div>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-lg font-medium text-neutrals-black mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-neutrals-graySoft">
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay clientes que coincidan con el filtro'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesFiltrados.map((cliente) => (
              <Link 
                key={cliente.cliente_id} 
                href={`/admin/pedidos?cliente=${cliente.cliente_id}`}
              >
                <ClienteDeudaCard cliente={cliente} />
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Vista por período */
        loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-elegant"></div>
          </div>
        ) : (
          <CarteraPorPeriodo datos={carteraPeriodo} />
        )
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE: RESUMEN DEUDA EN DETALLE CLIENTE
// =====================================================

export function ResumenDeudaCliente({ clienteId }) {
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('total_venta_cop, total_abonado_cop, saldo_cop, estado_pedido, estado_cartera')
          .eq('cliente_id', clienteId)
          .not('estado_pedido', 'in', '(cancelado,rechazado)')

        if (error) throw error

        const pedidos = data || []
        const pedidosVencidos = pedidos.filter(p => p.estado_cartera === 'vencido')
        
        const totales = {
          total_pedidos: pedidos.length,
          total_ventas: pedidos.reduce((sum, p) => sum + (p.total_venta_cop || 0), 0),
          total_abonado: pedidos.reduce((sum, p) => sum + (p.total_abonado_cop || 0), 0),
          deuda_total: pedidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0),
          deuda_vencida: pedidosVencidos.reduce((sum, p) => sum + (p.saldo_cop || 0), 0),
          pedidos_vencidos: pedidosVencidos.length
        }

        setDatos(totales)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (clienteId) cargar()
  }, [clienteId])

  if (loading) {
    return <div className="animate-pulse h-24 bg-neutrals-grayBg rounded-xl" />
  }

  if (!datos) return null

  return (
    <div className="bg-gradient-to-r from-blue-elegant to-blue-elegant/80 rounded-xl p-4 text-white">
      <h4 className="font-medium mb-3 opacity-90">Resumen Financiero</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold">{formatCurrency(datos.total_ventas)}</div>
          <div className="text-sm opacity-75">Total compras</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{formatCurrency(datos.deuda_total)}</div>
          <div className="text-sm opacity-75">Deuda actual</div>
        </div>
      </div>
      {datos.deuda_vencida > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2 text-red-200">
            <span>⚠</span>
            <span className="text-sm">{datos.pedidos_vencidos} pedido{datos.pedidos_vencidos > 1 ? 's' : ''} vencido{datos.pedidos_vencidos > 1 ? 's' : ''}</span>
            <span className="ml-auto font-bold">{formatCurrency(datos.deuda_vencida)}</span>
          </div>
        </div>
      )}
    </div>
  )
}